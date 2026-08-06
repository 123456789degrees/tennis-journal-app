import type { Match } from './models';

// Placeholder heuristic — TRANSFER-PACKAGE.md flags real scouting synthesis
// (likely an LLM call over match history in a real build) as an open
// question. This looks across every match played against an opponent —
// weighted toward the most recent ones — instead of just echoing back
// whatever was typed in the last match, so a category can read as "started
// weak, has improved recently" rather than only ever showing the latest note.

const POSITIVE = /strong|good|solid|consistent|improved?|better|reliable|sharp|dialed|fixed|no longer|cleaned up/i;
const NEGATIVE = /weak|bad|poor|shaky|inconsistent|breaks? down|struggl|off|unreliable|overhit|missed|not good|hesitant/i;

function sentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const isPositive = POSITIVE.test(text);
  const isNegative = NEGATIVE.test(text);
  if (isPositive && !isNegative) return 'positive';
  if (isNegative && !isPositive) return 'negative';
  return 'neutral';
}

function summarizeField(getValue: (m: Match) => string, matchesOldestFirst: Match[]): string {
  const notes = matchesOldestFirst
    // Optional chaining guards matches saved before a field existed.
    .map((m) => (getValue(m) ?? '').trim())
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
  // Not about the opponent — this is the player's OWN self-reflection,
  // aggregated specifically across matches against this opponent, so the
  // page can answer "how do *I* tend to do against them," not just "how do
  // they play."
  whatWentWell: string;
  whatToImprove: string;
}

export function summarizeScouting(matches: Match[]): ScoutingSummary {
  const oldestFirst = [...matches].sort((a, b) => (a.date < b.date ? -1 : 1));
  return {
    forehand: summarizeField((m) => m.scoutingNotes?.forehand ?? '', oldestFirst),
    serve: summarizeField((m) => m.scoutingNotes?.serve ?? '', oldestFirst),
    backhand: summarizeField((m) => m.scoutingNotes?.backhand ?? '', oldestFirst),
    mental: summarizeField((m) => m.scoutingNotes?.mental ?? '', oldestFirst),
    other: summarizeField((m) => m.scoutingNotes?.other ?? '', oldestFirst),
    whatWentWell: summarizeField((m) => m.selfReflection?.whatWentWell ?? '', oldestFirst),
    whatToImprove: summarizeField((m) => m.selfReflection?.whatToImprove ?? '', oldestFirst),
  };
}
