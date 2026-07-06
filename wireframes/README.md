# Wireframes

Low-fidelity wireframes for this UA project. Built with [Astro](https://astro.build) and [wired-elements](https://wiredjs.com/) to keep the look hand-drawn on purpose.

The hand-drawn aesthetic exists so reviewers comment on whether the screen does what they need, not on colors. Don't polish these.

## Run locally

```
npm install
npm run dev
```

Astro will tell you which port. Open the URL it prints.

## Add a screen

Create `src/pages/<screen-name>.astro` and follow the pattern in `src/pages/index.astro`. Wire up navigation by linking to `/<other-screen>` from any action that is supposed to take the user there.

## Walking a scenario

Open the wireframe in the browser. Start on the screen the scenario starts on. Click through the way a real user would. If you hit a dead end or a screen that's missing what the next step needs, the wireframe (or the screen description in `ua6-specification.md`) is wrong.
