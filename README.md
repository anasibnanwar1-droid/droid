# DROID — task & review workspace

A clean desktop app for **delegating coding tasks to Factory Droid and reviewing
the results safely**. Not an IDE — a Codex / T3-Code-style task-and-review app
where the [Factory Droid CLI](https://docs.factory.ai/) does the work, Git is the
source of truth for diffs, and a local backend manages the process.

## How it works

```
Electron shell
  └─ React + Vite UI  ──WebSocket──▶  local Node backend
                                        ├─ SQLite (sessions / turns / events / checkpoints)
                                        ├─ Git manager (checkpoint · diff · stage · revert · commit)
                                        └─ Provider manager
                                             ├─ factory-droid →  droid exec --output-format debug "<task>"
                                             └─ simulated     →  fallback when the CLI isn't installed
```

**Flow:** pick a repo → create a task → backend takes a git checkpoint → runs the
agent in the repo → streams normalized events to the UI → reads the git diff →
you **Accept** (commit), **Revert** (restore checkpoint), or **revise** (ask Droid
a follow-up in the composer).

You log in once with `droid`; the app **never stores Factory API keys**. If the
`droid` CLI isn't on `PATH`, a built-in **simulated provider** streams realistic
events and makes real file edits so the whole task→review→accept flow is usable.

## Screens

- **Sidebar** — project switcher, prominent **New task**, sessions with live status.
- **Task thread** (center) — the user prompt + a live timeline of agent events
  (plan / explore / edit / command / summary), with a follow-up composer.
- **Review pane** (right) — changed files, per-file colored diff, **Accept / Revert**.
- **Raw log** (bottom) — collapsible stdout/stderr. The terminal is *secondary*.
- **Settings** — detected providers + add a project by path.

## Design

Refined warm-dark theme, a single muted burnt-amber accent, mono only for code/CLI.
Design tokens live in `src/index.css`.

## Develop

```bash
npm install
npm run dev:all   # backend (ws://localhost:8787) + vite dev server together
npm run dev       # vite only
npm run server    # backend only (Node >= 22.5 — uses built-in node:sqlite)
npm run lint
npm run build           # typecheck + production frontend build
npm run typecheck:server
```

Open the Vite URL; the UI connects to the backend over WebSocket and auto-seeds a
throwaway `sample-project` git repo so you can try a task immediately.

## Desktop (Electron, macOS)

```bash
npm run electron:dev   # backend + vite + electron together
npm run dist:mac       # build a .dmg  ← must run on macOS
```

Electron spawns the backend with system Node (so `node:sqlite` is available
regardless of Electron's bundled Node), loads the Vite dev server in dev and the
built assets in production, and uses hidden-inset traffic lights over a draggable
titlebar. `npm run dist:mac` must run **on macOS** — electron-builder cannot
produce a Mac `.dmg` on Linux/Windows.

## Layout on disk

```
server/            local backend
  index.ts         http + WebSocket server, message handling, run lifecycle
  db.ts            node:sqlite store (sessions / turns / events / checkpoints)
  git.ts           checkpoint · changed files · per-file diff · commit · revert
  providers/       agent provider abstraction
    factoryDroid.ts  droid exec adapter
    simulated.ts     realistic fallback that makes real edits
shared/protocol.ts WebSocket message + entity types (shared by UI and server)
src/               React UI (client store, screens, components)
electron/          desktop shell
```
