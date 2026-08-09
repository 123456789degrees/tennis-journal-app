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
      // first, fall back to unfiltered before giving up.
      let general = await search({ videoDuration: 'medium', maxResults: '4' });
      if (general.length === 0) general = await search({ maxResults: '4' });

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
