# Forge — Agentic Workspace

A focused, aesthetic UI for an **agentic development app** — a place where coding
agents run, not a full IDE. Think "Codex app for your codebase," with a calmer,
warmer visual language.

## Design direction

The interface blends three references:

- **A touch of Factory.ai** — a single restrained warm-amber accent and
  monospace precision for code/CLI, *without* the full near-monochrome brutalist
  scheme.
- **Cursor's calm warmth** — warm charcoal surfaces (never pure black), generous
  spacing, editorial typography, and pastel "timeline" accents for agent steps.
- **Codex's multi-agent model** — a sessions sidebar where each run lives with its
  own status/progress, plus a Codex-style task/steering panel.

### Principles

- Refined **dark** theme tuned for long agent runs (warm neutrals, low eye strain).
- **Minimal icons** — the layout leans on typography and space.
- One signature **accent**, used sparingly (active states, run status, primary CTA).
- Mono **only** for code and CLI output.

## Layout (the "first screen")

| Region | Purpose |
| --- | --- |
| **Left sidebar** | Workspace + agent **sessions** list with live status dots and progress |
| **Center** | The active **agent run** — a timeline of plan / search / edit / run steps, code + diffs, and a steering composer |
| **Right panel** | Codex-style **Tasks** (open vs done) and **Changes** (files + diff stats) |

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4 (design tokens in `src/index.css`)

## Develop

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run lint     # eslint
```

> The screen is driven by mock data in `src/data.ts` — this is a UI/UX
> design surface, not a wired-up backend.
