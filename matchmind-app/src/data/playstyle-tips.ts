import type { Playstyle } from './models';

export interface PlaystyleProfile {
  description: string;
  strengths: string[];
  watchOuts: string[];
  tips: string[];
}

export const PLAYSTYLE_PROFILES: Record<Playstyle, PlaystyleProfile> = {
  'Pusher / moonballer': {
    description:
      'You win by outlasting people — steady, high-percentage tennis that waits for the other player to break down before you do.',
    strengths: [
      'Elite consistency and patience',
      "Frustrates aggressive players who don't have a plan B",
      'Rarely beats yourself with unforced errors',
    ],
    watchOuts: [
      "Can get stuck if you run into another player who's just as comfortable grinding",
      'May lack a real way to close out a point once you actually get a good chance',
    ],
    tips: [
      'Build one reliable way to end a point on your own terms — even just a solid approach shot off a short ball — instead of only ever waiting for their mistake.',
      "Mix in depth and spin changes, not just steady pace, so opponents can't settle into a rhythm against you.",
      'Practice recognizing the exact moment in a rally to switch from neutral to offense — that read is a skill on its own.',
    ],
  },
  'Aggressive baseliner': {
    description:
      'You look to dictate points from the back of the court with pace and depth, taking the first good chance to attack.',
    strengths: [
      'Can end points quickly on your own terms',
      'Puts real pressure on opponents from the first ball',
    ],
    watchOuts: [
      'Errors can pile up fast when going for too much too early in a rally',
      "Can struggle against a player who just gets everything back and waits you out",
    ],
    tips: [
      'Work on shot selection — attack the RIGHT ball (short, slow, sittable), not just any ball, so your aggression has better odds.',
      "Build a reliable neutral rally shot so you're not forced to go for a winner on every single ball.",
      "Practice finishing points at net once you've forced a short ball, instead of trying to end everything from the baseline.",
    ],
  },
  'Serve-and-volley': {
    description:
      'You look to get to the net as fast as possible and finish points there rather than from the baseline.',
    strengths: ['Takes time away from opponents', 'Strong at closing out points once in position'],
    watchOuts: [
      'Vulnerable to good passing shots and lobs if your first volley is weak',
      'Needs a genuinely good serve/approach to set up — exposed without one',
    ],
    tips: [
      'Drill split-step timing relentlessly — a serve-and-volley game lives or dies on getting that first volley right.',
      'Practice low, defensive volleys off a hard-hit return, not just easy putaways.',
      "Work on your second-serve-and-volley too, not just off the first serve, so opponents can't just sit back and wait you out.",
    ],
  },
  'All-court': {
    description:
      'You adapt point to point — sometimes grinding, sometimes attacking, sometimes coming forward — based on what the situation calls for.',
    strengths: [
      'Hard for opponents to scout or settle into a rhythm against',
      'Multiple ways to win a point, not just one',
    ],
    watchOuts: [
      'Can lack one truly dominant weapon compared to a specialist',
      'Risk of overthinking mid-match instead of trusting your instincts',
    ],
    tips: [
      'Get specific with yourself about WHEN you switch tactics (a certain score, a certain shot from your opponent) instead of leaving it purely instinctive.',
      'Since you can do a bit of everything, pick one shot to turn into a true weapon rather than staying balanced everywhere.',
      "Practice reading your opponent's playstyle early in a match so you know which of your tools to lean on that day.",
    ],
  },
  Counterpuncher: {
    description:
      'You absorb pressure and redirect it — comfortable playing defense and letting opponents make the mistakes.',
    strengths: ['Extremely hard to hit through', 'Thrives against big hitters who get impatient'],
    watchOuts: [
      'Can struggle to close out points against another patient player',
      "Risk of playing too passively against an opponent who doesn't give you enough to counter",
    ],
    tips: [
      "Practice actually taking over a point once your opponent is out of position — counterpunching shouldn't mean never attacking.",
      'Work on your own service games specifically — counterpunchers often lean on return games and can neglect their serve.',
      'Build one shot (a down-the-line passing shot, a well-placed lob) that turns pure defense into a real weapon.',
    ],
  },
};
