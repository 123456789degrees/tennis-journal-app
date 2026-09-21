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
  // The player's own self-identified playstyle from the "My Playstyle" quiz
  // (see data/playstyle-quiz.ts) — undefined if they haven't taken it.
  // Loosely typed as a plain string here rather than importing the shared
  // Playstyle union: this route intentionally has no cross-file imports
  // (see opponent-scout+api.ts), and the value is only ever interpolated
  // into a prompt string, never branched on.
  playstyle?: string;
}

interface PatternResult {
  pattern: string;
  drill: string;
  searchQuery: string;
  // A concrete, actionable adjustment for the player's NEXT matches (e.g.
  // "hit crosscourt more and aim for more margin, don't aim for the
  // corner") — distinct from "drill", which is a practice-court exercise.
  // This is the primary thing shown to the player; drill/video are
  // supporting "how to practice it" extras.
  matchTip: string;
  // Which "Match N" labels (1-indexed, from the prompt's numbered list)
  // the model based this pattern on — the frequency/recency claim shown to
  // the player is computed from this list in code, not trusted from the
  // model's own prose, since an LLM asked to both find AND count a pattern
  // in the same breath is exactly the kind of arithmetic it gets subtly
  // wrong (off-by-one counts, "most recent" claims that aren't).
  matchNumbers: number[];
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
      .map((p) => ({
        ...p,
        searchQuery: typeof p.searchQuery === 'string' ? p.searchQuery : p.drill,
        matchTip: typeof p.matchTip === 'string' ? p.matchTip : '',
        matchNumbers: Array.isArray(p.matchNumbers) ? p.matchNumbers.filter((n: unknown) => typeof n === 'number') : [],
      }));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const { matches, excludePatterns = [], playstyle } = (await request.json()) as RequestBody;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ patterns: [], error: 'not_configured' });
  }

  const withReflection = matches.filter((m) => m.whatWentWell || m.whatToImprove);
  if (withReflection.length === 0) {
    return Response.json({ patterns: [], error: 'no_data' });
  }

  // Match 1 is explicitly labeled "most recent" (not just first-in-list) —
  // the model otherwise has no reliable signal for which end of the list is
  // newer, and recency is one of the two things it's being asked to weigh.
  const matchesText = withReflection
    .map(
      (m, i) =>
        `Match ${i + 1}${i === 0 ? ' (most recent)' : ''} (${m.date}, ${m.result}): went well = "${m.whatWentWell || '—'}"; to improve = "${m.whatToImprove || '—'}"`
    )
    .join('\n');

  const excludeText = excludePatterns.length
    ? `\n\nThe player has ALREADY been shown these patterns:\n${excludePatterns.map((p) => `- ${p}`).join('\n')}\nDo not return any of them again in any form — reusing the same underlying weakness with different wording still counts as a repeat and is NOT allowed. If the only real pattern the notes support is one already listed above, you MUST return an empty array rather than reword it. Only return a pattern here if it is about a genuinely different aspect of their game.`
    : '';

  const playstyleText = playstyle
    ? `\n\nThe player self-identifies as a "${playstyle}" (from their own self-assessment). Tailor "matchTip" to fit how that kind of player should actually adjust — the same weakness calls for different advice depending on their style (e.g. an aggressive baseliner with an inconsistent forehand needs a different real-match adjustment than a counterpuncher with the same issue would).`
    : '';

  const prompt = `You are a tennis practice-planning assistant for a junior competitive player. Here are their own self-reflection notes from their most recent matches, most recent first:

${matchesText}

Look across ALL of these (not just the latest one) and identify the SINGLE real recurring WEAKNESS OR MISTAKE that most deserves practice time right now — something genuinely costing them points, not something already going well. Use the "went well" notes only as context (e.g. to notice something that used to be a strength is slipping) — never surface something that's already going well as a pattern to fix.

Rank candidates by BOTH of these together, not either alone:
- FREQUENCY — how many of the matches above mention it in "to improve"
- RECENCY — how close to "most recent" those mentions are; something flagged in the last match or two outweighs something only seen much earlier in the list, even if the earlier one was mentioned slightly more times

Only surface a pattern if it's genuinely supported by the notes appearing more than once — don't invent anything. If nothing meets that bar, return an empty array rather than stretching a single one-off mention into a "pattern."${excludeText}${playstyleText}

Give exactly one result (or none, per the rule above) with:
1. "pattern" — one short sentence describing the weakness/mistake itself, written to the player directly (e.g. "Your backhand keeps breaking down under pressure on big points."). Do NOT state a specific count or number of matches in this sentence — just describe the weakness; how often and how recently it showed up is reported separately, from the match list you cite below, not from a number you write here.
2. "matchTip" — THE MAIN THING THE PLAYER READS. One concrete, actionable adjustment for their NEXT matches — something they can actually do differently on court, phrased as direct coaching advice (e.g. "Hit more backhands cross-court with margin instead of aiming for the corner — you don't need every ball to be a winner" or "Take pace off your first serve and prioritize a clean toss before adding speed back"). NOT a drill or practice exercise — an in-match tactical/technical adjustment, the kind of thing a coach would say to you between games.
3. "drill" — a SEPARATE, supporting practice-court exercise for building the habit in "matchTip" — one concrete drill done WITH A PARTNER, feeding live balls or playing out real points with an actual score or win/lose condition attached (e.g. "rally cross-court only, first to 11" or "partner returns live, serve only counts if you win the point in the first 3 shots") — NOT a solo repetition drill against a wall or ball machine, since that doesn't feel like a real match situation.
4. "searchQuery" — a short 3-5 word generic keyword phrase for that same drill, written the way a real YouTube tennis-instruction video would be titled (e.g. "backhand consistency drill" or "second serve topspin drill") — NOT a full sentence, since this gets used as a literal video search query
5. "matchNumbers" — the exact "Match N" numbers (from the numbered list above) whose "to improve" note is genuinely about this same pattern — this is what actually gets counted, so list every one that applies, not just a couple examples

Respond with ONLY a JSON array containing zero or one object, no other text, like:
[{"pattern": "...", "matchTip": "...", "drill": "...", "searchQuery": "...", "matchNumbers": [1, 2, 4]}]`;

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
        // Low, not zero — this is a ranking/selection task (which single
        // pattern is the biggest issue), not creative writing, so it
        // should give the same answer for the same match data most of the
        // time instead of visibly flip-flopping between refreshes.
        temperature: 0.2,
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
