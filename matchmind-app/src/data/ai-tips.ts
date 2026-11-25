import type { Match } from './models';
import type { ScoutingSummary } from './scouting-summary';

// Short, single-sentence version of the same real tennis strategy used in
// the AI prompt (see src/app/api/opponent-scout+api.ts's PLAYSTYLE_STRATEGY)
// — kept separate rather than shared, since the AI prompt's copy is written
// as coaching instructions for a model while this one is the literal tip
// text shown to the player.
const PLAYSTYLE_TACTIC: Record<string, string> = {
  'Pusher / moonballer':
    "Come to net and finish points rather than trying to out-rally them — take the ball early, and mix in drop shots to pull them forward.",
  'Aggressive baseliner':
    'Take their pace away with slice and change of pace instead of matching their power, and keep the ball deep to their weaker wing.',
  'Serve-and-volley':
    "Return low at their feet to force a tough first volley, and use lobs when they're camped at net.",
  'All-court':
    'Force whatever tempo makes them least comfortable and attack their weaker side directly once you spot it.',
  Counterpuncher:
    "Dictate the point yourself and finish at net on a short ball — trying to out-rally them plays into their hands.",
};

// Heuristic fallback — used when OPENROUTER_API_KEY isn't configured, or the
// API call fails. Keeps the "how to beat them" box populated with something
// plausible even with no AI wired up. See src/app/api/opponent-scout+api.ts
// for the real AI path.
export function generateOpponentTipHeuristic(playstyle: string, summary: ScoutingSummary): string {
  const { forehand, serve, backhand, other } = summary;
  const notes = [
    PLAYSTYLE_TACTIC[playstyle] ?? null,
    backhand && /weak|shaky|breaks? down|inconsistent/i.test(backhand)
      ? 'Attack the backhand early and often.'
      : backhand
        ? `Backhand: ${backhand}`
        : null,
    serve && /big|fast|kick|hard/i.test(serve)
      ? 'Return their serve from further back and take it on the rise when you can.'
      : serve
        ? `Serve: ${serve}`
        : null,
    forehand && /strong|weapon|heavy/i.test(forehand)
      ? "Avoid feeding their forehand — work the ball to the other side."
      : forehand
        ? `Forehand: ${forehand}`
        : null,
    // "other" now covers mentality too (gets angry, tightens up, etc.),
    // alongside anything else — fitness, movement, whatever doesn't fit a stroke.
    other && /angry|anger|temper|frustrat|meltdown|rage/i.test(other)
      ? 'Make them play extra shots and create adversity — they can lose composure and hand you free points once frustrated.'
      : other && /tight|nervous|panic|choke/i.test(other)
        ? 'Extend rallies on big points — they tend to tighten up under pressure.'
        : other
          ? `Other: ${other}`
          : null,
  ].filter(Boolean);

  if (notes.length === 0) {
    return 'Log a bit of scouting after your next match against them and a tip will show up here.';
  }
  return notes.join(' ');
}

// Real AI path — sends every logged scouting note against this opponent
// (chronological) to the server, which asks an LLM to synthesize a tip,
// weighting recent matches more heavily. Falls back to the heuristic above
// if no key is configured or the call fails for any reason.
export async function fetchOpponentTip(
  opponentName: string,
  playstyle: string,
  matches: Match[],
  summary: ScoutingSummary
): Promise<string> {
  try {
    const oldestFirst = [...matches].sort((a, b) => (a.date < b.date ? -1 : 1));
    const res = await fetch('/api/opponent-scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opponentName,
        playstyle,
        matches: oldestFirst.map((m) => ({
          date: m.date,
          forehand: m.scoutingNotes?.forehand ?? '',
          serve: m.scoutingNotes?.serve ?? '',
          backhand: m.scoutingNotes?.backhand ?? '',
          other: m.scoutingNotes?.other ?? '',
        })),
      }),
    });
    const data = await res.json();
    if (data.tip) return data.tip as string;
  } catch {
    // fall through to heuristic
  }
  return generateOpponentTipHeuristic(playstyle, summary);
}
