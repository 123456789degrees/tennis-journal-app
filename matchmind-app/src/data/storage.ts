import { supabase } from "@/lib/supabase";
import type { Match, Opponent, Player, PracticeInsight, VideoFeedback } from "./models";

// Real accounts now — every read/write here goes to Supabase (Postgres +
// Auth), not just this one browser's local storage, so the same account
// works from any device. Row-level security (see supabase/schema.sql)
// enforces "no cross-player read path anywhere," same guarantee the old
// AsyncStorage version had by construction, now enforced server-side.

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function throwIfError<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

const DEFAULT_SETTINGS = { practiceNudgesEnabled: true, logReminderEnabled: true };

// --- Session ---

export async function getCurrentPlayerId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// Session is established by signIn/signUp themselves now (see login.tsx) —
// there's no separate "which id is current" state to set by hand anymore.
export async function clearCurrentPlayerId(): Promise<void> {
  await supabase.auth.signOut();
}

// --- Player ---

export async function getPlayer(_id: string): Promise<Player | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    settings: { ...DEFAULT_SETTINGS, ...(user.user_metadata as Partial<Player["settings"]>) },
  };
}

export async function savePlayer(player: Player): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: player.settings });
  if (error) throw new Error(error.message);
}

// Deletes the account and everything under it (opponents/matches/insights/
// video feedback all cascade via their foreign keys — see schema.sql). A
// user can't delete their own auth account from the client SDK, so this
// calls a small server-side endpoint that holds the service-role key.
export async function deletePlayer(_playerId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;
  const res = await fetch("/api/delete-account", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete account.");
  }
  await supabase.auth.signOut();
}

export async function createPlayer(input: {
  email: string;
  password: string;
}): Promise<Player> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: DEFAULT_SETTINGS },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Sign-up did not return a user.");
  return { id: data.user.id, email: data.user.email ?? input.email, settings: DEFAULT_SETTINGS };
}

// --- Opponents ---

export async function listOpponents(playerId: string): Promise<Opponent[]> {
  return throwIfError(
    await supabase.from("opponents").select("*").eq("ownerPlayerId", playerId)
  ) as Opponent[];
}

export async function getOpponent(
  playerId: string,
  opponentId: string
): Promise<Opponent | null> {
  return throwIfError(
    await supabase
      .from("opponents")
      .select("*")
      .eq("ownerPlayerId", playerId)
      .eq("id", opponentId)
      .maybeSingle()
  ) as Opponent | null;
}

export async function upsertOpponent(
  playerId: string,
  opponent: Opponent
): Promise<void> {
  throwIfError(
    await supabase.from("opponents").upsert({ ...opponent, ownerPlayerId: playerId })
  );
}

export async function createOpponent(
  playerId: string,
  input: { name: string; playstyle: Opponent["playstyle"] }
): Promise<Opponent> {
  const now = new Date().toISOString();
  const opponent: Opponent = {
    id: newId(),
    ownerPlayerId: playerId,
    name: input.name,
    playstyle: input.playstyle,
    createdAt: now,
    updatedAt: now,
  };
  await upsertOpponent(playerId, opponent);
  return opponent;
}

// --- Matches ---

export async function listMatches(playerId: string): Promise<Match[]> {
  return throwIfError(
    await supabase
      .from("matches")
      .select("*")
      .eq("ownerPlayerId", playerId)
      .order("date", { ascending: false })
  ) as Match[];
}

export async function listMatchesForOpponent(
  playerId: string,
  opponentId: string
): Promise<Match[]> {
  return throwIfError(
    await supabase
      .from("matches")
      .select("*")
      .eq("ownerPlayerId", playerId)
      .eq("opponentId", opponentId)
      .order("date", { ascending: false })
  ) as Match[];
}

export async function getMatch(
  playerId: string,
  matchId: string
): Promise<Match | null> {
  return throwIfError(
    await supabase
      .from("matches")
      .select("*")
      .eq("ownerPlayerId", playerId)
      .eq("id", matchId)
      .maybeSingle()
  ) as Match | null;
}

export async function saveMatch(playerId: string, match: Match): Promise<void> {
  throwIfError(await supabase.from("matches").upsert({ ...match, ownerPlayerId: playerId }));
}

export async function deleteMatch(
  playerId: string,
  matchId: string
): Promise<void> {
  throwIfError(
    await supabase.from("matches").delete().eq("ownerPlayerId", playerId).eq("id", matchId)
  );
}

export async function getLastAnalyzedMatchId(_playerId: string): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.user_metadata as { lastAnalyzedMatchId?: string } | undefined;
  return meta?.lastAnalyzedMatchId ?? null;
}

export async function setLastAnalyzedMatchId(
  playerId: string,
  matchId: string
): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: { lastAnalyzedMatchId: matchId } });
  if (error) throw new Error(error.message);
}

// --- Practice insights ---

export async function listInsights(
  playerId: string
): Promise<PracticeInsight[]> {
  return throwIfError(
    await supabase.from("practice_insights").select("*").eq("ownerPlayerId", playerId)
  ) as PracticeInsight[];
}

export async function saveInsight(
  playerId: string,
  insight: PracticeInsight
): Promise<void> {
  throwIfError(
    await supabase
      .from("practice_insights")
      .upsert({ ...insight, ownerPlayerId: playerId })
  );
}

// --- Video feedback (per-video drill-video like/dislike) ---

export async function listVideoFeedback(playerId: string): Promise<VideoFeedback[]> {
  return throwIfError(
    await supabase.from("video_feedback").select("*").eq("ownerPlayerId", playerId)
  ) as VideoFeedback[];
}

export async function saveVideoFeedback(
  playerId: string,
  feedback: VideoFeedback
): Promise<void> {
  throwIfError(
    await supabase
      .from("video_feedback")
      .upsert({ ...feedback, ownerPlayerId: playerId }, { onConflict: "ownerPlayerId,videoId" })
  );
}

// Used by the Liked Videos screen's "remove" action — goes back to neutral
// rather than flipping to disliked.
export async function deleteVideoFeedback(playerId: string, videoId: string): Promise<void> {
  throwIfError(
    await supabase
      .from("video_feedback")
      .delete()
      .eq("ownerPlayerId", playerId)
      .eq("videoId", videoId)
  );
}
