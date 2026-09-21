import { PLAYSTYLES, type Playstyle } from './models';

// A friend testing the app wanted a way for a player to figure out their
// OWN playstyle (not just an opponent's) and get tips on developing it.
// This is a short forced-choice quiz rather than something AI-inferred from
// match notes — those notes are about specific opponents/matches, not a
// reliable signal for a player's own general tendencies, and a quiz a
// player answers honestly about themselves is both simpler and more
// trustworthy than guessing from indirect data.
export interface QuizOption {
  label: string;
  playstyle: Playstyle;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export const PLAYSTYLE_QUIZ: QuizQuestion[] = [
  {
    id: 'short-ball',
    question: "You get a short, easy ball in the middle of the court. First instinct?",
    options: [
      { label: 'Hit a deep, safe shot and stay back', playstyle: 'Pusher / moonballer' },
      { label: 'Rip a winner or attack behind it', playstyle: 'Aggressive baseliner' },
      { label: 'Come in and finish it at the net', playstyle: 'Serve-and-volley' },
      { label: 'Depends on the moment — sometimes attack, sometimes rally', playstyle: 'All-court' },
      { label: 'Set it up patiently and wait for a better one', playstyle: 'Counterpuncher' },
    ],
  },
  {
    id: 'favorite-win',
    question: 'Your favorite way to win a point?',
    options: [
      { label: 'Outlasting them in a long rally until they miss', playstyle: 'Pusher / moonballer' },
      { label: 'A big first strike off a good serve or return', playstyle: 'Aggressive baseliner' },
      { label: 'A clean volley or overhead at net', playstyle: 'Serve-and-volley' },
      { label: 'Mixing pace and spin until they lose their rhythm', playstyle: 'All-court' },
      { label: "Absorbing their pace and redirecting it for a passing shot", playstyle: 'Counterpuncher' },
    ],
  },
  {
    id: 'serve-plan',
    question: 'On your own serve, what’s the plan?',
    options: [
      { label: 'Just get it in and start the rally', playstyle: 'Pusher / moonballer' },
      { label: 'Hit it big and look to attack the return', playstyle: 'Aggressive baseliner' },
      { label: 'Serve and move forward immediately', playstyle: 'Serve-and-volley' },
      { label: 'Depends on the score and who I’m playing', playstyle: 'All-court' },
      { label: "Serve conservatively — I'll win the point later in the rally", playstyle: 'Counterpuncher' },
    ],
  },
  {
    id: 'long-rallies',
    question: 'How do you feel during long rallies?',
    options: [
      { label: "Totally comfortable, I could do this all day", playstyle: 'Pusher / moonballer' },
      { label: "A little impatient — I'd rather end it", playstyle: 'Aggressive baseliner' },
      { label: "I'd rather not be there — I want to be at net", playstyle: 'Serve-and-volley' },
      { label: "Fine either way, I just look for the right moment", playstyle: 'All-court' },
      { label: "Better the longer it goes — it's a mental battle I like", playstyle: 'Counterpuncher' },
    ],
  },
  {
    id: 'friend-description',
    question: 'How would a friend describe your game?',
    options: [
      { label: '"So consistent, they never miss."', playstyle: 'Pusher / moonballer' },
      { label: '"Goes for a lot, hits some huge winners."', playstyle: 'Aggressive baseliner' },
      { label: '"Always coming to net."', playstyle: 'Serve-and-volley' },
      { label: '"Hard to scout, changes it up."', playstyle: 'All-court' },
      { label: '"Frustrating to play, gets everything back."', playstyle: 'Counterpuncher' },
    ],
  },
  {
    id: 'losing-turnaround',
    question: 'When you’re losing, what usually helps you turn it around?',
    options: [
      { label: 'Slowing down and getting even more patient', playstyle: 'Pusher / moonballer' },
      { label: 'Taking bigger risks and going for more', playstyle: 'Aggressive baseliner' },
      { label: 'Coming to net more to change the rhythm', playstyle: 'Serve-and-volley' },
      { label: 'Changing tactics entirely mid-match', playstyle: 'All-court' },
      { label: 'Staying patient and letting them make the errors', playstyle: 'Counterpuncher' },
    ],
  },
  {
    id: 'pro-comparison',
    question: 'Which pro’s game do you feel closest to, even a little?',
    options: [
      { label: 'A grinder who wins with pure consistency', playstyle: 'Pusher / moonballer' },
      { label: 'A big hitter who goes for winners', playstyle: 'Aggressive baseliner' },
      { label: 'A classic net-rusher', playstyle: 'Serve-and-volley' },
      { label: 'Someone who can do a bit of everything', playstyle: 'All-court' },
      { label: 'A defensive counterpuncher who frustrates big hitters', playstyle: 'Counterpuncher' },
    ],
  },
];

// Whichever playstyle was picked most often wins; ties break toward
// whichever comes first in PLAYSTYLES, purely so the result is
// deterministic rather than depending on object-key iteration order.
export function computePlaystyle(answers: Playstyle[]): Playstyle {
  const counts = new Map<Playstyle, number>();
  for (const answer of answers) {
    counts.set(answer, (counts.get(answer) ?? 0) + 1);
  }
  let best: Playstyle = PLAYSTYLES[0];
  let bestCount = -1;
  for (const style of PLAYSTYLES) {
    const count = counts.get(style) ?? 0;
    if (count > bestCount) {
      best = style;
      bestCount = count;
    }
  }
  return best;
}
