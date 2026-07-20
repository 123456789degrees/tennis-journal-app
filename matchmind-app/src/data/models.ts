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
  isUnder13: boolean;
  parentEmail?: string;
  settings: {
    practiceNudgesEnabled: boolean;
    logReminderEnabled: boolean;
  };
}

export interface Opponent {
  id: string;
  ownerPlayerId: string;
  name: string;
  playstyle: Playstyle;
  scouting: {
    forehand: string;
    serve: string;
    backhand: string;
    other: string;
  };
  aiTip: string;
  createdAt: string;
  updatedAt: string;
}

export type MatchResult = "Win" | "Loss";

export interface Match {
  id: string;
  ownerPlayerId: string;
  opponentId: string;
  date: string;
  score: string[];
  result: MatchResult;
  playstyleSnapshot: Playstyle;
  selfReflection: {
    whatWentWell: string;
    whatToImprove: string;
  };
  matchNotes: string;
}

export type InsightStatus = "active" | "dismissed" | "corrected";
export type CorrectedIssue = "stroke" | "footwork" | "shot-selection";

export interface PracticeInsight {
  id: string;
  ownerPlayerId: string;
  patternDescription: string;
  suggestedDrill: string;
  sourceMatchIds: string[];
  status: InsightStatus;
  correctedIssue?: CorrectedIssue;
}
