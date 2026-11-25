// A browsable reference of simple live-ball rally games a player can try
// with any hitting partner, any time — not tied to the current AI practice
// nudge above it on the Practice screen. Kept to just a couple of ideas on
// purpose — a long list of suggestions here just added clutter.
export interface PartnerDrill {
  id: string;
  title: string;
  description: string;
}

export const PARTNER_DRILLS: PartnerDrill[] = [
  {
    id: 'cross-court-battle',
    title: 'Cross-court battle',
    description:
      'Rally cross-court only (forehand or backhand) — anything down the line or in the alley loses the point on the spot. Play to 11, win by 2.',
  },
  {
    id: 'down-the-line-battle',
    title: 'Down-the-line battle',
    description:
      'Same idea, the other direction — rally down the line only, cross-court loses the point. Play to 11, win by 2.',
  },
];
