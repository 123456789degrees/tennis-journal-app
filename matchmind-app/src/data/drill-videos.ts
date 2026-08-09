export interface DrillVideo {
  id: string;
  title: string;
  channelTitle: string;
  url: string;
  thumbnail: string;
}

// Fetches 1-2 curated drill videos for a practice suggestion. Falls back to
// a single "search YouTube" link (not a specific video) if the key isn't
// configured or the call fails — same resilient pattern as the other AI/API
// features, never leaves the drill with nothing to click.
export async function fetchDrillVideos(query: string): Promise<DrillVideo[]> {
  try {
    const res = await fetch('/api/drill-videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
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
      channelTitle: '',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} tennis drill`)}`,
      thumbnail: '',
    },
  ];
}
