# UA6 — Specification

The Stage 3 deliverable. Pulls everything from Stages 1 and 2 into a single document that a developer — human or AI — can build from.

The screens are the spine. In a small project the screens are the functional requirements: each screen names what the system does in terms a user would recognize.

---

## Overview

### Positioning statement

> For junior competitive tennis players who compete in USTA tournaments (roughly ages 12–18, possibly college players) and face the same opponents repeatedly over a season, who are pushed to keep a tennis journal but hate doing it by hand, and want to remember opponents and what worked — even a year later — without the effort, MatchMind is a tennis match journal and opponent-scouting app that captures your matches in seconds and hands it all back the moment you need it — so you keep a journal worth having without the chore. Unlike relying on memory, asking teammates or coaches, or manual logging apps where you write your own notes (like Opponote), MatchMind makes logging so fast and automatic that you actually keep it up, then instantly gives back your full head-to-head history and what worked against this opponent — with AI tips on how to beat them and what to practice as a bonus on top.

### Summary

MatchMind is a private, personal phone app for junior competitive tennis players. It makes logging a match take seconds (not a journal entry), then remembers everything for you: search any opponent to instantly see your head-to-head record, their playstyle, and what worked last time. As a bonus, it automatically points out recurring weaknesses in your own game and suggests what to practice. Data is private to each player; a parent is involved for under-13 accounts.

---

## Screen inventory

*(Drafted by walking the three Stage 2 scenarios; Joshua to review and add/cut.)*

| # | Screen | Purpose (one sentence) | Scenarios that pass through it |
|---|--------|------------------------|--------------------------------|
| 1 | Login / Account setup | Get the player (and, for under-13, a parent) signed in. | setup (no scenario) |
| 2 | Home / Dashboard | The landing screen: one-tap "log a match," recent matches, and any practice nudge. | 1.1, 2.1, 3.1 (entry) |
| 3 | Log Match (Quick Capture) | Record a match in seconds — score, opponent, a couple of tags, optional voice note. | 1.1 |
| 4 | Select / Add Opponent | Pick an existing opponent or add a new one (with fuzzy name search). | 1.1, 2.1 |
| 5 | Opponent Detail (Scouting) | Show everything about one opponent: H2H record, playstyle tags, past notes, "how to beat" tips. | 2.1 |
| 6 | Match History | Browse all logged matches. | 2.1 (support) |
| 7 | Match Detail | View / edit a single match; add more notes later when calmer. | 1.1 |
| 8 | Practice / Insights | Auto-surfaced recurring weaknesses + suggested drills; let the player correct a suggestion. | 3.1 |
| 9 | Settings | Account, notifications/nudges, privacy. | setup |
| 10 | Empty states | First-run versions of Home / Opponents / Practice when there's no data yet. | all (first run) |
| 11 | Error / offline state | Shown when a save fails or the app is offline. | 1.1 |
| 12 | Save confirmation | Quick "match saved" confirmation after logging. | 1.1 |

---

## Screen descriptions

### Screen 2 — Home / Dashboard

- **Purpose:** Give the player a single launch point that makes logging a match the obvious next action.
- **Who lands here:** The player, every time they open the app (default screen after login).
- **What's shown:** A big "Log a match" button up top; a short list of recent matches (opponent, score, date); one practice nudge if the AI has spotted something ("Your backhand got attacked in 3 of your last 5 — see drill").
- **What they can do:**
  - Tap "Log a match"
  - Tap a recent match
  - Tap the practice nudge
  - Open opponents / search
  - Open settings
- **Where each action goes:**
  - Log a match → Screen 3 (Quick Capture)
  - Recent match → Screen 7 (Match Detail)
  - Practice nudge → Screen 8 (Practice / Insights)
  - Opponents / search → Screen 4 (Select / Add Opponent)
  - Settings → Screen 9 (Settings)

### Screen 3 — Log Match (Quick Capture)

- **Purpose:** Capture a match AND a quick reflection in one place, fast, so both the opponent scouting and the player's own growth actually get recorded every time.
- **Who lands here:** The player, right after a match, from the Home "Log a match" button.
- **What's shown (all on this screen — scouting is NOT hidden behind an optional link):**
  - Opponent field (search/add) + playstyle picker (from a list: pusher/moonballer, aggressive baseliner, serve-and-volley, all-court, counterpuncher)
  - Score + win/loss
  - **Opponent scouting boxes** (each one line, type or dictate): Forehand, Serve, Backhand, Other
  - **Your own performance** (self-reflection, type or dictate): "What I did well" (e.g., FH) and "What to improve" (e.g., BH, serve)
- **What they can do:**
  - Pick / add opponent; pick playstyle
  - Enter score + result
  - Fill the scouting boxes (type or dictate)
  - Fill the self-reflection boxes (type or dictate)
  - Save
- **Where each action goes:**
  - Pick / add opponent → Screen 4 (Select / Add Opponent), returns here
  - Save → Screen 12 (Save confirmation); scouting saved to the opponent's profile (Screen 5), self-reflection feeds Practice/Insights (Screen 8); if the save fails → Screen 11 (Error / offline)

> **Design decision (Joshua):** the scouting + reflection boxes are present on this screen by default, not optional — optional = skipped = no improvement. **Kept fast via type-or-dictate** so a tired player can just talk. **Tension to test (see Open questions):** does making these non-optional lower how often players log at all? Dictation is the mitigation.

### Screen 5 — Opponent Detail (Scouting)

- **Purpose:** Instantly hand the player everything they know about one opponent before a rematch, and hold the structured scouting profile.
- **Who lands here:** The player, from searching/selecting an opponent (Screen 4), tapping an opponent name on a match, or the "Add scouting details" link on Quick Capture.
- **What's shown:**
  - Opponent name and playstyle
  - Head-to-head record (W–L) and match list
  - **Structured scouting boxes, each one short line, each with type-or-dictate:**
    - Forehand (e.g., "strong but not consistent")
    - Serve (e.g., "big serve, fast with lots of kick")
    - Backhand (e.g., "weak, just makes it back")
    - Other notes (free box — type or dictate)
  - A "how to beat them" AI tip (the bonus), generated from the profile
  - **Previous matches against this opponent:** a list with dates + scores (W/L), each one tappable to open that match's details
  - If little was logged, it honestly shows the little there is (empty boxes invite a quick line)
- **What they can do:**
  - Read the H2H, scouting profile, and tip
  - Edit any scouting box (type or dictate)
  - Tap a past match to see its details
  - Log a new match against this opponent
- **Where each action goes:**
  - Edit a box → stays here (state change), saved to this opponent's profile
  - Tap a past match → Screen 7 (Match Detail)
  - Log new match → Screen 3 (Quick Capture, opponent pre-filled)

> **Design decision (Joshua):** the Opponent Detail page is the hub. It holds the scouting profile AND the list of past matches vs. this player; Match Detail (Screen 7) is reached by tapping a match in that list. This keeps everything about one rival in one place.

### Screen 1 — Login / Account setup

- **Purpose:** Get the player signed in; for under-13, involve a parent.
- **Who lands here:** A new or returning player on first open or after logout.
- **What's shown:** Sign in / create account; for under-13, a field for a parent email/consent step; minimal branding.
- **What they can do:** Sign in; create account; (under-13) enter parent email.
- **Where each action goes:** Successful sign-in / account creation → Screen 2 (Home); failure → inline error on this screen.

### Screen 4 — Select / Add Opponent

- **Purpose:** Let the player quickly find an existing opponent or add a new one.
- **Who lands here:** From Quick Capture (picking opponent) or from Home (opponents/search).
- **What's shown:** A search box (fuzzy match, so slight spelling/nickname differences still find the person), a list of existing opponents, and an "Add new opponent" option.
- **What they can do:** Search; pick an existing opponent; add a new opponent (name + playstyle).
- **Where each action goes:** Pick existing → returns to caller (Quick Capture) or Screen 5 (Opponent Detail); add new → creates opponent, returns to caller; no match found → offer "Add new."

### Screen 6 — Match History

- **Purpose:** Let the player browse everything they've logged.
- **Who lands here:** From Home (see all) or navigation.
- **What's shown:** A reverse-chronological list of matches (opponent, score, W/L, date); optional filter by opponent.
- **What they can do:** Scroll; tap a match; filter.
- **Where each action goes:** Tap match → Screen 7 (Match Detail).

### Screen 7 — Match Detail

- **Purpose:** View or edit one match, and add more notes later when calmer.
- **Who lands here:** By tapping a match in the opponent's match list (Screen 5, the main path), or from a recent match on Home / from Match History.
- **What's shown:** The match's score, opponent (link), playstyle at the time, any match notes (type or dictate).
- **What they can do:** Read; edit score/notes; jump to the opponent; delete match (with confirmation).
- **Where each action goes:** Edit → state change here; opponent link → Screen 5; delete → confirmation, then back to Match History.

### Screen 8 — Practice / Insights

- **Purpose:** Automatically surface a recurring weakness in the player's game and suggest what to drill (the bonus AI layer).
- **Who lands here:** From the Home practice nudge, or from navigation.
- **What's shown:** One or two auto-detected patterns from recent matches ("Your backhand got attacked in 3 of your last 5"), each with a concrete suggested drill; honest empty state if there isn't enough data yet.
- **What they can do:** Read a suggestion; open the drill; **mark a suggestion "not quite" and pick the real issue** (the correction flow); dismiss.
- **Where each action goes:** Open drill → drill detail/how-to; "not quite" → correction picker (state change; trains future tips); dismiss → removes it.

### Screen 9 — Settings

- **Purpose:** Manage account, nudges, and privacy.
- **Who lands here:** From Home/nav.
- **What's shown:** Account info; notification/nudge toggles; privacy note (data is private/personal); parent info for under-13; sign out.
- **What they can do:** Toggle nudges; edit account; sign out.
- **Where each action goes:** Toggles → state change; sign out → Screen 1 (Login).

### Screen 10 — Empty states

- **Purpose:** Make first-run screens feel welcoming and point to the first action, not a blank void.
- **Who lands here:** Any player before they have data (fresh Home, no opponents, no practice insights yet).
- **What's shown:** A friendly line + the single obvious next step (e.g., "Log your first match" on Home; "No opponents yet — they'll appear as you log matches").
- **What they can do:** Take the one suggested action.
- **Where each action goes:** → the relevant screen (e.g., Quick Capture).

### Screen 11 — Error / offline state

- **Purpose:** Tell the player something failed and how to recover, without losing what they entered.
- **Who lands here:** After a save fails or when offline.
- **What's shown:** A plain message ("Couldn't save — you're offline"), the entered data preserved, and a retry.
- **What they can do:** Retry; keep editing.
- **Where each action goes:** Retry → attempts save again → confirmation on success, stays on error if still failing.

### Screen 12 — Save confirmation

- **Purpose:** Reassure the player the match was captured (closing the "did it save?" loop).
- **Who lands here:** Right after a successful save from Quick Capture.
- **What's shown:** A brief "Match saved" confirmation (could be a toast/checkmark, not a full page).
- **What they can do:** Continue (auto-dismiss) or tap to view the saved match.
- **Where each action goes:** Auto → Screen 2 (Home); tap → Screen 7 (Match Detail).

---

## Requirements

- **Every text box supports type OR dictate (voice-to-text).** Global input rule, per Joshua — critical for effortless capture, especially right after a match.
- Quick save requires only score + opponent, so logging is never blocked.
- Playstyle is chosen from a fixed list (not free text) so it can drive tips and stats.

## Constraints and assumptions

- Private, personal app — no public/shared player database (from Stage 2).
- Under-13 users → a parent is involved in the account (COPPA).
- Mobile-first (phone).

## Open questions

- Voice-note capture: how much does the AI structure it vs. store raw? (affects effort + trust)
- How "automatic" is capture really — can we cut typing to near-zero? (the #1 risk)
- Does making scouting + self-reflection boxes non-optional lower the logging rate (vs. the effortless-so-they-do-it finding from interviews)? Test with real players. Dictation is the intended mitigation.
- Self-reflection ("what I did well / to improve") is designed to feed the Practice/Insights tips — confirm that pipeline works.

---

## Scenario walkthroughs (Stage 3 Activity 4)

Each Stage 2 scenario walked through the wireframes end to end.

- **Scenario 1.1 — Logging a tough loss in the car.** Path: Home → "+ Log a match" (Screen 3) → enter score + playstyle, dictate the boxes → Save → Save confirmation (Screen 12) → Home. Failure branch (too angry to type): every box is type-or-dictate, so he can just talk. **PASSES — delivers the key benefit (effortless capture).** ✔
- **Scenario 2.1 — Drawing a familiar name in the bracket.** Path: Home → Opponents (Screen 4, fuzzy search) → Opponent Detail (Screen 5): H2H, scouting profile, AI tip, and the list of past matches (tap one → Match Detail, Screen 7). Failure branch (thin data / slightly wrong name): fuzzy search surfaces the right player; even a thin note + the tip forms a plan. **PASSES — delivers recall.** ✔
- **Scenario 3.1 — An automatic practice nudge.** Path: Home nudge → Practice / Insights (Screen 8) → read suggestion + drill; failure branch (wrong tip) → "Not quite" correction picker trains future tips. **PASSES — delivers the bonus, with a recovery path for a bad tip.** ✔

All three scenarios reach "my need is met" = the positioning statement's key benefit. Wireframe side of Stage 3 complete.
