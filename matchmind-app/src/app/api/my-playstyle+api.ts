// Server-only route (Expo Router "+api" convention) — see opponent-scout+api.ts
// for why OPENROUTER_API_KEY is safe to read here.

interface RequestBody {
  forehand: string;
  serve: string;
  backhand: string;
  mental: string;
  other: string;
}

// Must match data/models.ts's PLAYSTYLES exactly — this route has no
// cross-file imports (see opponent-scout+api.ts), so the list is repeated
// here, and the model's output is validated against it below rather than
// trusted as free text.
const VALID_PLAYSTYLES = [
  'Pusher / moonballer',
  'Aggressive baseliner',
  'Serve-and-volley',
  'All-court',
  'Counterpuncher',
];

interface PlaystyleResult {
  primary: string;
  primaryPercent: number;
  secondary?: string;
  secondaryPercent?: number;
  summary: string;
  tips: string[];
}

function extractJsonObject(text: string): unknown | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function validate(parsed: unknown): PlaystyleResult | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  if (typeof p.primary !== 'string' || !VALID_PLAYSTYLES.includes(p.primary)) return null;
  if (typeof p.summary !== 'string' || !Array.isArray(p.tips)) return null;

  const primaryPercent = typeof p.primaryPercent === 'number' ? p.primaryPercent : 100;
  const result: PlaystyleResult = {
    primary: p.primary,
    primaryPercent,
    summary: p.summary,
    tips: p.tips.filter((t): t is string => typeof t === 'string').slice(0, 5),
  };

  // Secondary is optional — only keep it if it's a real, different, valid
  // category with a real percentage; otherwise this is just a clean
  // single-style result.
  if (
    typeof p.secondary === 'string' &&
    VALID_PLAYSTYLES.includes(p.secondary) &&
    p.secondary !== p.primary &&
    typeof p.secondaryPercent === 'number' &&
    p.secondaryPercent > 0
  ) {
    result.secondary = p.secondary;
    result.secondaryPercent = p.secondaryPercent;
  }

  return result;
}

export async function POST(request: Request) {
  const { forehand, serve, backhand, mental, other } = (await request.json()) as RequestBody;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'not_configured' });
  }

  const notesText = [
    `Forehand: ${forehand || '—'}`,
    `Serve: ${serve || '—'}`,
    `Backhand: ${backhand || '—'}`,
    `Mental / how they handle pressure: ${mental || '—'}`,
    other ? `Other: ${other}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `You are a tennis coach analyzing how a junior competitive player describes their OWN game (self-scouting, the same way they'd scout an opponent):

${notesText}

Classify their playstyle using ONLY these exact category names — do not invent new ones or rename them:
${VALID_PLAYSTYLES.map((s) => `- "${s}"`).join('\n')}

Most players are mostly one style but lean toward a second one too. Decide:
1. "primary" — the closest matching category (exact string from the list above)
2. "primaryPercent" — how strongly they fit it (a number, e.g. 65)
3. "secondary" — ONLY include this if their notes genuinely show real characteristics of a second, different category too (exact string from the list) — omit entirely (leave out of the JSON) if they're just one clear style
4. "secondaryPercent" — required if "secondary" is present; primaryPercent + secondaryPercent should add up to roughly 100
5. "summary" — 2-3 sentences describing their game AS DESCRIBED in their own notes, written directly to the player (e.g. "You've got a real weapon in your forehand, but pressure situations get to you...").
6. "tips" — 3 to 4 concrete, actionable tips for how to actually PLAY THEIR MATCHES given this specific profile (not generic drills) — e.g. "Since your backhand is your weaker wing, look to construct points that let you hit more forehands, even if it means running around it" or "Your patience is a weapon — in tiebreaks, let a big-hitting opponent beat themselves instead of trying to match their pace." Base these on what THEY specifically described, not boilerplate for the category in the abstract.

Respond with ONLY a JSON object, no other text, like:
{"primary": "Aggressive baseliner", "primaryPercent": 70, "secondary": "Counterpuncher", "secondaryPercent": 30, "summary": "...", "tips": ["...", "...", "..."]}`;

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
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return Response.json({ error: 'upstream_error', detail }, { status: 200 });
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    const parsed = extractJsonObject(content);
    const result = validate(parsed);
    if (!result) {
      return Response.json({ error: 'invalid_response' });
    }
    return Response.json(result);
  } catch {
    return Response.json({ error: 'network_error' });
  }
}
