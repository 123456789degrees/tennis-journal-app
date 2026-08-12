// Server-only route (Expo Router "+api" convention) — see opponent-scout+api.ts
// for why OPENROUTER_API_KEY is safe to read here.
//
// The Opponent Detail "Scouting profile" boxes were labeled as an AI
// summary but were actually a hand-coded sentiment heuristic (see
// data/scouting-summary.ts) — this is the real thing: one AI-synthesized
// sentence per field, recency-weighted across every match logged against
// this opponent, instead of a keyword-matched trend guess.

interface ScoutingMatch {
  date: string;
  forehand: string;
  serve: string;
  backhand: string;
  mental: string;
  other: string;
  whatWentWell: string;
  whatToImprove: string;
}

interface RequestBody {
  opponentName: string;
  matches: ScoutingMatch[]; // chronological, oldest first
}

type FieldKey = keyof Omit<ScoutingMatch, 'date'>;
const FIELDS: FieldKey[] = [
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
  const { opponentName, matches } = (await request.json()) as RequestBody;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ summary: {}, error: 'not_configured' });
  }

  const fieldsWithData = FIELDS.filter((f) => matches.some((m) => m[f]?.trim()));
  if (fieldsWithData.length === 0) {
    return Response.json({ summary: {}, error: 'no_data' });
  }

  const notesText = matches
    .map((m, i) => {
      const parts = FIELDS.filter((f) => m[f]?.trim()).map((f) => `${f}="${m[f]}"`);
      return parts.length > 0 ? `Match ${i + 1} (${m.date}): ${parts.join(', ')}` : null;
    })
    .filter(Boolean)
    .join('\n');

  const prompt = `You are a tennis scouting assistant. Here is a junior competitive player's notes from every match they've logged against an opponent named ${opponentName}, in chronological order (earliest first):

${notesText}

IMPORTANT — who each field is about: "forehand", "serve", "backhand", "mental", and "other" are the player's SCOUTING notes about ${opponentName}'s game. "whatWentWell" and "whatToImprove" are the player's SELF-REFLECTION about their OWN game specifically in matches against ${opponentName}. Never blur this — scouting fields must read unambiguously as being about the opponent (e.g. "Their forehand...", "${opponentName} tends to..."), and self-reflection fields must read unambiguously as being about the player (e.g. "Your backhand...", "You...").

For each field below that has at least one note, write ONE synthesized sentence covering the whole history, weighted toward the most recent matches — if the notes show a real change over time (improved, gotten worse, fixed, started happening again), say so explicitly instead of just repeating the latest note verbatim. Only include a field in your response if the notes above actually contain data for it. Fields to cover: ${fieldsWithData.join(', ')}.

Respond with ONLY a JSON object using exactly the keys that have data, like:
{"forehand": "...", "mental": "..."}`;

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
        max_tokens: 500,
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

    const summary: Record<string, string> = {};
    for (const f of fieldsWithData) {
      if (typeof parsed[f] === 'string' && parsed[f].trim()) summary[f] = parsed[f].trim();
    }
    return Response.json({ summary });
  } catch {
    return Response.json({ summary: {}, error: 'network_error' });
  }
}
