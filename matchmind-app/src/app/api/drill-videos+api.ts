// Server-only route (Expo Router "+api" convention) — see opponent-scout+api.ts
// for why YOUTUBE_API_KEY is safe to read here.
//
// Finds 1-2 short (medium-length, ~4-20 min) YouTube videos for a given
// tennis practice drill, so a practice nudge links to something concrete
// to watch instead of just describing the drill in text.
//
// likedChannelIds/dislikedChannelIds come from the player's past thumbs
// up/down feedback (see data/drill-videos.ts + practice.tsx) — a liked
// creator's own channel gets searched directly first ("keep giving the
// same person"), and a disliked creator's videos are filtered out of the
// general results.

interface RequestBody {
  query: string; // the drill text, e.g. "Cross-court backhand consistency drill"
  likedChannelIds?: string[];
  dislikedChannelIds?: string[];
}

interface DrillVideo {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  url: string;
  thumbnail: string;
}

function mapItems(items: any[] | undefined): DrillVideo[] {
  return (items ?? [])
    .filter((item: any) => item.id?.videoId)
    .map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet?.title ?? 'Tennis drill video',
      channelId: item.snippet?.channelId ?? '',
      channelTitle: item.snippet?.channelTitle ?? '',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? '',
    }));
}

// Stroke names and filler words are present in almost every result YouTube
// returns for a query like "backhand pressure drill" regardless of true
// relevance — they don't discriminate. Whatever's LEFT after stripping them
// (here, "pressure") is the word actually distinguishing this drill from a
// generic one, so it's what results should be re-ranked against.
const NON_DISCRIMINATING_WORDS = new Set([
  'drill', 'drills', 'tennis', 'tutorial', 'tutorials', 'tip', 'tips', 'practice', 'video',
  'how', 'to', 'the', 'a', 'and', 'for', 'your', 'with',
  'forehand', 'backhand', 'serve', 'volley', 'volleys', 'footwork', 'return', 'returns',
  'slice', 'topspin', 'drop', 'shot', 'overhead', 'smash', 'approach', 'net',
]);

function discriminatingWords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ''))
    .filter((w) => w.length > 2 && !NON_DISCRIMINATING_WORDS.has(w));
}

// Re-ranks so videos whose title actually mentions the specific qualifier
// (not just the stroke type every candidate already matches) come first,
// without discarding the rest — a stable sort, so relevance order is the
// tiebreaker exactly like before when nothing distinguishes two candidates.
function preferDiscriminating(videos: DrillVideo[], words: string[]): DrillVideo[] {
  if (words.length === 0) return videos;
  return [...videos].sort((a, b) => {
    const aMatch = words.some((w) => a.title.toLowerCase().includes(w)) ? 1 : 0;
    const bMatch = words.some((w) => b.title.toLowerCase().includes(w)) ? 1 : 0;
    return bMatch - aMatch;
  });
}

export async function POST(request: Request) {
  const {
    query,
    likedChannelIds = [],
    dislikedChannelIds = [],
  } = (await request.json()) as RequestBody;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !query?.trim()) {
    return Response.json({ videos: [], error: apiKey ? 'no_data' : 'not_configured' });
  }

  const searchQuery = `${query} tennis drill tutorial`;

  async function search(extra: Record<string, string>): Promise<DrillVideo[]> {
    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      order: 'relevance',
      safeSearch: 'strict',
      q: searchQuery,
      key: apiKey!,
      ...extra,
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return mapItems(data.items);
  }

  try {
    const results: DrillVideo[] = [];

    // "Keep giving the same person" — search a liked creator's own channel
    // for this topic before falling back to a general search.
    for (const channelId of likedChannelIds) {
      if (results.length >= 2 || !channelId) continue;
      const fromLiked = await search({ channelId, maxResults: '1' });
      for (const v of fromLiked) {
        if (!dislikedChannelIds.includes(v.channelId) && !results.some((r) => r.id === v.id)) {
          results.push(v);
        }
      }
    }

    if (results.length < 2) {
      // The medium-duration filter (~4-20 min) is a nice-to-have, but a
      // specific drill query can already return few/no results on its own —
      // narrowing further by duration only makes that worse. Try filtered
      // first, fall back to unfiltered before giving up. Fetch more than we
      // need (8) so there's real material to re-rank for relevance instead
      // of just accepting whatever YouTube ranked first.
      let general = await search({ videoDuration: 'medium', maxResults: '8' });
      if (general.length === 0) general = await search({ maxResults: '8' });

      general = preferDiscriminating(general, discriminatingWords(query));

      for (const v of general) {
        if (results.length >= 2) break;
        if (dislikedChannelIds.includes(v.channelId)) continue;
        if (results.some((r) => r.id === v.id)) continue;
        results.push(v);
      }
    }

    return Response.json({ videos: results });
  } catch {
    return Response.json({ videos: [], error: 'network_error' });
  }
}
