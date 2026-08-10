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

function describeHeuristic(label: string, matchingCount: number, recentCount: number): string {
  if (recentCount === 1) return `Your ${label} came up in your last match.`;
  if (matchingCount === 1) return `Your ${label} came up in a recent match.`;
  return `Your ${label} got flagged in ${matchingCount} of your last ${recentCount} matches.`;
}

async function runHeuristic(
  playerId: string,
  recent: Match[],
  // A passive refresh (a new match came in) only skips a label that's
  // currently active — the same weakness showing up again in fresh match
  // data is genuinely new evidence. A forced manual refresh (no new match,
  // just asking for more) has no new evidence, so re-surfacing a label
  // already shown at ANY point (dismissed or not) would just be a literal
  // repeat — skip those too.
  excludeAnyPastLabel = false
): Promise<boolean> {
  const existing = await listInsights(playerId);
  let addedAny = false;

  for (const rule of RULES) {
    const matching = recent.filter((m) => rule.keyword.test(m.selfReflection.whatToImprove));
    if (matching.length === 0) continue;

    const alreadyShown = existing.some(
      (i) =>
        (excludeAnyPastLabel || i.status === 'active') &&
        i.patternDescription.toLowerCase().includes(rule.label)
    );
    if (alreadyShown) continue;

    addedAny = true;
    const insight: PracticeInsight = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      ownerPlayerId: playerId,
      patternDescription: describeHeuristic(rule.label, matching.length, recent.length),
      suggestedDrill: rule.drill,
      drillSearchQuery: rule.searchQuery,
      sourceMatchIds: matching.map((m) => m.id),
      status: 'active',
    };
    await saveInsight(playerId, insight);
  }

  return addedAny;
}

// --- Real AI path ---

interface AiPattern {
  pattern: string;
  drill: string;
  searchQuery: string;
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
    // Fresh AI analysis supersedes the previous active nudges.
    const existing = await listInsights(playerId);
    await Promise.all(
      existing
        .filter((i) => i.status === 'active')
        .map((i) => saveInsight(playerId, { ...i, status: 'dismissed' }))
    );
    await Promise.all(
      aiPatterns.map((p) =>
        saveInsight(playerId, {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          ownerPlayerId: playerId,
          patternDescription: p.pattern,
          suggestedDrill: p.drill,
          drillSearchQuery: p.searchQuery,
          sourceMatchIds: recent.map((m) => m.id),
          status: 'active',
        })
      )
    );
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
