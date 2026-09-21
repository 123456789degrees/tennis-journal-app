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
//
// A stroke name alone ("forehand") isn't enough to pick a relevant drill —
// "my forehand has no power" and "my forehand keeps missing" are different
// problems needing different practice, and handing both the same canned
// "consistency" drill just because they both mention "forehand" is exactly
// the kind of irrelevant suggestion this is meant to avoid. Each stroke
// below lists qualifier variants checked against the SAME note text, in
// order, before falling back to a generic default.
interface DrillVariant {
  keyword: RegExp;
  drill: string;
  searchQuery: string;
}

interface KeywordRule {
  keyword: RegExp;
  label: string;
  variants: DrillVariant[];
  defaultDrill: string;
  defaultSearchQuery: string;
}

// Every drill below is something you do WITH a partner, feeding or playing
// out real points — not solo repetition against a wall or ball machine. A
// friend testing the app said the drills felt disconnected from "real life
// situations"; the fix is games with actual stakes (a rally that's live,
// a point that's won or lost, a score that moves), even when the practice
// point is still a specific technical fix.
const RULES: KeywordRule[] = [
  {
    keyword: /backhand/i,
    label: 'backhand',
    variants: [
      {
        keyword: /power|weak|soft|no pace|lacks? pace|pushing it/i,
        drill: 'Cross-court backhand battle — rally backhand-to-backhand with a partner; only a shot with real pace past the service line wins the point, anything soft or floaty loses it outright. Play to 11, win by 2.',
        searchQuery: 'backhand power drill',
      },
      {
        keyword: /short|shallow|depth|sitting up|sitter/i,
        drill: 'Backhand depth game — cross-court backhand rally with a partner; any ball landing short of the service line loses the point immediately. First to 11.',
        searchQuery: 'backhand depth drill',
      },
      {
        keyword: /slice|flat|spin|net.{0,15}(a lot|too many)/i,
        drill: 'Topspin-only backhand rally — cross-court with a partner, but a shot with visible slice or a flat, low-margin ball restarts the point instead of counting. Play to 11 and see how many rallies you actually win clean.',
        searchQuery: 'topspin backhand drill',
      },
    ],
    defaultDrill: 'Cross-court backhand battle — rally backhand cross-court only with a partner, first to 15 clean cross-court balls wins the game; loser starts the next one down 0-3.',
    defaultSearchQuery: 'backhand consistency drill',
  },
  {
    keyword: /forehand/i,
    label: 'forehand',
    variants: [
      {
        keyword: /power|weak|soft|no pace|lacks? pace|floaty|floating/i,
        drill: 'Cross-court forehand battle — rally forehand-to-forehand with a partner; only a shot with real pace past the service line wins the point, a soft or floaty ball loses it outright. Play to 11, win by 2.',
        searchQuery: 'forehand power drill',
      },
      {
        keyword: /short|shallow|depth|sitting up|sitter/i,
        drill: 'Forehand depth game — cross-court forehand rally with a partner; any ball landing short of the service line loses the point immediately. First to 11.',
        searchQuery: 'forehand depth drill',
      },
      {
        keyword: /flat|spin|net.{0,15}(a lot|too many)/i,
        drill: 'Topspin-only forehand rally — cross-court with a partner, but a flat, low-margin ball restarts the point instead of counting. Play to 11 and see how many rallies you actually win clean.',
        searchQuery: 'topspin forehand drill',
      },
    ],
    defaultDrill: 'Cross-court forehand battle — 20 balls cross-court with a partner playing it live, then switch to playing out full points starting cross-court only.',
    defaultSearchQuery: 'forehand consistency drill',
  },
  {
    keyword: /serve/i,
    label: 'serve',
    variants: [
      {
        keyword: /power|weak|soft|no pace|lacks? pace|slow/i,
        drill: 'First-serve scoring game — partner returns everything live; you score +1 for an ace or unreturned first serve, 0 if it comes back soft, -1 for a fault. Serve 10 and see if you finish net positive.',
        searchQuery: 'tennis serve power drill',
      },
      {
        keyword: /double fault|fault|consisten|missing|out|net/i,
        drill: 'Serve-and-3 pressure game — partner returns live and you play the point out for real, but a first serve only "counts" as a good hold if you win the point within the first three shots. Track your real first-serve percentage under that pressure, not just an isolated toss.',
        searchQuery: 'tennis serve consistency drill',
      },
    ],
    defaultDrill: 'Second-serve target game — partner returns live; call a corner (wide/body/T) before each serve and only score it as a win if you hit that target and win the point outright.',
    defaultSearchQuery: 'second serve spin drill',
  },
  {
    keyword: /footwork|movement/i,
    label: 'footwork',
    variants: [
      {
        keyword: /recovery|reset|center/i,
        drill: 'Live recovery drill — partner feeds to alternating corners and you play the point out live; every ball you must split-step and fully recover to center before the next one arrives, or the point gets replayed against you.',
        searchQuery: 'tennis recovery footwork drill',
      },
      {
        keyword: /slow|late|behind|reaction/i,
        drill: 'Reaction rally — partner mixes cross-court and down-the-line feeds mid-point unpredictably while you play it out live; track how many times you’re late on the first step.',
        searchQuery: 'tennis reaction footwork drill',
      },
    ],
    defaultDrill: 'Two-ball-then-live drill — partner feeds two balls to opposite corners before every point starts live, forcing real recovery before you actually play it out.',
    defaultSearchQuery: 'tennis footwork ladder drill',
  },
  {
    keyword: /volley|net/i,
    label: 'net game',
    variants: [
      {
        keyword: /power|hard|smash|overhead/i,
        drill: 'Approach-and-finish game — partner feeds a short ball, you approach and must finish the next shot as a real volley or overhead putaway to win the point; a soft block-back doesn’t count.',
        searchQuery: 'tennis overhead put away drill',
      },
    ],
    defaultDrill: 'Net pressure game — play out live points starting with you at net; partner tries to pass or lob you, and you must finish with a real volley (not a block) to win the point.',
    defaultSearchQuery: 'tennis volley drill',
  },
];

function pickDrill(rule: KeywordRule, noteText: string): { drill: string; searchQuery: string } {
  const variant = rule.variants.find((v) => v.keyword.test(noteText));
  return variant
    ? { drill: variant.drill, searchQuery: variant.searchQuery }
    : { drill: rule.defaultDrill, searchQuery: rule.defaultSearchQuery };
}

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

  // The drill itself is picked from the MOST RECENT matching note's actual
  // wording, not the rule in the abstract — "forehand had no power" two
  // matches ago shouldn't win out over "forehand keeps missing" in the
  // latest one when deciding which specific drill to suggest right now.
  const mostRecentIdx = Math.min(...best.indices);
  const mostRecentNote = recent[mostRecentIdx].selfReflection.whatToImprove;
  const { drill, searchQuery } = pickDrill(best.rule, mostRecentNote);

  const insight: PracticeInsight = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ownerPlayerId: playerId,
    patternDescription: describeHeuristic(best.rule.label, best.matching.length, recent.length, mostRecentIdx),
    suggestedDrill: drill,
    drillSearchQuery: searchQuery,
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
