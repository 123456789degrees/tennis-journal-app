import type { ScoutingSummary } from './scouting-summary';

// Placeholder heuristic — TRANSFER-PACKAGE.md flags real tip generation
// (likely an LLM call over the scouting summary + match history) as an open
// implementation question. This keeps the "how to beat them" box populated
// with something plausible until that's wired up.
export function generateOpponentTip(summary: ScoutingSummary): string {
  const { forehand, serve, backhand, other } = summary;
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
    other || null,
  ].filter(Boolean);

  if (notes.length === 0) {
    return 'Log a bit of scouting after your next match against them and a tip will show up here.';
  }
  return notes.join(' ');
}
