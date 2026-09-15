-- MatchMind database schema.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste
-- this whole file -> Run.
--
-- Auth (accounts, passwords, sessions) is handled entirely by Supabase's
-- built-in `auth.users` table -- there is no separate "players" table here.
-- Each of these tables holds one player's data, scoped by "ownerPlayerId"
-- (== auth.users.id), with row-level security so a player can only ever
-- read/write their own rows -- mirroring the old comment in storage.ts:
-- "there is no cross-player read path anywhere."
--
-- Columns are camelCase (quoted) to match the TypeScript models in
-- src/data/models.ts exactly, so the app code needs no snake_case <-> camelCase
-- mapping layer.

create table if not exists public.opponents (
  id text primary key,
  "ownerPlayerId" uuid not null references auth.users(id) on delete cascade,
  name text not null,
  playstyle text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.matches (
  id text primary key,
  "ownerPlayerId" uuid not null references auth.users(id) on delete cascade,
  "opponentId" text not null,
  date timestamptz not null,
  score jsonb not null default '[]',
  result text not null,
  "playstyleSnapshot" text not null,
  "scoutingNotes" jsonb not null default '{}',
  "selfReflection" jsonb not null default '{}',
  "matchNotes" text not null default ''
);

create table if not exists public.practice_insights (
  id text primary key,
  "ownerPlayerId" uuid not null references auth.users(id) on delete cascade,
  "patternDescription" text not null,
  "suggestedDrill" text not null,
  "drillSearchQuery" text,
  "sourceMatchIds" jsonb not null default '[]',
  status text not null,
  "correctionNote" text
);

create table if not exists public.video_feedback (
  "ownerPlayerId" uuid not null references auth.users(id) on delete cascade,
  "videoId" text not null,
  title text not null,
  url text not null,
  thumbnail text not null,
  "channelId" text not null,
  "channelTitle" text not null,
  liked boolean not null,
  "updatedAt" timestamptz not null default now(),
  primary key ("ownerPlayerId", "videoId")
);

-- Row-level security: every table, every player can only touch their own rows.
alter table public.opponents enable row level security;
alter table public.matches enable row level security;
alter table public.practice_insights enable row level security;
alter table public.video_feedback enable row level security;

create policy "opponents_owner_all" on public.opponents
  for all using (auth.uid() = "ownerPlayerId") with check (auth.uid() = "ownerPlayerId");

create policy "matches_owner_all" on public.matches
  for all using (auth.uid() = "ownerPlayerId") with check (auth.uid() = "ownerPlayerId");

create policy "practice_insights_owner_all" on public.practice_insights
  for all using (auth.uid() = "ownerPlayerId") with check (auth.uid() = "ownerPlayerId");

create policy "video_feedback_owner_all" on public.video_feedback
  for all using (auth.uid() = "ownerPlayerId") with check (auth.uid() = "ownerPlayerId");
