import type { Playstyle, ScoutingNotes } from './models';
import { PLAYSTYLES } from './models';
import { PLAYSTYLE_PROFILES } from './playstyle-tips';

export interface PlaystyleClassification {
  primary: Playstyle;
  primaryPercent: number;
  secondary?: Playstyle;
  secondaryPercent?: number;
  summary: string;
  tips: string[];
}

// Used when OPENROUTER_API_KEY isn't configured, or the AI call fails —
// keeps "My Playstyle" working even with no AI wired up. See
// app/api/my-playstyle+api.ts for the real AI path. Same spirit as
// data/insights.ts's heuristic fallback: simple keyword scoring instead of
// nothing at all.
const KEYWORDS: Record<Playstyle, RegExp> = {
  'Pusher / moonballer': /consisten|patient|patience|grind|steady|never miss|retriev|high ball|loop|moonball|safe/i,
  'Aggressive baseliner': /power|aggressive|big shot|hit hard|go for winners|dictate|first strike|attack/i,
  'Serve-and-volley': /net|volley|serve.?and.?volley|approach|come in|finish at (the )?net|overhead/i,
  'All-court': /mix|adapt|all.?around|all.?court|versatile|variety|change (it|things) up|depends/i,
  Counterpuncher: /counter|defense|defensive|redirect|absorb|frustrat|get everything back|wait for (them|the) (mistake|error)/i,
};

export function classifyPlaystyle(notes: ScoutingNotes): PlaystyleClassification {
  const text = [notes.forehand, notes.serve, notes.backhand, notes.mental, notes.other]
    .filter(Boolean)
    .join(' ');

  const scores = new Map<Playstyle, number>();
  for (const style of PLAYSTYLES) {
    const matches = text.match(new RegExp(KEYWORDS[style], 'gi'));
    scores.set(style, matches?.length ?? 0);
  }

  const ranked = [...PLAYSTYLES].sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0));
  const [top, second] = ranked;
  const topScore = scores.get(top) ?? 0;
  const secondScore = scores.get(second) ?? 0;
  const total = topScore + secondScore;

  const profile = PLAYSTYLE_PROFILES[top];
  const hasBlend = topScore > 0 && secondScore > 0 && total > 0;

  const primaryPercent = hasBlend ? Math.round((topScore / total) * 100) : 100;

  return {
    primary: top,
    primaryPercent,
    secondary: hasBlend ? second : undefined,
    secondaryPercent: hasBlend ? 100 - primaryPercent : undefined,
    summary: profile.description,
    tips: profile.tips,
  };
}
