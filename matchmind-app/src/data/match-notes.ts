export interface RawMatchNotes {
  forehand: string;
  serve: string;
  backhand: string;
  mental: string;
  other: string;
  whatWentWell: string;
  whatToImprove: string;
}

// Sends one match's raw notes to the AI for a sharper analytical rewrite,
// instead of Match Detail just echoing back exactly what was typed/dictated
// seconds earlier. Falls back to the raw text itself (per field) if the key
// isn't configured or the call fails — never blocks or blanks out a note.
export async function fetchMatchNotesSummary(
  raw: RawMatchNotes
): Promise<Partial<RawMatchNotes>> {
  const fallback: Partial<RawMatchNotes> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value.trim()) fallback[key as keyof RawMatchNotes] = value;
  }

  try {
    const res = await fetch('/api/match-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(raw),
    });
    const data = await res.json();
    if (data.summary && Object.keys(data.summary).length > 0) {
      return { ...fallback, ...data.summary };
    }
  } catch {
    // fall through to raw text
  }
  return fallback;
}
