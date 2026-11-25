// Server-only route (Expo Router "+api" convention) — this file never ships
// to the client bundle, so OPENROUTER_API_KEY is safe to read here even
// though it has no EXPO_PUBLIC_ prefix.

interface ScoutingMatch {
  date: string;
  forehand: string;
  serve: string;
  backhand: string;
  other: string;
}

interface RequestBody {
  opponentName: string;
  playstyle: string;
  matches: ScoutingMatch[]; // chronological, oldest first
}

// Real, standard tennis strategy for beating each playstyle category — not
// left to the model to free-associate, so the tip stays grounded in actual
// tactics even if the scouting notes are thin. Keys must match
// data/models.ts's PLAYSTYLES exactly; this route has no cross-file imports
// (same convention as the other +api routes), so the list is repeated here.
const PLAYSTYLE_STRATEGY: Record<string, string> = {
  'Pusher / moonballer':
    'Come forward and finish points at net rather than trying to out-rally them from the baseline — they will get almost everything back. Take the ball early and on the rise to deny them time to reset into their defensive position, and mix in drop shots and short angles to pull them forward, since they usually struggle more moving in than grinding from behind the baseline. Stay patient and build the point; forcing a low-percentage shot against a high-margin opponent is how they win.',
  'Aggressive baseliner':
    "Take their pace away with slice, moonballs, and change of pace instead of matching their power — feeding a steady rhythm of balls at a consistent height and speed is exactly what they want to attack. Keep the ball deep and to their weaker wing to limit how often they can step in, and extend rallies, since their unforced error count usually climbs the longer a point goes given how much risk they take. Look to approach the net behind any short ball before they can set up on it.",
  'Serve-and-volley':
    "Focus returns low and at their feet to force a difficult first volley, and use lobs when they're camped at net. Target the body on the return — less time to react to a ball hit directly at them than one to either side. Make them win it on the second serve by standing in and attacking a weaker second ball before they can get forward.",
  'All-court':
    "Figure out their pattern early and force whatever tempo makes them least comfortable — these players rely on variety, so keeping points efficient (not letting a rally run long enough for them to cycle through tactics) takes that away. Once you spot a clearly weaker side, attack it directly instead of playing a balanced, symmetric game back at them.",
  Counterpuncher:
    "Be the one to dictate — they're built to absorb pace and redirect it, so trying to out-rally them from the baseline plays into their hands. Construct the point patiently but finish decisively once you get a short ball, including coming to net, rather than giving them a chance to reset with an unforced error. Mixing in drop shots also works well since counterpunchers are usually more comfortable camped on the baseline than moving forward.",
};

export async function POST(request: Request) {
  const { opponentName, playstyle, matches } = (await request.json()) as RequestBody;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ tip: null, error: 'not_configured' });
  }

  const notesWithText = matches.filter((m) => m.forehand || m.serve || m.backhand || m.other);

  const notesText = notesWithText
    .map(
      (m, i) =>
        `Match ${i + 1} (${m.date}): forehand="${m.forehand || '—'}", serve="${m.serve || '—'}", backhand="${m.backhand || '—'}", other="${m.other || '—'}"`
    )
    .join('\n');

  const strategyForStyle = PLAYSTYLE_STRATEGY[playstyle];
  const strategyText = strategyForStyle
    ? `\n\nStandard strategy for beating a "${playstyle}" player in general:\n${strategyForStyle}`
    : '';

  // No scouting notes at all yet — the tip can still lean entirely on the
  // general playstyle strategy above instead of saying nothing.
  if (notesWithText.length === 0 && !strategyForStyle) {
    return Response.json({ tip: null, error: 'no_data' });
  }

  const prompt = `You are a tennis strategy assistant helping a junior competitive player prepare for a rematch against an opponent named ${opponentName}, whose general playstyle is "${playstyle}".${strategyText}

Here are the player's own scouting notes from every past match against this opponent, in chronological order (earliest first) — "other" covers mentality (tightens up under pressure, gets frustrated, etc.) as well as anything else that isn't a stroke:

${notesText || '(No scouting notes logged yet — base the tip on the general playstyle strategy above.)'}

Write a short, concrete "how to beat them" tip (3-5 sentences) that blends BOTH of these together, not just one:
1. The standard strategy for beating their playstyle category, adapted to make sense for this specific matchup
2. Specific things actually observed about THIS opponent in the notes above — weight recent matches more heavily than old ones, and if the notes show they've improved or gotten worse at something over time, say so explicitly (e.g. "their backhand looked shaky early on but has gotten more reliable recently")

If a specific note contradicts or sharpens the general playstyle strategy (e.g. a "Pusher / moonballer" whose notes say their backhand is actually a real weapon), favor what's actually been observed over the generic assumption. Give real, actionable tennis tactics — actual shot selection, court positioning, and point construction — not vague encouragement. Synthesize everything into one cohesive game plan rather than listing the strategy and the notes separately.`;

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
        max_tokens: 320,
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
