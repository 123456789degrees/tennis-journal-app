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
}

const RULES: KeywordRule[] = [
  {
    keyword: /backhand/i,
    label: 'backhand',
    drill: 'Cross-court backhand consistency — hit 20 in a row, then work the inside-out forehand to run around it.',
  },
  {
    keyword: /forehand/i,
    label: 'forehand',
    drill: 'Forehand depth and consistency drill — 20 balls cross-court, then 20 down the line.',
  },
  {
    keyword: /serve/i,
    label: 'serve',
    drill: 'Second-serve spin and placement — 20 serves at 75% pace, aiming for the corners.',
  },
  {
    keyword: /footwork|movement/i,
    label: 'footwork',
    drill: 'Split-step and recovery footwork ladder drills before hitting live points.',
  },
  {
    keyword: /volley|net/i,
    label: 'net game',
    drill: 'Volley punch drill at the net, focusing on a short, compact swing.',
  },
];

function describeHeuristic(label: string, matchingCount: number, recentCount: number): string {
  if (recentCount === 1) return `Your ${label} came up in your last match.`;
  if (matchingCount === 1) return `Your ${label} came up in a recent match.`;
  return `Your ${label} got flagged in ${matchingCount} of your last ${recentCount} matches.`;
}

async function runHeuristic(playerId: string, recent: Match[]): Promise<void> {
  const existing = await listInsights(playerId);

  for (const rule of RULES) {
    const matching = recent.filter((m) => rule.keyword.test(m.selfReflection.whatToImprove));
    if (matching.length === 0) continue;

    const alreadyActive = existing.some(
      (i) => i.status === 'active' && i.patternDescription.toLowerCase().includes(rule.label)
    );
    if (alreadyActive) continue;

    const insight: PracticeInsight = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      ownerPlayerId: playerId,
      patternDescription: describeHeuristic(rule.label, matching.length, recent.length),
      suggestedDrill: rule.drill,
      sourceMatchIds: matching.map((m) => m.id),
      status: 'active',
    };
    await saveInsight(playerId, insight);
  }
}

// --- Real AI path ---

interface AiPattern {
  pattern: string;
  drill: string;
}

async function fetchAiPatterns(recent: Match[]): Promise<AiPattern[] | null> {
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
      }),
    });
    const data = await res.json();
    if (data.error || !Array.isArray(data.patterns)) return null;
    return data.patterns;
  } catch {
    return null;
  }
}

export async function refreshPracticeInsights(playerId: string): Promise<void> {
  const recent = (await listMatches(playerId)).slice(0, LOOKBACK); // already most-recent-first
  if (recent.length === 0) return;

  // Skip re-analysis if nothing new has been logged since last time — avoids
  // firing an API call on every screen focus.
  const latestId = recent[0].id;
  const lastAnalyzed = await getLastAnalyzedMatchId(playerId);
  if (lastAnalyzed === latestId) return;

  const aiPatterns = await fetchAiPatterns(recent);

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
          sourceMatchIds: recent.map((m) => m.id),
          status: 'active',
        })
      )
    );
  } else {
    await runHeuristic(playerId, recent);
  }

  await setLastAnalyzedMatchId(playerId, latestId);
}
