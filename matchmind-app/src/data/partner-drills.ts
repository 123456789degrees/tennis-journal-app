// A friend testing the app specifically asked for "partner to partner
// drilling" and "tiebreak ideas with twists to build good habits" — games
// with a real partner and a real score, not solo mechanical reps. Unlike
// the AI/heuristic practice nudge (data/insights.ts), this list isn't tied
// to any one weakness pattern — it's a browsable reference of live-ball
// games and pressure drills a player can try any time, with any hitting
// partner, regardless of what their current practice nudge says.
export interface PartnerDrill {
  id: string;
  title: string;
  category: 'Live-ball games' | 'Tiebreak twists';
  description: string;
}

export const PARTNER_DRILLS: PartnerDrill[] = [
  {
    id: 'cross-court-battle',
    title: 'Cross-court battle',
    category: 'Live-ball games',
    description:
      "Rally cross-court only (forehand or backhand) — anything down the line or in the alley loses the point on the spot. Play to 11, win by 2. Forces the same shot tolerance a real baseline rally demands instead of a clean, predictable feed.",
  },
  {
    id: 'one-up-one-back',
    title: 'One up, one back',
    category: 'Live-ball games',
    description:
      'One partner starts every point at the net, the other on the baseline. The baseliner must pass or lob to win; the net player must finish with a real volley, not a block. Play out full points and switch positions every 5 points.',
  },
  {
    id: 'serve-and-3',
    title: 'Serve-and-3',
    category: 'Live-ball games',
    description:
      "Serve live with your partner returning for real. A first serve only counts as a good hold if you win the point within the first three shots (serve, return, next ball) — tests serving under real pressure instead of an isolated toss with no consequence.",
  },
  {
    id: 'target-return',
    title: 'Call-your-target return',
    category: 'Live-ball games',
    description:
      "Returner calls a target (deep middle, opponent's weaker wing, short angle) before the serve, out loud. The point only counts as a return win if you actually land it there AND win the point — builds return-with-a-plan instead of just blocking it back.",
  },
  {
    id: 'down-0-4',
    title: 'Down 0-4 breaker',
    category: 'Tiebreak twists',
    description:
      "Play a mini-tiebreak (first to 7) but start every one at 0-4 instead of 0-0. You only ever get to practice fighting back from behind, which is the situation real matches actually put you in far more than a clean lead.",
  },
  {
    id: 'sudden-death',
    title: 'Sudden-death breaker',
    category: 'Tiebreak twists',
    description:
      'First point wins, no deuce, no margin for a slow start. Play 5 of these back to back with a partner — trains bringing full focus to a single point immediately instead of easing in.',
  },
  {
    id: 'silent-breaker',
    title: 'Silent breaker',
    category: 'Tiebreak twists',
    description:
      "Play a full 7-point tiebreak with no talking, celebrating, or visible reaction between points — whoever breaks first automatically loses the next point. Builds the composure real pressure points demand.",
  },
  {
    id: 'losers-disadvantage',
    title: "Loser's disadvantage",
    category: 'Tiebreak twists',
    description:
      "Play a set of mini-breakers where whoever loses one starts the next down 0-2. Simulates how one bad game in a real match can bleed into the next one, and trains resetting instead of spiraling.",
  },
];
