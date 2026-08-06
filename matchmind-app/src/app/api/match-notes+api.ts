// Server-only route (Expo Router "+api" convention) — see opponent-scout+api.ts
// for why OPENROUTER_API_KEY is safe to read here.
//
// Takes the raw notes from ONE match (scouting + self-reflection, whatever
// the player typed or dictated right after the match) and asks an LLM to
// turn each into a sharper, one-sentence analytical read — not just echoing
// the raw text back on Match Detail.

interface RequestBody {
  forehand: string;
  serve: string;
  backhand: string;
  mental: string;
  other: string;
  whatWentWell: string;
  whatToImprove: string;
}

type NoteKey = keyof RequestBody;
const KEYS: NoteKey[] = [
  'forehand',
  'serve',
  'backhand',
  'mental',
  'other',
  'whatWentWell',
  'whatToImprove',
];

function extractJsonObject(text: string): Record<string, string> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;

  const nonEmpty = KEYS.filter((k) => body[k]?.trim());
  if (nonEmpty.length === 0) {
    return Response.json({ summary: {}, error: 'no_data' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ summary: {}, error: 'not_configured' });
  }

  const notesText = nonEmpty.map((k) => `"${k}": "${body[k]}"`).join('\n');

  const prompt = `A junior competitive tennis player just logged these raw notes immediately after a match. Rewrite EACH one into a sharper, more useful one-sentence analytical read — same meaning, more concrete and coach-like, not just rephrasing filler. Don't invent details that aren't implied by the original. Keep each to one sentence.

Raw notes:
${notesText}

Respond with ONLY a JSON object using exactly these keys (only the ones given above): ${nonEmpty.map((k) => `"${k}"`).join(', ')}.`;

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
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return Response.json({ summary: {}, error: 'upstream_error', detail }, { status: 200 });
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    const parsed = extractJsonObject(content);
    if (!parsed) {
      return Response.json({ summary: {}, error: 'parse_error' });
    }

    // Only keep keys that were actually asked for, and only string values.
    const summary: Record<string, string> = {};
    for (const k of nonEmpty) {
      if (typeof parsed[k] === 'string' && parsed[k].trim()) summary[k] = parsed[k].trim();
    }
    return Response.json({ summary });
  } catch {
    return Response.json({ summary: {}, error: 'network_error' });
  }
}
