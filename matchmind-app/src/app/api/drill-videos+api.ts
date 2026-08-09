// Server-only route (Expo Router "+api" convention) — see opponent-scout+api.ts
// for why YOUTUBE_API_KEY is safe to read here.
//
// Finds 1-2 short (medium-length, ~4-20 min) YouTube videos for a given
// tennis practice drill, so a practice nudge links to something concrete
// to watch instead of just describing the drill in text.

interface RequestBody {
  query: string; // the drill text, e.g. "Cross-court backhand consistency drill"
}

interface DrillVideo {
  id: string;
  title: string;
  channelTitle: string;
  url: string;
  thumbnail: string;
}

export async function POST(request: Request) {
  const { query } = (await request.json()) as RequestBody;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !query?.trim()) {
    return Response.json({ videos: [], error: apiKey ? 'no_data' : 'not_configured' });
  }

  const searchQuery = `${query} tennis drill tutorial`;

  async function search(withDurationFilter: boolean): Promise<DrillVideo[]> {
    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      maxResults: '2',
      order: 'relevance',
      safeSearch: 'strict',
      q: searchQuery,
      key: apiKey!,
    });
    if (withDurationFilter) params.set('videoDuration', 'medium'); // YouTube's own bucket: ~4-20 minutes

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json();
    return (data.items ?? [])
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet?.title ?? 'Tennis drill video',
        channelTitle: item.snippet?.channelTitle ?? '',
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? '',
      }));
  }

  try {
    // The medium-duration filter (~4-20 min) is a nice-to-have, but a
    // specific drill query can already return zero results on its own —
    // narrowing further by duration only makes that worse. Try filtered
    // first for a better-length video, fall back to unfiltered before
    // giving up and showing a plain search link.
    let videos = await search(true);
    if (videos.length === 0) videos = await search(false);
    return Response.json({ videos });
  } catch {
    return Response.json({ videos: [], error: 'network_error' });
  }
}
