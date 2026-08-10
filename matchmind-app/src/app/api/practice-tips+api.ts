// Server-only route (Expo Router "+api" convention) — see opponent-scout+api.ts
// for why OPENROUTER_API_KEY is safe to read here.

interface ReflectionMatch {
  date: string;
  result: string;
  whatWentWell: string;
  whatToImprove: string;
}

interface RequestBody {
  matches: ReflectionMatch[]; // most recent first
  excludePatterns?: string[]; // patterns already shown — asked to avoid repeating these
}

interface PatternResult {
  pattern: string;
  drill: string;
  searchQuery: string;
}

function extractJsonArray(text: string): PatternResult[] | null {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((p): p is PatternResult => typeof p?.pattern === 'string' && typeof p?.drill === 'string')
      .map((p) => ({ ...p, searchQuery: typeof p.searchQuery === 'string' ? p.searchQuery : p.drill }));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const { matches, excludePatterns = [] } = (await request.json()) as RequestBody;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ patterns: [], error: 'not_configured' });
  }

  const withReflection = matches.filter((m) => m.whatWentWell || m.whatToImprove);
  if (withReflection.length === 0) {
    return Response.json({ patterns: [], error: 'no_data' });
  }

  const matchesText = withReflection
    .map(
      (m, i) =>
        `Match ${i + 1} (${m.date}, ${m.result}): went well = "${m.whatWentWell || '—'}"; to improve = "${m.whatToImprove || '—'}"`
    )
    .join('\n');

  const excludeText = excludePatterns.length
    ? `\n\nThe player has ALREADY been shown these patterns:\n${excludePatterns.map((p) => `- ${p}`).join('\n')}\nDo not return any of them again in any form — reusing the same underlying weakness with different wording still counts as a repeat and is NOT allowed. If the only real pattern the notes support is one already listed above, you MUST return an empty array rather than reword it. Only return a pattern here if it is about a genuinely different aspect of their game.`
    : '';

  const prompt = `You are a tennis practice-planning assistant for a junior competitive player. Here are their own self-reflection notes from their most recent matches, most recent first:

${matchesText}

Look across ALL of these (not just the latest one) and identify up to 2 real recurring WEAKNESSES OR MISTAKES — things that are genuinely costing them points and need work. Use the "went well" notes only as context (e.g. to notice something that used to be a strength is slipping) — never surface something that's already going well as a pattern to fix. Only surface a pattern if it's genuinely supported by the "to improve" notes appearing more than once — don't invent anything, and don't pad the list with a strength just to reach 2 items; it's fine to return just 1, or an empty array, if that's all the notes support.${excludeText}

For each pattern give:
1. "pattern" — one short sentence describing the weakness/mistake, written to the player directly (e.g. "Your backhand has broken down under pressure in 3 of your last 4 matches.")
2. "drill" — one concrete, specific practice drill or focus that directly addresses that weakness
3. "searchQuery" — a short 3-5 word generic keyword phrase for that same drill, written the way a real YouTube tennis-instruction video would be titled (e.g. "backhand consistency drill" or "second serve topspin drill") — NOT a full sentence, since this gets used as a literal video search query

Respond with ONLY a JSON array, no other text, like:
[{"pattern": "...", "drill": "...", "searchQuery": "..."}]`;

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
      return Response.json({ patterns: [], error: 'upstream_error', detail }, { status: 200 });
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    const patterns = extractJsonArray(content);
    return Response.json({ patterns: patterns ?? [] });
  } catch {
    return Response.json({ patterns: [], error: 'network_error' });
  }
}
