import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Match, Opponent, Player, PracticeInsight } from "./models";

// Private/personal data model — everything is namespaced under the current
// player's id, and there is no cross-player read path anywhere in this file.
const KEYS = {
  currentPlayerId: "matchmind:currentPlayerId",
  allPlayerIds: "matchmind:allPlayerIds",
  player: (id: string) => `matchmind:player:${id}`,
  opponents: (playerId: string) => `matchmind:opponents:${playerId}`,
  matches: (playerId: string) => `matchmind:matches:${playerId}`,
  insights: (playerId: string) => `matchmind:insights:${playerId}`,
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// --- Session ---

export async function getCurrentPlayerId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.currentPlayerId);
}

export async function setCurrentPlayerId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.currentPlayerId, id);
}

export async function clearCurrentPlayerId(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.currentPlayerId);
}

// --- Player ---

export async function getPlayer(id: string): Promise<Player | null> {
  return readJson<Player | null>(KEYS.player(id), null);
}

export async function savePlayer(player: Player): Promise<void> {
  await writeJson(KEYS.player(player.id), player);
}

async function getAllPlayerIds(): Promise<string[]> {
  return readJson<string[]>(KEYS.allPlayerIds, []);
}

export async function findPlayerByEmail(email: string): Promise<Player | null> {
  const ids = await getAllPlayerIds();
  const players = await Promise.all(ids.map((id) => getPlayer(id)));
  return (
    players.find(
      (p): p is Player =>
        !!p && p.email.toLowerCase() === email.toLowerCase()
    ) ?? null
  );
}

export async function createPlayer(input: {
  email: string;
  isUnder13: boolean;
  parentEmail?: string;
}): Promise<Player> {
  const player: Player = {
    id: newId(),
    email: input.email,
    isUnder13: input.isUnder13,
    parentEmail: input.parentEmail,
    settings: { practiceNudgesEnabled: true, logReminderEnabled: true },
  };
  await savePlayer(player);
  const ids = await getAllPlayerIds();
  await writeJson(KEYS.allPlayerIds, [...ids, player.id]);
  await setCurrentPlayerId(player.id);
  return player;
}

// --- Opponents ---

export async function listOpponents(playerId: string): Promise<Opponent[]> {
  return readJson<Opponent[]>(KEYS.opponents(playerId), []);
}

export async function getOpponent(
  playerId: string,
  opponentId: string
): Promise<Opponent | null> {
  const all = await listOpponents(playerId);
  return all.find((o) => o.id === opponentId) ?? null;
}

export async function upsertOpponent(
  playerId: string,
  opponent: Opponent
): Promise<void> {
  const all = await listOpponents(playerId);
  const idx = all.findIndex((o) => o.id === opponent.id);
  if (idx >= 0) all[idx] = opponent;
  else all.push(opponent);
  await writeJson(KEYS.opponents(playerId), all);
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
    scouting: { forehand: "", serve: "", backhand: "", other: "" },
    aiTip: "",
    createdAt: now,
    updatedAt: now,
  };
  await upsertOpponent(playerId, opponent);
  return opponent;
}

// --- Matches ---

export async function listMatches(playerId: string): Promise<Match[]> {
  const all = await readJson<Match[]>(KEYS.matches(playerId), []);
  return [...all].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function listMatchesForOpponent(
  playerId: string,
  opponentId: string
): Promise<Match[]> {
  const all = await listMatches(playerId);
  return all.filter((m) => m.opponentId === opponentId);
}

export async function getMatch(
  playerId: string,
  matchId: string
): Promise<Match | null> {
  const all = await listMatches(playerId);
  return all.find((m) => m.id === matchId) ?? null;
}

export async function saveMatch(playerId: string, match: Match): Promise<void> {
  const all = await readJson<Match[]>(KEYS.matches(playerId), []);
  const idx = all.findIndex((m) => m.id === match.id);
  if (idx >= 0) all[idx] = match;
  else all.push(match);
  await writeJson(KEYS.matches(playerId), all);
}

export async function deleteMatch(
  playerId: string,
  matchId: string
): Promise<void> {
  const all = await readJson<Match[]>(KEYS.matches(playerId), []);
  await writeJson(
    KEYS.matches(playerId),
    all.filter((m) => m.id !== matchId)
  );
}

// --- Practice insights ---

export async function listInsights(
  playerId: string
): Promise<PracticeInsight[]> {
  return readJson<PracticeInsight[]>(KEYS.insights(playerId), []);
}

export async function saveInsight(
  playerId: string,
  insight: PracticeInsight
): Promise<void> {
  const all = await listInsights(playerId);
  const idx = all.findIndex((i) => i.id === insight.id);
  if (idx >= 0) all[idx] = insight;
  else all.push(insight);
  await writeJson(KEYS.insights(playerId), all);
}
