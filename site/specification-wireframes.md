---
layout: default
title: Specification & Wireframes
description: The 12-screen spec and clickable wireframes built from it.
---

## What this step was

This is where the analysis turned into something concrete enough to build from: a full inventory of every screen the app needs, a description of exactly what each screen shows and does, and then actual clickable wireframes built from that spec. The last step was walking each of the three scenarios from the analysis phase through the wireframes end to end, to check nothing dead-ends or breaks.

## Result

<div class="callout accent">
<h3>✅ All 12 screens are built and every scenario passes</h3>
<p>The wireframes are done, clickable, and cover the full app — not just the happy path, but empty states and error/offline states too.</p>
<a class="button accent" href="{{ '/wireframes.html' | relative_url }}">Click through the wireframes →</a>
</div>

<div class="results-box">
<h3>The 12 screens</h3>
<ol>
<li>Login / Account setup</li>
<li>Home / Dashboard — the launch point, one tap to log a match</li>
<li>Log Match (Quick Capture) — score, opponent, scouting, and self-reflection, all on one screen</li>
<li>Select / Add Opponent — fuzzy search so a typo'd name still finds the right person</li>
<li>Opponent Detail (Scouting) — the hub: head-to-head record, scouting profile, AI tip, and past matches</li>
<li>Match History — every match ever logged</li>
<li>Match Detail — view or edit one match</li>
<li>Practice / Insights — the automatic AI practice-nudge layer</li>
<li>Settings — account, nudges, and the privacy note</li>
<li>Empty states — first-run versions of Home, Opponents, and Practice</li>
<li>Error / offline state — nothing entered is ever lost if a save fails</li>
<li>Save confirmation — the "yes, it saved" moment</li>
</ol>
</div>

<div class="results-box">
<h3>Scenario walkthroughs — all three passed</h3>
<ul>
<li><strong>Logging a tough loss in the car</strong> — even too frustrated to type, dictation gets the match captured in about 20 seconds. ✔</li>
<li><strong>Drawing a familiar name in the bracket</strong> — fuzzy search finds the right opponent even from a thin, months-old note, and forms a plan before the rematch. ✔</li>
<li><strong>An automatic practice nudge</strong> — a recurring weakness surfaces on its own, with a way to correct it if the AI gets it wrong. ✔</li>
</ul>
</div>

One design decision worth calling out: on the Log Match screen, the opponent-scouting and self-reflection boxes are shown **by default, not hidden behind an optional link** — because optional fields get skipped, and skipped fields mean no improvement loop. Speed is preserved through voice dictation instead of by making things optional.
