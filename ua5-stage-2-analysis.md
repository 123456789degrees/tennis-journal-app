# UA5 — Stage 2 Analysis

The Stage 2 deliverable. Pulls together what exists in the space, who has a stake in the system beyond the users, who actually uses it, and what users are doing today when they need what the system would provide.

The positioning statement is revisited throughout. If any analysis contradicts a clause, the student revises `ua2-positioning-statement.md`.

---

## Landscape

*(Drafted from the Pass 2 research in `ua3-research-plan.md`; Joshua to review, correct, and add what he knows from real players.)*

### Adjacent products

- **Opponote** — Manual match logging + opponent notes (tag by skill tier / dominant hand, Elo, win-probability charts). Free, iPhone-only, indie, brand new (July 2025), tiny traction. Closest direct competitor. **Does well:** simple, private, on-device. **Gap:** all notes are manual (you write them), no AI, no effortless capture, no auto practice tips.
- **TennisKeeper** — Logs match scores + stats; win/loss and head-to-head records vs specific opponents; long-term trends; Apple Watch. **Does well:** H2H and trends. **Gap:** stat-tracking, not effortless journaling or opponent game-plans.
- **SwingVision** — AI from video: auto scoring, shot stats, line calling. **Does well:** automated stats/highlights. **Gap:** needs you to film; about your shots, not opponent recall or journaling.
- **TennisAI / OnCourtAI** — AI coaching feedback on your own stroke technique from video. **Gap:** technique only; nothing about opponents or match journaling.
- **Many small loggers** (Deucey, Tennis Alley, "Tennis Journal," Tennisphere, TennisData2) — fragmented field of manual match trackers. Signal: lots of people want to log matches; none has solved effortless capture + recall + tips.

> **Key finding (Joshua, 2026-06-15):** None of the players Joshua actually knows (Wylan, Daren, others in his section) use ANY tennis app. So these apps are theoretical competitors, not real ones, for the target users. **The real competitive alternative is the paper journal + memory** — which matches the positioning statement's competitive-alternative clause. Implication: the bar for "effortless capture" is "easier than a notebook and more reliable than memory," not "better than Opponote." The app competitors are a future/secondary concern, not the thing to beat first.

### Open-source candidates

- None identified yet. *(Open question: any open-source match-tracker or note app worth learning from? Low priority — to revisit if building.)*

### Category

- The category customers think they're shopping in: a **tennis match journal / match-tracking app** (App Store "Sports").
- What that category brings with it: expectations of quick score entry, opponent/match history, stats/charts, free or low-cost, mobile-first.
- Fit or misfit: **fit** — MatchMind sits in a known category, so it's understood instantly. The job is to be the *best at effortless capture + recall*, not to invent a new category.

### Inherited conventions

For each: keep, break on purpose, or open.

- Quick score entry (sets/games) — **keep** (expected).
- Per-opponent history / head-to-head view — **keep** (core to the idea).
- Stats and charts over time — **keep** (light version).
- Manual note-writing as the main input — **break on purpose** (MatchMind's whole edge is making capture effortless/automatic, not a blank notes box).
- Mobile-first, works on a phone — **keep**.
- Private / on-device data (Opponote leans on this) — **open** (decide later; matters for under-13 privacy — see compliance).

---

## Stakeholders and users

### Stakeholders

| Stakeholder | Stake | Their version of "success" |
|---|---|---|
| **Parents** (primary stakeholder) | They push their kids to keep a tennis journal and reflect on matches; they invest money/time in lessons and tournaments and want to see improvement. | Their kid actually reflects on and learns from matches — without the parent having to nag — and gets better over time. May be the one who encourages/installs/pays for the app. |
| Coaches (minor / situational) | Care about player improvement; could use the recap. | Not central in Joshua's world — most players here don't loop a coach into prep. Noted, not a driver. |

*(Self-idea path, not client path — there is no client. The player is the user; the parent is the key non-user stakeholder.)*

### Users (recap from Stage 1, with Stage 2 updates)

- **Primary user type:** Junior competitive USTA players (~12–18) who face repeat opponents and are pushed to journal but hate doing it by hand.
- **Secondary user types (if any):** Parents are stakeholders, not really day-to-day users (though a parent might glance at progress).
- **What's been added or revised since Stage 1:** The "parent as the force behind journaling" is now explicit — it's both the source of the pain and the adoption lever.

### Compliance and accessibility considerations

- **Design decision (Joshua, 2026-06-15): MatchMind is private and personal.** Each player's logs and opponent notes are visible only to them (own device / private account). No public or shared database of players. This is the key privacy safeguard — opponent notes are like a personal notebook, not a public dossier.
- **COPPA (under-13 users):** Because the 12-and-under division means some users are under 13, a parent should be involved in the account / give consent. Fits naturally since parents are the key stakeholder anyway.
- **PII about other minors:** Mitigated by the private/personal design — opponent info never leaves the individual user's private space; no sharing, no public profiles.
- **Accessibility:** Mobile app for teens; keep capture fast and high-contrast/legible. Lightweight note for now (not a production WCAG audit).

---

## Jobs-to-be-done and scenarios

### Job 1 — Capture a match without the effort

- **JTBD statement:** When I've just finished a match and I'm drained (or upset), I want to record what happened in a few seconds, so I don't lose it but don't have to sit down and write a journal entry.
- **How do we know it's a real job:** Joshua's origin story — too drained/frustrated to journal in the car after a loss. Wylan and Daren both keep a paper journal only because their mom forces them, and dislike it.
- **What people do today:** A parent tells them to write in a paper journal at home. Usually it doesn't happen, or it's a single sentence scribbled days later when the detail is already fading.
- **Why has the current way persisted:** Paper has zero setup, the parent can see it's "done," and there's nothing to learn. But it's slow, easy to skip, and useless for looking things up later.

#### Scenario 1.1 — Logging a tough loss in the car

> Joshua just lost a close match to a pusher. He's frustrated, sitting in the car, and his mom says "log it." He opens MatchMind. **Something goes wrong:** he's angry and does NOT want to relive the match by typing it all out — he's about to close the app. **Recovery:** MatchMind doesn't make him write anything. He taps the score, taps one or two quick tags ("pusher," "loss"), and — if he wants — holds a button and says one sentence: "I kept overhitting against the moonballs." Twenty seconds, done. That evening, calmer, he optionally opens it again and adds a note. **Need met:** the match is captured the moment it happened, without forcing him to relive it in detail.

**Reads back against positioning statement:** Delivers the **key benefit** ("captures your matches in seconds... without the chore"). ✔

### Job 2 — Recall an opponent before a rematch

- **JTBD statement:** When I'm about to play someone I've faced before (maybe a year ago), I want to instantly see how they play and what worked last time, so I walk on prepared instead of relying on faded memory.
- **How do we know it's a real job:** Joshua remembers recent opponents but loses the detail after ~a year. Wylan and Daren both confirmed they face the same opponents repeatedly.
- **What people do today:** Rely on memory (fine for recent, fails after long gaps); maybe ask around; or do nothing and just warm up physically. A paper journal is rarely dug out and isn't searchable.
- **Why has the current way persisted:** Memory is instant and free for recent opponents — good enough most of the time, which is why nobody bothers with a system until the long-gap rematch burns them.

#### Scenario 2.1 — Drawing a familiar name in the bracket

> Joshua sees the draw and recognizes a name he played last season but can't remember how. He opens MatchMind and searches the name. **Something goes wrong:** he barely logged that match (just a score and one tag), so there isn't much there — OR he'd saved the player under a slightly different name and the search comes up empty at first. **Recovery:** the app suggests close name matches so he finds the right player, and even the thin entry ("pusher / I overhit") is enough to jog his memory and form a simple plan: be patient, don't force winners. He also notices that the sparse note is his own fault from last time — nudging him to capture a bit more today. **Need met:** he walks on recalling a plan instead of a blank.

**Reads back against positioning statement:** Delivers the **key benefit** (recall "the moment you need it") and shows the system depends on Job 1 capture being easy. ✔

### Job 3 — Know what to practice (the bonus / AI layer)

- **JTBD statement:** When I've played several matches recently, I want the app to point out a recurring weakness in MY game and suggest what to drill, so my practice targets what's actually losing me points.
- **How do we know it's a real job:** WEAKER EVIDENCE — flagged. Grounded in Joshua's own origin pain (knew a weakness but not how to fix it) and his feature idea. BUT Wylan and Daren were only lukewarm on AI tips because they already know their tactics. So this job is real for Joshua and probably for less-experienced players, but NOT yet validated for the experienced segment. To test with a less-experienced player.
- **What people do today:** Practice whatever the coach sets, or just rally randomly. Players rarely connect a specific recent loss to a specific practice focus on their own.
- **Why has the current way persisted:** The coach drives practice; showing up and hitting is low-effort; self-analysis is hard, so almost nobody does it.

#### Scenario 3.1 — An automatic practice nudge

> Over a few weeks Joshua logs five matches. MatchMind notices that in three of them he tagged points lost on his backhand / opponents attacking it. On the practice page it surfaces on its own: "Your backhand got attacked in 3 of your last 5 matches — here's a drill to build a steadier backhand." **Something goes wrong:** Joshua thinks the tip is generic or even wrong — he feels the real problem was his footwork, not the stroke — and he's about to ignore it and stop trusting the feature. **Recovery:** he can tap "not quite" and pick the real issue (movement), which both corrects this suggestion and trains future ones; the drill it links to is concrete enough to actually try. **Need met (conditionally):** practice targets a real weakness — but ONLY if the tips are specific and the player can correct them. If the tips are vague, this job fails.

**Reads back against positioning statement:** This is the **"AI tips... as a bonus"** part of the differentiation. Honest note: the scenario's failure branch IS the project's #1 risk — tip quality and trust. Delivers the bonus only if that risk is solved. ⚠

---

## Positioning statement — revisited (Stage 2 pressure test)

Revisited `ua2-positioning-statement.md` against this analysis. It HELD — no clause needed revision:
- The Landscape finding (target players use no apps; real competition is paper + memory) confirms the competitive-alternative clause rather than contradicting it.
- The stakeholder work reinforced the need clause (parent-driven journaling) — the parent is both the pain source and the adoption lever.
- The jobs/scenarios deliver the key benefit (effortless capture + recall), with AI tips correctly positioned as a conditional bonus.

## Open from this stage

- Evidence base is two correlated interviews (brothers) — carry forward.
- "AI tips for less-experienced players" hunch still untested.
- Effortless-capture experience must be proven (the #1 risk).
