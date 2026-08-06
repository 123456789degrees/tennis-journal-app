// Server-only route (Expo Router "+api" convention) — this file never ships
// to the client bundle, so OPENROUTER_API_KEY is safe to read here even
// though it has no EXPO_PUBLIC_ prefix.

interface ScoutingMatch {
  date: string;
  forehand: string;
  serve: string;
  backhand: string;
  mental: string;
  other: string;
}

interface RequestBody {
  opponentName: string;
  playstyle: string;
  matches: ScoutingMatch[]; // chronological, oldest first
}

export async function POST(request: Request) {
  const { opponentName, playstyle, matches } = (await request.json()) as RequestBody;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ tip: null, error: 'not_configured' });
  }

  const notesWithText = matches.filter(
    (m) => m.forehand || m.serve || m.backhand || m.mental || m.other
  );
  if (notesWithText.length === 0) {
    return Response.json({ tip: null, error: 'no_data' });
  }

  const notesText = notesWithText
    .map(
      (m, i) =>
        `Match ${i + 1} (${m.date}): forehand="${m.forehand || '—'}", serve="${m.serve || '—'}", backhand="${m.backhand || '—'}", mental="${m.mental || '—'}", other="${m.other || '—'}"`
    )
    .join('\n');

  const prompt = `You are a tennis scouting assistant helping a junior competitive player prepare for a rematch against an opponent named ${opponentName}, whose general playstyle is "${playstyle}".

Here are the player's own scouting notes from every past match against this opponent, in chronological order (earliest first):

${notesText}

Write a short, concrete "how to beat them" tip (2-4 sentences). Weight recent matches more heavily than old ones — if the notes show the opponent has improved or gotten worse at something over time, say so explicitly (e.g. "their backhand looked shaky early on but has gotten more reliable recently"). Factor in the mental/mentality notes too — e.g. if they tighten up under pressure, suggest extending rallies on big points. Be specific and tactical, not generic. Synthesize the notes — don't just repeat them verbatim.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'MatchMind',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 220,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return Response.json({ tip: null, error: 'upstream_error', detail }, { status: 200 });
    }

    const data = await res.json();
    const tip: string | undefined = data.choices?.[0]?.message?.content?.trim();
    return Response.json({ tip: tip || null });
  } catch {
    return Response.json({ tip: null, error: 'network_error' });
  }
}
