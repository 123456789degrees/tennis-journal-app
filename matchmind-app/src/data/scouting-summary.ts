import type { Match, ScoutingNotes } from './models';

// Placeholder heuristic — TRANSFER-PACKAGE.md flags real scouting synthesis
// (likely an LLM call over match history in a real build) as an open
// question. This looks across every match played against an opponent —
// weighted toward the most recent ones — instead of just echoing back
// whatever was typed in the last match, so a category can read as "started
// weak, has improved recently" rather than only ever showing the latest note.

type ScoutingCategory = keyof ScoutingNotes;

const POSITIVE = /strong|good|solid|consistent|improved?|better|reliable|sharp|dialed|fixed|no longer|cleaned up/i;
const NEGATIVE = /weak|bad|poor|shaky|inconsistent|breaks? down|struggl|off|unreliable|overhit|missed|not good|hesitant/i;

function sentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const isPositive = POSITIVE.test(text);
  const isNegative = NEGATIVE.test(text);
  if (isPositive && !isNegative) return 'positive';
  if (isNegative && !isPositive) return 'negative';
  return 'neutral';
}

function summarizeCategory(category: ScoutingCategory, matchesOldestFirst: Match[]): string {
  const notes = matchesOldestFirst
    // Optional chaining guards matches saved before scoutingNotes existed.
    .map((m) => (m.scoutingNotes?.[category] ?? '').trim())
    .filter((text) => text.length > 0);

  if (notes.length === 0) return '';
  if (notes.length === 1) return notes[0];

  const earliest = notes[0];
  const latest = notes[notes.length - 1];
  const earliestMood = sentiment(earliest);
  const latestMood = sentiment(latest);

  if (earliestMood !== 'neutral' && latestMood !== 'neutral' && earliestMood !== latestMood) {
    const trend = latestMood === 'positive' ? 'has looked better since' : 'has gotten shakier since';
    return `Started out "${earliest}" — ${trend}, most recently: "${latest}".`;
  }

  // No clear trend one way or the other — weight toward the most recent read,
  // but note it's backed by more than one match.
  return `${latest} (from ${notes.length} matches — most recent take shown)`;
}

export interface ScoutingSummary {
  forehand: string;
  serve: string;
  backhand: string;
  mental: string;
  other: string;
}

export function summarizeScouting(matches: Match[]): ScoutingSummary {
  const oldestFirst = [...matches].sort((a, b) => (a.date < b.date ? -1 : 1));
  return {
    forehand: summarizeCategory('forehand', oldestFirst),
    serve: summarizeCategory('serve', oldestFirst),
    backhand: summarizeCategory('backhand', oldestFirst),
    mental: summarizeCategory('mental', oldestFirst),
    other: summarizeCategory('other', oldestFirst),
  };
}
