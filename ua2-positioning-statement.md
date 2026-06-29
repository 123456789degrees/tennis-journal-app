# UA2 — Positioning Statement

The deliverable of Stage 1. Drafted in Pass 1 from current belief, revised across Passes 2–4 as research and interview evidence comes in. Every clause must be defensible by the time Stage 1 exits.

The statement at the top is the public-facing artifact — short, clean, one paragraph. The evidence record below it is the working document where the student's thinking lives. The messiness in the evidence record is the point. Cleaning it up to look polished destroys the record of learning. This is a living document; its git history is part of the deliverable.

---

## Statement

> For *junior competitive tennis players who compete in USTA tournaments (roughly ages 12–18, possibly college players) and face the same opponents repeatedly over a season*
> who *are pushed to keep a tennis journal but hate doing it by hand, and want to remember opponents and what worked — even a year later — without the effort*,
> the *MatchMind* is a *tennis match journal and opponent-scouting app — you log past matches, then look up any opponent to see their playstyle and get tips on how to beat them*
> that *captures your matches in seconds and hands it all back the moment you need it — so you keep a journal worth having without the chore*.
> Unlike *relying on memory, asking teammates or coaches, or manual logging apps where you write and interpret your own opponent notes (like Opponote)*,
> our product *makes logging so fast and automatic that you actually keep it up, then instantly gives back your full head-to-head history and what worked against this opponent — with AI tips on how to beat them and what to practice as a bonus on top*.

---

## Status

Per-clause status. Mirrors the per-clause status in `UA0-PROJECT-STATUS.md`.

- **Target customer:** evidenced by interview
- **Need or opportunity:** evidenced by interview
- **Product name:** stable
- **Product category:** refined by research
- **Key benefit:** evidenced by interview
- **Primary competitive alternative:** refined by research
- **Primary differentiation:** evidenced by interview

Status values: `not started` | `drafted from belief` | `drafted-unconfirmed` | `refined by research` | `evidenced by interview` | `stable`.

---

## Evidence

One subsection per clause. Updated continuously across all five passes.

### Target customer

- **Current belief:** Junior competitive tennis players in USTA tournaments, roughly ages 12–18 (possibly college players), who compete within a section and face the same opponents repeatedly over a season.
- **Basis for the belief:** Joshua is one of these players; this is the world he knows. The repeat-opponent condition (needed for the H2H/tips feature to pay off) holds within a USTA section.
- **Interview evidence (2026-06-15):** Wylan and Daren both confirmed they play the same opponents multiple times. (Caveat: brothers interviewed together — correlated, not independent, sample.)
- **Open sub-hypothesis (UNTESTED):** AI tactical tips may appeal more to LESS tactically-experienced players than to strong players like Wylan/Daren. Not part of the clause yet; needs an interview with a less-experienced player to test.
- **Evidence found:**
  - 2026-06-15, origin interview (Joshua, self): The origin person is Joshua himself — a competitive junior tennis player who plays tournaments and practice matches and faces repeat opponents over a season. Parents are in the picture as the people pushing him to keep a journal.
- **Alternatives considered:**
- **What would change my mind:**

### Need or opportunity

- **Current belief (revised after interviews):** Players are pushed to keep a tennis journal but hate doing it by hand, and want to remember opponents and what worked — even a year later — without the effort.
- **Basis for the belief:** Joshua's own experience plus both interviews. The parent-driven journaling pain showed up identically across all three.
- **Interview evidence (2026-06-15):** Wylan and Daren both keep a physical journal ONLY because their mom forces them, and don't like it — same as Joshua's origin story. Strong, repeated signal. The *tactical-gap* half of the original need was weak: both said they mostly already know how to beat opponents.
- **Alternatives considered:**
  - Original (Pass 1): need framed as "remember opponents + know how to beat them." Revised — the "know how to beat them" tactical half didn't resonate with experienced players; the journaling-effort + recall half is what's strongly evidenced.
- **Evidence found:**
  - 2026-06-15, origin interview: Memory decays over long gaps — Joshua remembers opponents from a few months ago but not from a year ago.
  - 2026-06-15, origin interview: The pain is NOT forgetting opponents — Joshua says he remembers most opponents' games well. The real gap is tactical conversion: knowing a weakness but not knowing how to exploit it. Concrete example: a pusher/moonballer who defends and gets everything back; Joshua tried to attack, overhit and missed, and "didn't know how to fix the problem."
  - 2026-06-15, origin interview: Manual journaling fails at the point of capture. Right after a match he is drained/frustrated, just wants to relax, and feels he'll remember anyway — so the journal never gets written.
  - 2026-06-15, feature idea (Joshua): A second need beyond beating a specific opponent — players want to know what to WORK ON in practice. AI looks across the player's own recent matches, spots a recurring weakness (e.g., opponents keep attacking the backhand), and recommends drills (work on inside-out forehands, or a more powerful backhand). Suggests the deeper need is "turn my match history into a plan to get better," of which opponent-scouting is one half and self-improvement is the other.
- **Alternatives considered:**
- **What would change my mind:**

### Product name

- **Current belief:** MatchMind
- **Basis for the belief:** Chosen by Joshua after research + the Pass 4 pivot. "Match" (tennis) + "Mind" — the app is the memory/brain that holds your matches for you, which fits the effortless-capture-and-recall positioning.
- **Evidence found:**
  - 2026-06-15 (Pass 2 research): the earlier name "MatchBook" collides with a prominent sports-betting exchange (matchbook.com) and existing "Match Tennis App" names — renamed to avoid the clash.
- **Alternatives considered:** MatchBook (dropped — betting-brand collision); RallyLog, Courtside, AcePrep, Recap, Baseline (considered, not chosen).
- **What would change my mind:** Discovering a prominent existing tennis app named MatchMind, or testing showing the name confuses players about what it does.

> Mostly internal; thin evidence here is acceptable.

### Product category

- **Current belief:** A tennis match journal and opponent-scouting app — you log past matches, then look up any opponent to see their playstyle and get tips on how to beat them.
- **Basis for the belief:** Joshua describes it as both: a journal for logging past matches, and an opponent lookup (search a name → playstyle + tips to beat them) that delivers the value.
- **Evidence found:**
- **Alternatives considered:**
  - "Journal app" alone — dropped because it carries the chore baggage that killed Joshua's paper journal and undersells the scouting/tips payoff. Tension flagged: does "journal" framing repel the very user who hates journaling? To test in interviews.
- **What would change my mind:** If players say the logging is too much work to ever get to the scouting payoff, the category may need to lead with prep/scouting and minimize the journaling.

### Key benefit

- **Current belief (revised after interviews):** Captures your matches in seconds and hands it all back the moment you need it — so you keep a journal worth having without the chore.
- **Basis for the belief:** The interviews showed the magnetic value is removing the journaling effort (the confirmed pain), not the tactical advice (the lukewarm one).
- **Interview evidence (2026-06-15):** Both players' real, felt pain was being forced to journal by hand; both were only lukewarm on the tactical tips. So the benefit that lands is "effortless capture + instant recall," not "walk on with a plan."
- **Alternatives considered:**
  - Original: "walk on one step ahead with a plan." Demoted — it depends on the tactical-tips value that experienced players didn't feel. Still true as a secondary benefit.
- **Evidence found:**
  - 2026-06-15, origin interview (hint, not yet validated): The benefit Joshua seems to want is turning "I know their game" into "here's a concrete plan that beats their game" — tactical guidance against a specific opponent/playstyle.
  - 2026-06-15, feature idea (Joshua): Self-analysis mode lives on its own separate "practice" page and is AUTOMATIC — the AI analyzes your recent matches and surfaces weaknesses + drills on its own; the user does not search for it. Design principle: the app does the work for you (fits the journaling-averse user). Decision (Joshua, 2026-06-15): keep the headline key-benefit focused on opponent-prep; treat practice recommendations as a distinct automatic feature, not a second headline.
- **Alternatives considered:**
- **What would change my mind:**

### Primary competitive alternative

- **Current belief:** Relying on memory and asking teammates/coaches how an opponent plays; some players keep scattered paper notes. None of the alternatives are apps.
- **Basis for the belief:** Joshua named three real fallbacks — do nothing/rely on memory, take physical journal notes, or ask people how the opponent plays. The most common for juniors like him is memory + word-of-mouth.
- **Evidence found:**
  - 2026-06-15, origin interview: Players' real fallbacks are (1) nothing / rely on memory, (2) physical journal notes, (3) asking people how the opponent plays.
  - 2026-06-15, origin interview: Today Joshua does zero tactical prep before a rematch — he warms up physically and talks to no one. So the real competition is doing nothing / relying on in-the-moment memory, not another app.
  - 2026-06-15, origin interview: A paper journal (pushed by parents) is the nominal alternative, but it goes unused because of the point-of-capture friction above.
  - 2026-06-15 (Pass 2 research): There ARE app alternatives after all — manual match-logging / opponent-notes apps (Opponote, TennisKeeper, Tennis Alley, etc.). They are low-traction but real. Clause widened to include "manual logging apps where you write your own notes." See ua3-research-plan.md.
- **Alternatives considered:**
  - Original (Pass 1): "memory + word-of-mouth + paper notes, none of them apps." Revised — research showed manual logging apps exist.
- **What would change my mind:** If players overwhelmingly already use one of these apps and are happy, the "no good tool exists" premise weakens.

### Primary differentiation

- **Current belief (revised after interviews):** Makes logging so fast and automatic that you actually keep it up, then instantly gives back your full head-to-head history and what worked against this opponent — with AI tips on how to beat them and what to practice as a bonus on top.
- **Basis for the belief:** Pass 2 research narrowed this to the AI layer; the interviews then showed experienced players don't value the AI tips much, but DO live the journaling-effort pain. So the edge shifts to effortless/automatic capture + recall, with AI tips demoted to a bonus.
- **Evidence found:**
  - 2026-06-15 (Pass 2 research): Manual logging/notes apps exist (Opponote, TennisKeeper) but none auto-captures effortlessly or generates how-to-beat-them tips. See ua3-research-plan.md.
  - 2026-06-15 (interviews): AI tactical tips were "fine"/lukewarm to two experienced target customers; the forced-manual-journaling pain was strongly shared. Differentiation pivoted accordingly.
- **Alternatives considered:**
  - Pass 1: "never forgets + tactical plan." Pass 2: narrowed to "AI tells you how to beat them + what to practice." Pass 4: demoted the AI tips to a bonus after interviews; led with effortless automatic capture + recall.
- **What would change my mind / open risk:** This pivot leans on capture being *genuinely* faster and more effortless than a paper journal or Opponote — that has to be real, not just the same notes with fewer taps. **New #1 risk: prove the effortless-capture experience.** Also still untested whether AI tips matter to less-experienced players.
