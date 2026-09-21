// Data models — see TRANSFER-PACKAGE.md section 4 for the design rationale.

export const PLAYSTYLES = [
  "Pusher / moonballer",
  "Aggressive baseliner",
  "Serve-and-volley",
  "All-court",
  "Counterpuncher",
] as const;

export type Playstyle = (typeof PLAYSTYLES)[number];

export interface Player {
  id: string;
  email: string;
  // No password field — Supabase Auth owns credentials entirely (hashed,
  // server-side, never sent to or stored by the client). See lib/supabase.ts.
  settings: {
    practiceNudgesEnabled: boolean;
    logReminderEnabled: boolean;
    // Result of the "My Playstyle" self-assessment quiz — undefined until
    // the player takes it. See data/playstyle-quiz.ts / app/my-playstyle.tsx.
    myPlaystyle?: Playstyle;
  };
}

export interface Opponent {
  id: string;
  ownerPlayerId: string;
  name: string;
  playstyle: Playstyle;
  createdAt: string;
  updatedAt: string;
}

export type MatchResult = "Win" | "Loss";

export interface ScoutingNotes {
  forehand: string;
  serve: string;
  backhand: string;
  mental: string;
  other: string;
}

export interface Match {
  id: string;
  ownerPlayerId: string;
  opponentId: string;
  date: string;
  score: string[];
  result: MatchResult;
  playstyleSnapshot: Playstyle;
  // Scouting observations recorded for THIS specific match — the opponent's
  // scouting "profile" is a summary computed across all of these, not a
  // single overwritten field. See data/scouting-summary.ts.
  scoutingNotes: ScoutingNotes;
  selfReflection: {
    whatWentWell: string;
    whatToImprove: string;
  };
  matchNotes: string;
}

export type InsightStatus = "active" | "dismissed" | "corrected" | "completed";

export interface PracticeInsight {
  id: string;
  ownerPlayerId: string;
  patternDescription: string;
  suggestedDrill: string;
  // Short 3-5 word keyword phrase for finding a real video of this drill —
  // suggestedDrill itself is a full coaching sentence, too long-tail a
  // YouTube search to reliably match a real video. Optional so insights
  // saved before this field existed still fall back to suggestedDrill.
  drillSearchQuery?: string;
  // A concrete, actionable adjustment for the player's NEXT matches (e.g.
  // "hit crosscourt more and aim for more margin, don't aim for the
  // corner") — distinct from suggestedDrill, which is practice-court
  // exercise, not in-match advice. Optional so insights saved before this
  // field existed still render fine without it.
  matchTip?: string;
  sourceMatchIds: string[];
  status: InsightStatus;
  // What the player actually typed when marking this "Not quite" — a fixed
  // list of reasons (stroke/footwork/shot-selection) couldn't cover real
  // cases like "this is a mental thing" or "the video wasn't relevant."
  correctionNote?: string;
}

// A player's like/dislike of one specific YouTube video (not its creator —
// liking is a per-video fact: you might like one video from a channel and
// not another). Keyed by videoId. Two things read this list:
// - The Liked Videos screen shows every entry where liked === true.
// - Future drill-video searches derive a per-channel bias from it (a
//   channel with a liked video gets searched again directly; one with a
//   disliked video gets filtered out) — see data/drill-videos.ts.
export interface VideoFeedback {
  videoId: string;
  title: string;
  url: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
  liked: boolean;
  updatedAt: string;
}
