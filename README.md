# EasyDesign

A beginner-friendly **visual UI design tool**. You compose UIs on an infinite board from a finite,
themed palette of components, and export a selection to **React, Angular, static HTML, or MJML
(email)** — the flagship feature is clean code export to all four targets.

The repo contains a working **editor** (React Flow workspace, drag-and-drop palette, live preview,
live theming, undo/redo, persistence) and the **export engine** (an intermediate representation +
four hand-written generators), all on a strict, mutually-aligned TypeScript toolchain.

> New here? Read [`CLAUDE.md`](./CLAUDE.md) (architecture + commands), [`CONTEXT.md`](./CONTEXT.md)
> (domain glossary), and [`docs/adr/`](./docs/adr) (the decisions and _why_).

---

## Requirements

- **Node.js ≥ 20.19** (or **≥ 22.12**) — required by Vite 8 / `@vitejs/plugin-react` 6.
- **npm** (the repo uses npm; a `package-lock.json` is the source of truth).

Check your version:

```bash
node -v   # should be 20.19+ or 22.12+
```

---

## Quick start

```bash
npm install          # install dependencies
npm run tokens       # compile design tokens (REQUIRED before dev/build — see note)
npm run dev          # start the editor at http://localhost:5173
```

Open <http://localhost:5173> and you'll see the editor: a top toolbar (undo/redo, save status,
export/import/reset), a Component Palette (left), the Board with two Frames (center), and
Inspector/Theme/Export panels (right).

> **Why `npm run tokens` first?** The theme is authored once as W3C **DTCG** tokens and compiled by
> Style Dictionary into `src/theme/generated/{theme.css, tokens.literals.json}`. Those generated
> files are imported by the editor and the email generator, and are **not** committed — so you must
> run `npm run tokens` after a fresh install and whenever you edit `src/theme/tokens.json`.
> (Tip: you can wire this automatically by adding `"predev": "npm run tokens"` and
> `"prebuild": "npm run tokens"` to `package.json` scripts.)

---

## Scripts

Run from the repo root.

| Script                 | What it does                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Editor dev server (Vite) at <http://localhost:5173>. Run `npm run tokens` first.                                                                                                |
| `npm run tokens`       | Compile DTCG tokens → `src/theme/generated/{theme.css, tokens.literals.json}`.                                                                                                  |
| `npm run generate`     | Run all four generators on the sample design **and** server-render the React-Aria canvas → `generated-samples/`. Each step self-checks (see [Testing](#testing--verification)). |
| `npm run typecheck`    | `tsc -b --noEmit` across the project references (`tsconfig.app.json` + `tsconfig.node.json`).                                                                                   |
| `npm run lint`         | ESLint 9 flat config (`eslint.config.mjs`).                                                                                                                                     |
| `npm run lint:fix`     | ESLint with autofix (import ordering, etc.).                                                                                                                                    |
| `npm run format`       | Prettier — write. Prettier is the **only** formatter.                                                                                                                           |
| `npm run format:check` | Prettier — check (used in CI/verification).                                                                                                                                     |
| `npm run build`        | Library build: `tsc -b && vite build` (Vite library mode, Rolldown).                                                                                                            |
| `npm run preview`      | Preview a production build (`vite preview`).                                                                                                                                    |

---

## Build

There are two build outputs, by design:

- **The editor app** is served in development by `npm run dev` (entry: `index.html` → `src/main.tsx`).
- **The package** is built by `npm run build` — Vite **library mode** with entry `src/index.ts`,
  emitting the IR, the four generators, and the React-Aria component layer (with `.d.ts` types via
  `vite-plugin-dts`). The editor app and the dev tooling are excluded from the library bundle.

```bash
npm run tokens && npm run build   # -> dist/
```

---

## Testing & verification

**Unit tests run on `vitest`** — `npm run test` (with `test:watch` and `test:coverage`). The deep
modules (the Node Walk, the Design-Token Model, the Frame lifecycle) are pure and unit-tested at
their interfaces.

Alongside the unit tests, the **quality-gate suite** plus a **self-checking generate** step:

```bash
npm run test           # vitest unit tests
npm run tokens         # prerequisite for generate
npm run generate       # runs the 4 generators + SSR-renders the React-Aria canvas;
                       # asserts: MJML compiles cleanly, HTML has the expected elements,
                       # the canvas renders a real <button>, etc. Exits non-zero on failure.
npm run typecheck      # strict TypeScript (tsc -b)
npm run lint           # ESLint 9
npm run format:check   # Prettier
```

All should pass. Visual outputs land in `generated-samples/` — open
`generated-samples/{html.html,react/…,email.html,canvas.html}` in a browser to eyeball the exports.

---

## Project layout

```
.
├── index.html                 # editor dev entry
├── src/
│   ├── index.ts               # public library surface (IR + generators + components)
│   ├── ir/                    # the intermediate representation (types, sample design)
│   ├── theme/                 # DTCG tokens + Style Dictionary config → generated/
│   ├── generators/            # html / react / angular / mjml — pure IR→string emitters
│   ├── components/            # React-Aria component layer + CanvasNode/CanvasFrame
│   ├── editor/                # the editor app (store, React Flow board, palette, panels)
│   ├── dev/                   # generate-sample runner (not in the library build)
│   └── main.tsx               # editor bootstrap
├── docs/
│   ├── adr/                   # architecture decision records (0001–0018)
│   └── design-system/         # the EasyDesign design system (chrome kit + SKILL.md)
├── CLAUDE.md                  # architecture + commands (source of truth)
└── CONTEXT.md                 # domain glossary
```

---

## Tech stack & licensing

TypeScript 6 · React 19 · Vite 8 · React Flow · dnd-kit · zustand · React Aria Components · W3C DTCG

- Style Dictionary · MJML. Every dependency was vetted for **commercial-use-safe** licensing
  (MIT / Apache-2.0 / W3C royalty-free); see the stack table and license notes in
  [`CLAUDE.md`](./CLAUDE.md).

A few deliberate tooling invariants (don't "fix" them): **ESLint is pinned to 9.x** (10 crashes
`eslint-plugin-react`); the flat config is `eslint.config.mjs`; Prettier owns all formatting and
`.editorconfig` / `.vscode/settings.json` / `.prettierrc` are kept in agreement; `tsconfig.app.json`
keeps `experimentalDecorators` (the Angular generator emits decorators). Details in `CLAUDE.md`.
