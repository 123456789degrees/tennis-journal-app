import type { Match, PracticeInsight } from './models';
import {
  getLastAnalyzedMatchId,
  listInsights,
  listMatches,
  saveInsight,
  setLastAnalyzedMatchId,
} from './storage';

const LOOKBACK = 8;

// --- Heuristic fallback ---
// Used when OPENROUTER_API_KEY isn't configured, or the API call fails —
// keeps the practice nudge working even with no AI wired up. See
// src/app/api/practice-tips+api.ts for the real AI path.
interface KeywordRule {
  keyword: RegExp;
  label: string;
  drill: string;
  searchQuery: string;
}

const RULES: KeywordRule[] = [
  {
    keyword: /backhand/i,
    label: 'backhand',
    drill: 'Cross-court backhand consistency — hit 20 in a row, then work the inside-out forehand to run around it.',
    searchQuery: 'backhand consistency drill',
  },
  {
    keyword: /forehand/i,
    label: 'forehand',
    drill: 'Forehand depth and consistency drill — 20 balls cross-court, then 20 down the line.',
    searchQuery: 'forehand consistency drill',
  },
  {
    keyword: /serve/i,
    label: 'serve',
    drill: 'Second-serve spin and placement — 20 serves at 75% pace, aiming for the corners.',
    searchQuery: 'second serve spin drill',
  },
  {
    keyword: /footwork|movement/i,
    label: 'footwork',
    drill: 'Split-step and recovery footwork ladder drills before hitting live points.',
    searchQuery: 'tennis footwork ladder drill',
  },
  {
    keyword: /volley|net/i,
    label: 'net game',
    drill: 'Volley punch drill at the net, focusing on a short, compact swing.',
    searchQuery: 'tennis volley drill',
  },
];

// Shared by both the heuristic path (below) and the AI path (in
// runAnalysis) — same "how often, how recent" framing either way, computed
// here from actual indices rather than left to prose written by a rule or
// a model, either of which can get the arithmetic subtly wrong.
function evidenceClause(count: number, windowSize: number, mostRecentIndex: number): string {
  if (mostRecentIndex === 0 && count === 1) return 'in your last match';
  if (mostRecentIndex === 0) return `in ${count} of your last ${windowSize} matches, including your most recent one`;
  if (count === 1) return 'in a recent match';
  return `in ${count} of your last ${windowSize} matches`;
}

function describeHeuristic(label: string, matchingCount: number, recentCount: number, mostRecentIndex: number): string {
  return `Your ${label} has come up ${evidenceClause(matchingCount, recentCount, mostRecentIndex)}.`;
}

// One practice nudge at a time, not a pile of them — and *which* one isn't
// arbitrary: every rule that matches gets scored by how often it shows up
// AND how recently, so "backhand broke down once three months ago" loses
// to "footwork has been an issue in 3 of your last 4 matches, including
// today's." `recent` is already most-recent-first (index 0 = latest), so a
// match's weight is (recent.length - index) — the latest match is worth
// the most, the oldest in the window worth the least — added up per rule
// and combined with raw frequency so both factors actually count.
function scoreRule(matchingIndices: number[], windowSize: number): number {
  const frequency = matchingIndices.length;
  const recencyWeight = matchingIndices.reduce((sum, idx) => sum + (windowSize - idx), 0);
  return frequency * 100 + recencyWeight;
}

async function runHeuristic(
  playerId: string,
  recent: Match[],
  // A forced manual refresh (no new match, just asking for something else)
  // has no new evidence to justify repeating itself, so it excludes every
  // label ever shown before (dismissed or active) — a passive refresh (a
  // new match just came in) only excludes nothing, since fresh match data
  // is genuinely new evidence and the top-scored pattern is allowed to be
  // the same one again if it's still, honestly, the biggest issue.
  excludeAnyPastLabel = false
): Promise<boolean> {
  const existing = await listInsights(playerId);

  let best: { rule: KeywordRule; matching: Match[]; indices: number[]; score: number } | null = null;

  for (const rule of RULES) {
    const indices: number[] = [];
    const matching: Match[] = [];
    recent.forEach((m, i) => {
      if (rule.keyword.test(m.selfReflection.whatToImprove)) {
        indices.push(i);
        matching.push(m);
      }
    });
    if (matching.length === 0) continue;

    if (excludeAnyPastLabel) {
      const alreadyShown = existing.some((i) => i.patternDescription.toLowerCase().includes(rule.label));
      if (alreadyShown) continue;
    }

    const score = scoreRule(indices, recent.length);
    if (!best || score > best.score) {
      best = { rule, matching, indices, score };
    }
  }

  if (!best) return false;

  // Always exactly one active nudge — whichever rule scored highest just
  // now replaces whatever was active before, even if that happens to be
  // the same rule again (still the single biggest issue) or a different
  // one entirely (a bigger issue just overtook it).
  await Promise.all(
    existing.filter((i) => i.status === 'active').map((i) => saveInsight(playerId, { ...i, status: 'dismissed' }))
  );

  const insight: PracticeInsight = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ownerPlayerId: playerId,
    patternDescription: describeHeuristic(best.rule.label, best.matching.length, recent.length, Math.min(...best.indices)),
    suggestedDrill: best.rule.drill,
    drillSearchQuery: best.rule.searchQuery,
    sourceMatchIds: best.matching.map((m) => m.id),
    status: 'active',
  };
  await saveInsight(playerId, insight);
  return true;
}

// --- Real AI path ---

interface AiPattern {
  pattern: string;
  drill: string;
  searchQuery: string;
  // 1-indexed "Match N" numbers the model says support this pattern — see
  // practice-tips+api.ts's prompt. Used to compute a verified evidence
  // clause instead of trusting the model's own count/recency claims.
  matchNumbers: number[];
}

async function fetchAiPatterns(
  recent: Match[],
  excludePatterns: string[]
): Promise<AiPattern[] | null> {
  try {
    const res = await fetch('/api/practice-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matches: recent.map((m) => ({
          date: m.date,
          result: m.result,
          whatWentWell: m.selfReflection.whatWentWell,
          whatToImprove: m.selfReflection.whatToImprove,
        })),
        excludePatterns,
      }),
    });
    const data = await res.json();
    if (data.error || !Array.isArray(data.patterns)) return null;
    return data.patterns;
  } catch {
    return null;
  }
}

async function runAnalysis(
  playerId: string,
  recent: Match[],
  excludePatterns: string[],
  excludeAnyPastLabel: boolean
): Promise<boolean> {
  const aiPatterns = await fetchAiPatterns(recent, excludePatterns);

  if (aiPatterns && aiPatterns.length > 0) {
    // One nudge at a time — the prompt already asks for the single
    // most frequent + most recent weakness, but only ever act on the
    // first result regardless, rather than trusting the model to have
    // limited itself to one.
    const top = aiPatterns[0];

    // Convert the model's cited "Match N" numbers to real indices/ids, and
    // build the evidence clause from those — not from any count the model
    // itself wrote in "pattern". An empty/garbage list (model didn't
    // comply) degrades gracefully to just the bare pattern sentence rather
    // than breaking.
    const validIndices = Array.from(
      new Set(
        (top.matchNumbers ?? [])
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= recent.length)
          .map((n) => n - 1)
      )
    );
    const sourceMatches = validIndices.length > 0 ? validIndices.map((i) => recent[i]) : recent;
    const patternDescription =
      validIndices.length > 0
        ? `${top.pattern} This has come up ${evidenceClause(validIndices.length, recent.length, Math.min(...validIndices))}.`
        : top.pattern;

    // Fresh AI analysis supersedes the previous active nudge.
    const existing = await listInsights(playerId);
    await Promise.all(
      existing
        .filter((i) => i.status === 'active')
        .map((i) => saveInsight(playerId, { ...i, status: 'dismissed' }))
    );
    await saveInsight(playerId, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      ownerPlayerId: playerId,
      patternDescription,
      suggestedDrill: top.drill,
      drillSearchQuery: top.searchQuery,
      sourceMatchIds: sourceMatches.map((m) => m.id),
      status: 'active',
    });
    return true;
  }

  return runHeuristic(playerId, recent, excludeAnyPastLabel);
}

// The passive path — called on every Practice/Home focus. Only re-analyzes
// once a new match has actually been logged, so it's not firing an AI call
// on every screen visit.
export async function refreshPracticeInsights(playerId: string): Promise<void> {
  const recent = (await listMatches(playerId)).slice(0, LOOKBACK); // already most-recent-first
  if (recent.length === 0) return;

  const latestId = recent[0].id;
  const lastAnalyzed = await getLastAnalyzedMatchId(playerId);
  if (lastAnalyzed === latestId) return;

  await runAnalysis(playerId, recent, [], false);
  await setLastAnalyzedMatchId(playerId, latestId);
}

// The manual "Get more drills" path — no new match is required. Since the
// input match data hasn't changed, re-running analysis would otherwise just
// hand back the same pattern already shown; explicitly excludes every
// pattern ever surfaced (any status) so it only returns something genuinely
// different, or nothing if there really isn't anything else to say.
// Returns whether a new insight was actually found.
export async function forceRefreshPracticeInsights(playerId: string): Promise<boolean> {
  const recent = (await listMatches(playerId)).slice(0, LOOKBACK);
  if (recent.length === 0) return false;

  const allPast = await listInsights(playerId);
  const excludePatterns = allPast.map((i) => i.patternDescription);

  return runAnalysis(playerId, recent, excludePatterns, true);
}

// Deleting a match shifts which matches count as "recent" — an insight
// that was active before the delete may now be counting a match that no
// longer exists, or may no longer reflect the real top-8 window at all.
// Dismiss whatever's currently active and clear the "already analyzed"
// marker so the next visit to Practice re-analyzes for real, even if the
// deleted match wasn't the single most-recent one (the usual gate only
// looks at that one id, which wouldn't otherwise notice this change).
export async function invalidateInsightsAfterMatchDeleted(playerId: string): Promise<void> {
  const all = await listInsights(playerId);
  await Promise.all(
    all
      .filter((i) => i.status === 'active')
      .map((i) => saveInsight(playerId, { ...i, status: 'dismissed' }))
  );
  await setLastAnalyzedMatchId(playerId, '');
}
