export interface DrillVideo {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  url: string;
  thumbnail: string;
}

export interface ChannelBias {
  likedChannelIds: string[];
  dislikedChannelIds: string[];
}

const KEYWORDS = [
  'forehand',
  'backhand',
  'serve',
  'volley',
  'footwork',
  'return',
  'slice',
  'topspin',
  'drop shot',
  'overhead',
  'smash',
  'approach shot',
  'net',
];

// Insights saved before drillSearchQuery existed (or any AI response that
// skips it) only have the full coaching sentence, which is too long-tail a
// query for YouTube search to reliably match a real video against. Pull out
// a recognizable tennis keyword instead of sending the whole sentence.
export function shortenForSearch(text: string): string {
  const lower = text.toLowerCase();
  const found = KEYWORDS.filter((k) => lower.includes(k));
  if (found.length > 0) return `${found.slice(0, 2).join(' ')} drill`;
  return `${text.split(/\s+/).slice(0, 5).join(' ')} drill`;
}

// Fetches 1-2 curated drill videos for a practice suggestion. Falls back to
// a single "search YouTube" link (not a specific video) if the key isn't
// configured or the call fails — same resilient pattern as the other AI/API
// features, never leaves the drill with nothing to click.
//
// `bias` is derived from the player's past per-video thumbs up/down feedback
// (models.ts's VideoFeedback, see practice.tsx's channelBiasFrom) — it
// biases results toward creators the player already liked and away from
// ones they didn't. See api/drill-videos+api.ts for how that's used.
export async function fetchDrillVideos(
  query: string,
  bias?: ChannelBias
): Promise<DrillVideo[]> {
  try {
    const res = await fetch('/api/drill-videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        likedChannelIds: bias?.likedChannelIds ?? [],
        dislikedChannelIds: bias?.dislikedChannelIds ?? [],
      }),
    });
    const data = await res.json();
    if (Array.isArray(data.videos) && data.videos.length > 0) {
      return data.videos as DrillVideo[];
    }
  } catch {
    // fall through to the search-link fallback
  }
  return [
    {
      id: 'search',
      title: `Search YouTube for "${query}"`,
      channelId: '',
      channelTitle: '',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} tennis drill`)}`,
      thumbnail: '',
    },
  ];
}
