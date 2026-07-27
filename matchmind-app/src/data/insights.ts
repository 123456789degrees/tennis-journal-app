import type { PracticeInsight } from './models';
import { listInsights, listMatches, saveInsight } from './storage';

// Placeholder heuristic — TRANSFER-PACKAGE.md flags the self-reflection →
// Practice/Insights pipeline as an open implementation question (likely an
// LLM call over recent match text in a real build). This keyword-matches
// "what to improve" notes across recent matches so the practice nudge has
// something real to show until that's wired up.
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

const LOOKBACK = 5;
// A single mention is enough to surface a nudge — no need to wait for a
// pattern across several matches before saying anything.
const THRESHOLD = 1;

function describe(label: string, matchingCount: number, recentCount: number): string {
  if (recentCount === 1) return `Your ${label} came up in your last match.`;
  if (matchingCount === 1) return `Your ${label} came up in a recent match.`;
  return `Your ${label} got flagged in ${matchingCount} of your last ${recentCount} matches.`;
}

export async function refreshPracticeInsights(playerId: string): Promise<void> {
  const recent = (await listMatches(playerId)).slice(0, LOOKBACK);
  if (recent.length < THRESHOLD) return;

  const existing = await listInsights(playerId);

  for (const rule of RULES) {
    const matching = recent.filter((m) => rule.keyword.test(m.selfReflection.whatToImprove));
    if (matching.length < THRESHOLD) continue;

    const alreadyActive = existing.some(
      (i) => i.status === 'active' && i.patternDescription.toLowerCase().includes(rule.label)
    );
    if (alreadyActive) continue;

    const insight: PracticeInsight = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      ownerPlayerId: playerId,
      patternDescription: describe(rule.label, matching.length, recent.length),
      suggestedDrill: rule.drill,
      sourceMatchIds: matching.map((m) => m.id),
      status: 'active',
    };
    await saveInsight(playerId, insight);
  }
}
