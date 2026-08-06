import type { Match } from './models';
import type { ScoutingSummary } from './scouting-summary';

// Heuristic fallback — used when OPENROUTER_API_KEY isn't configured, or the
// API call fails. Keeps the "how to beat them" box populated with something
// plausible even with no AI wired up. See src/app/api/opponent-scout+api.ts
// for the real AI path.
export function generateOpponentTipHeuristic(summary: ScoutingSummary): string {
  const { forehand, serve, backhand, mental, other } = summary;
  const notes = [
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
    mental && /angry|anger|temper|frustrat|meltdown|rage/i.test(mental)
      ? 'Make them play extra shots and create adversity — they can lose composure and hand you free points once frustrated.'
      : mental && /tight|nervous|panic|choke/i.test(mental)
        ? 'Extend rallies on big points — they tend to tighten up under pressure.'
        : mental
          ? `Mental: ${mental}`
          : null,
    other || null,
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
          mental: m.scoutingNotes?.mental ?? '',
          other: m.scoutingNotes?.other ?? '',
        })),
      }),
    });
    const data = await res.json();
    if (data.tip) return data.tip as string;
  } catch {
    // fall through to heuristic
  }
  return generateOpponentTipHeuristic(summary);
}
