# MatchMind — Transfer Package

This is the single build-ready reference for MatchMind. It consolidates everything from the UA Framework design process (`ua0`–`ua6` in this repo) into one document so a fresh build effort doesn't need to read the process docs — just this file, plus the wireframes for visual reference.

**Wireframes for visual reference:** `wireframes/` (Astro project — `npm install && npm run dev`) and the standalone `matchmind-wireframes.html`. These are intentionally hand-drawn/low-fidelity — don't carry the visual style forward, just the layout, fields, and flow.

**Suggested stack:** React Native (Expo). Rationale: mobile-first phone app is a hard constraint below; Expo gives fast iteration and has libraries for on-device speech-to-text, which is a core requirement (see Global requirements).

---

## 1. What MatchMind is

**Positioning statement:** For junior competitive tennis players who compete in USTA tournaments (roughly ages 12–18, possibly college players) and face the same opponents repeatedly over a season, who are pushed to keep a tennis journal but hate doing it by hand, and want to remember opponents and what worked — even a year later — without the effort, MatchMind is a tennis match journal and opponent-scouting app that captures your matches in seconds and hands it all back the moment you need it — so you keep a journal worth having without the chore. Unlike relying on memory, asking teammates or coaches, or manual logging apps where you write your own notes (like Opponote), MatchMind makes logging so fast and automatic that you actually keep it up, then instantly gives back your full head-to-head history and what worked against this opponent — with AI tips on how to beat them and what to practice as a bonus on top.

**One-line summary:** A private, personal phone app that makes logging a match take seconds, then remembers everything: search any opponent to see head-to-head record, playstyle, and what worked last time — plus AI practice tips generated from your own recent matches.

**The #1 risk to keep in mind while building:** the whole product bets on capture being *genuinely* faster/easier than a paper journal or a competitor app like Opponote — not just the same note-taking with fewer taps. Every implementation decision on the Log Match screen should be judged against "is this still effortless?"

**Priority order if features must be cut:** (1) effortless match capture, (2) opponent recall/scouting, (3) AI practice tips — in that order. Tips are explicitly a bonus layer, not the core value.

---

## 2. Core jobs the app does

1. **Capture a match without the effort** — right after playing, drained or upset, log score + a couple tags + optional voice note in ~20 seconds. Paper journals fail here because they demand sitting down and writing while the player just wants to be done.
2. **Recall an opponent before a rematch** — search a name (fuzzy — spelling/nicknames), instantly see head-to-head record, playstyle, scouting notes, and an AI "how to beat them" tip. This depends entirely on Job 1 actually happening.
3. **Know what to practice (bonus)** — the AI looks across recent matches' self-reflection notes, detects a recurring weakness (e.g., backhand attacked repeatedly), and surfaces it unprompted with a suggested drill. Player can correct a wrong tip ("not quite" → pick real issue), which both fixes this suggestion and should influence future ones.

---

## 3. Global requirements (apply across every screen)

- **Every text input supports type OR voice dictation.** Non-negotiable — this is what makes the scouting/reflection boxes fast enough to survive contact with a tired, frustrated player. On React Native/Expo this means on-device speech-to-text on every free-text field, not just one "voice note" feature.
- **Quick save requires only score + opponent.** Everything else (scouting boxes, self-reflection, playstyle) should be fillable but never block a save. Logging must never be blocked by an incomplete field.
- **Playstyle is a fixed list, not free text**, so it can drive tips/stats consistently: Pusher/moonballer, Aggressive baseliner, Serve-and-volley, All-court, Counterpuncher.
- **Opponent search is fuzzy** (typos/nicknames still find the right person), with a graceful "no match → add new" fallback.
- **Data is private/personal per player.** No public or shared opponent database, no cross-player visibility. This is a stated design decision, not a nice-to-have — opponent notes are effectively a personal notebook.
- **Under-13 accounts involve a parent** (COPPA) — captured at signup as a parent email field.
- **Offline-tolerant:** a failed save must preserve entered data and offer retry, never silently lose what was typed/dictated.

---

## 4. Data model

Derived from the screens below — not previously formalized, review before building.

**Player (account)**
- id, email, password/auth
- dateOfBirth or ageBand (drives whether parent flow is required)
- parentEmail (nullable — required if under 13)
- settings: practiceNudgesEnabled (bool), logReminderEnabled (bool)

**Opponent** (belongs to a Player — private, never shared across accounts)
- id, ownerPlayerId
- name
- playstyle (enum, see fixed list above) — current/latest playstyle
- scouting: forehand (text), serve (text), backhand (text), other (text) — each type-or-dictate, edited in place (not versioned)
- aiTip (generated text, "how to beat them" — regenerate when scouting or match history changes)
- createdAt, updatedAt

**Match** (belongs to a Player, references one Opponent)
- id, ownerPlayerId, opponentId
- date
- score (set scores, e.g. `["4-6","3-6"]`), result (win/loss)
- playstyleSnapshot (the opponent's playstyle *at the time of this match* — copy the value at save time; Match Detail shows this, and it can differ from the opponent's current playstyle if it's since been edited)
- selfReflection: whatWentWell (text), whatToImprove (text) — feeds Practice/Insights
- matchNotes (text, editable later, separate from the self-reflection captured at log time)

**PracticeInsight** (belongs to a Player, generated — not user-created)
- id, ownerPlayerId
- patternDescription (e.g. "backhand attacked in 3 of your last 5 matches")
- suggestedDrill (text)
- sourceMatchIds (which matches the pattern was drawn from)
- status: active | dismissed | corrected
- correctedIssue (nullable enum: stroke | footwork/movement | shot-selection) — set when player taps "not quite"

Note: scouting boxes on the **Log Match** screen write into the *Opponent's* scouting fields (not a per-match snapshot) — logging a match is one of the ways an opponent's scouting profile gets updated, alongside editing directly on Opponent Detail.

---

## 5. Screens

Twelve screens total. Each entry: purpose, what's on it, what happens next.

### 1 — Login / Account setup
Email + password sign in or create account. If under 13, an additional parent-email field. Success → Home. Failure → inline error, stay on screen.

### 2 — Home / Dashboard
The landing screen and single obvious next action.
- Large "+ Log a match" button (primary CTA, full-width, prominent)
- Practice nudge card (only if an active PracticeInsight exists) → tapping goes to Practice/Insights
- Recent matches list (opponent, result, score, date) → tapping a match goes to Match Detail
- Secondary nav: Opponents/search → Select/Add Opponent; All matches → Match History; Settings → Settings

### 3 — Log Match (Quick Capture)
The core screen — must feel like 20 seconds, not a form.
- Opponent field (tap → Select/Add Opponent, returns here with opponent set)
- Score: set-by-set inputs + Win/Loss radio
- Playstyle: fixed-list picker
- **Scout your opponent** (shown by default, not hidden behind an optional link): Forehand, Serve, Backhand, Other — each type-or-dictate
- **Your game this match** (self-reflection, also shown by default): "What I did well," "What to improve" — type-or-dictate; feeds Practice/Insights
- Save → only score + opponent are required. On success → Save confirmation; scouting boxes write to the Opponent record; self-reflection is stored on the Match for the insights pipeline. On failure → Error/offline screen, nothing entered is lost.

Design intent to preserve: scouting + reflection are mandatory-by-default (not an optional expandable section) because optional = skipped = no improvement loop. Speed is preserved entirely through dictation, not through making fields optional.

### 4 — Select / Add Opponent
- Fuzzy search box
- List of existing opponents (name, W/L record, playstyle) → tap to select (returns to caller, or opens Opponent Detail if entered from Home/nav rather than from Log Match)
- "+ Add new opponent" → create with name + playstyle, then return to caller
- No match found → surface the "Add new" action directly

### 5 — Opponent Detail (Scouting) — the hub screen
This is where a player lands before a rematch and where an opponent's full profile lives.
- Header: name, current playstyle, head-to-head record (W–L)
- Scouting profile: Forehand / Serve / Backhand / Other — each editable in place, type-or-dictate; edits save immediately to the Opponent record
- AI "how to beat them" tip (bonus) — generated from the scouting profile + match history against this opponent
- Past matches vs. this opponent — reverse-chronological list (date, result, score), each tappable → Match Detail
- "Log a match vs. [name]" button → Log Match, opponent pre-filled

### 6 — Match History
- Filter-by-opponent input
- Full reverse-chronological match list → tap → Match Detail

### 7 — Match Detail
- Opponent (link → Opponent Detail), result + score, playstyle *at the time of the match* (snapshot, may differ from the opponent's current playstyle)
- Match notes — type-or-dictate, editable any time (this is the "add more when calmer" path)
- Actions: View opponent → Opponent Detail; Delete match (with confirmation) → back to Match History

### 8 — Practice / Insights (bonus AI layer)
Surfaces automatically — the player never has to search for it.
- One or two auto-detected patterns drawn from recent matches' self-reflection data (e.g., "Your backhand got attacked in 3 of your last 5 matches") with a concrete suggested drill
- Actions per insight: Open drill (drill detail/how-to); "Not quite →" opens a correction picker (radio: stroke / footwork-movement / shot-selection) — this both corrects the current suggestion and should train future pattern detection; Dismiss removes it
- Honest empty state if there isn't enough match data yet to detect a pattern

### 9 — Settings
- Account info (email); parent info shown if account is under-13
- Toggles: practice nudges, reminder to log after a match
- Static privacy note: data is private/personal, nothing shared or public
- Sign out → Login

### 10 — Empty states
First-run versions of Home, Opponents, and Practice/Insights before any data exists. Each shows a friendly line plus exactly one obvious next action (e.g., Home: "Log your first match"; Opponents: "No opponents yet — they'll appear as you log matches"). Not a separate route — a conditional render of screens 2/4/8 when the underlying data is empty.

### 11 — Error / offline state
Shown when a save fails or the device is offline. Plain message (e.g., "Couldn't save — you're offline"), all entered data preserved exactly as typed/dictated, and a Retry action. Retry re-attempts the save; success routes to the normal confirmation, continued failure stays on this screen.

### 12 — Save confirmation
Brief "Match saved" acknowledgment after a successful Log Match save (toast/checkmark, not necessarily a full page). Auto-dismiss → Home; tap → Match Detail for the match just saved.

---

## 6. Navigation map

```
Login ──(success)──> Home
Home ──> Log Match ──(opponent field)──> Select/Add Opponent ──(back)──> Log Match
Home ──> Log Match ──(save)──> Save Confirmation ──(auto)──> Home
                              └──(tap)──> Match Detail
Home ──> Log Match ──(save fails)──> Error/Offline ──(retry ok)──> Save Confirmation
Home ──> Recent match ──> Match Detail ──> Opponent Detail
Home ──> Opponents/search ──> Select/Add Opponent ──> Opponent Detail ──> Match Detail
Opponent Detail ──> "Log a match vs. X" ──> Log Match (opponent pre-filled)
Home ──> All matches ──> Match History ──> Match Detail
Home ──> Practice nudge ──> Practice/Insights
Practice/Insights ──> "Not quite" ──> correction picker (stays on screen)
Home ──> Settings ──> Sign out ──> Login
```

---

## 7. Constraints and known open questions

**Constraints:**
- Mobile-first (phone), private/personal data model, under-13 parent involvement (COPPA).

**Open questions to resolve during build (carried over from design, not yet answered):**
- Voice-note capture: how much should the AI structure dictated text vs. store it close to raw? Affects both perceived effort and trust in what gets saved.
- Whether making scouting + self-reflection non-optional actually lowers real-world logging rates versus a fully optional design — the mitigation is dictation, but this is untested with real users.
- The self-reflection → Practice/Insights pipeline (pattern detection across matches) needs a concrete implementation approach — likely an LLM call over recent `whatWentWell`/`whatToImprove` text plus tags, but the exact detection logic isn't yet specified.
- AI tip quality/trust is the explicit failure mode for the Practice/Insights job — a generic or wrong tip risks the player disengaging from that feature entirely (mitigated by the "not quite" correction flow, but that flow's actual training effect isn't specified either).

These aren't blockers — they're implementation decisions to make deliberately rather than defaults to fall into.
