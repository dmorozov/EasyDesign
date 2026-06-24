# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read the SKILL.md at design-system/SKILL.md before building any UI.

## Project status: editor MVP working (create → theme → export loop)

EasyDesign is a beginner-friendly visual UI design tool: an infinite **Board** where non-designers
compose UIs from a finite, themed **Component Palette**, then export a **Selection** to React,
Angular, static HTML, or MJML email. The flagship feature is **export**, and the whole approach is
gated on clean output to all four targets.

The architecture is settled (foundational ADRs 0001–0007, extended by implementation ADRs 0008–0018)
and the package lives at the repo root: the IR, the four
export generators, a React-Aria component layer, and a **working editor MVP** (`src/editor/`, run
`npm run dev`) — React Flow workspace of Frames rendering live IR, a dnd-kit Component Palette
(drag or click to insert), per-node drag handles to **reorder/move** with **before/after/inside drop
indicators** and **insertion-point (gap) drop targets** (ADR-0018), selection + inspector + a Frame
**Structure** tree, live multi-target export, live theming, the email-mode
restriction (Grid is hidden in email Frames), **undo/redo** (coalesced history, Ctrl/⌘+Z), and
**persistence** (auto-save to localStorage + JSON export/import/reset via `src/editor/document.ts`).

**Read these first — they are the source of truth, not this file:**

- `CONTEXT.md` — domain glossary (Board, Frame, Component, Layout element, Theme, Design Token,
  Design Palette vs Component Palette, Selection, Export Target). Use these exact terms.
- `docs/adr/` — the decisions and _why_, including the rejected alternatives. **Foundational (0001–0007)**:
  - `0001` React editor, deliberately decoupled from export targets
  - `0002` Own IR; Mitosis rejected as the export engine; scope fixed to the four named targets
  - `0003` Structured layout tree (auto-layout), **not** free-form absolute positioning
  - `0004` Theming spine: DTCG tokens → Style Dictionary, dual-output (CSS vars for web / resolved literals for email)
  - `0005` React Aria Components for primitives (not Radix/shadcn)
  - `0006` Email is an explicit restricted mode (target-aware Frames)
  - `0007` React Aria is the editor runtime, not the export substrate
- **Implementation seams (0008–0018)** — the editor/IR structure to know before refactoring:
  - `0008` Node Walk: one shared traversal (`walkNode`/`Emitter`) for all web/React renderers; MJML bespoke
  - `0009` Responsive layout deferred · `0010` Row is content-flow by default
  - `0011` Frame lifecycle module + Board seam · `0012` History reducer + `mutate()` funnel + persistence hook
  - `0013` Frame preview width is a canvas affordance · `0014` Component descriptor = single source of node-type facts
  - `0015` Typography composite tokens → codegen binding
  - `0016` Component containers + allowed-children (compound components: RadioGroup→Radio)
  - `0017` AppShell application-layout component (computed grid-areas + Region slots)
  - `0018` Insertion-point (gap) drop targets + closest-fallback collision strategy

## Core architecture (one-screen summary)

- **Export = own IR + per-target generators.** A design serializes to a small JSON IR (a tree of
  typed nodes: layout, token bindings, props, children). Four hand-written generators walk the IR:
  `IR→HTML`, `IR→React`, `IR→Angular`, `IR→MJML`. No single compiler emits all four (Mitosis can't
  do MJML, its static HTML renders blank, its Angular is buggy — see ADR-0002).
- **Layout is a structured tree** (Stack / Row / Column / Grid), never absolute `{x,y}` (ADR-0003).
  This is what makes clean, responsive output possible and is the _only_ thing MJML can represent.
  The infinite-canvas feel lives at the workspace level; inside a Frame it's snap-into-flow.
- **Theming: one DTCG token graph compiled two ways** by Style Dictionary — CSS variables for web +
  live canvas, fully-resolved literals for email. Editing one token re-themes everything (ADR-0004).
  Do not route email through CSS variables; email clients can't read them.
- **Frames are target-aware** (ADR-0006): a _web_ Frame → React/Angular/HTML interchangeably; an
  _email_ Frame is restricted to email-safe Components so MJML export can't break.

## Stack (all commercial-use-safe — verified)

| Layer                   | Choice                                                                 | License              |
| ----------------------- | ---------------------------------------------------------------------- | -------------------- |
| Infinite workspace      | React Flow (`@xyflow/react`) — hosts Frames                            | MIT                  |
| Intra-Frame drag/drop   | dnd-kit — tree insertion (NOT react-rnd/moveable; those are free-form) | MIT                  |
| Headless primitives     | React Aria Components                                                  | Apache-2.0           |
| Theme format / compiler | W3C DTCG (2025.10, pinned) / Style Dictionary                          | W3C FSA / Apache-2.0 |
| Export generators       | own code; `mjml` engine for email                                      | your code / MIT      |

**License landmines (avoid):** tldraw (paid/watermark for commercial); Webstudio & Plasmic _builder_
code (AGPL-3.0 — never fork into this SaaS).

## Build / test / run

The real package is at the **repo root** (`easydesign`).

Source layout (`src/`): `ir/` (types + sample), `theme/` (DTCG tokens + Style Dictionary →
`generated/`), `generators/` (`html`/`react`/`angular`/`mjml`, pure string emitters), `components/`
(React Aria layer + `CanvasNode`/`CanvasFrame`), `editor/` (the editor app — store, React Flow board,
palette, panels), `dev/` (the demo runner). `editor/`, `main.tsx`, and `dev/` are excluded from the
library build (`tsconfig.build.json`); the lib entry is `src/index.ts`.

Commands (from the repo root):

- `npm run dev` — **the editor** at <http://localhost:5173> (Vite dev server). Run `npm run tokens` first.
- `npm run tokens` — compile DTCG tokens → `src/theme/generated/{theme.css, tokens.literals.json}`
  (the editor and the MJML generator import the generated literals, so this must run before dev/build)
- `npm run generate` — run all four generators on the sample **and** SSR-render the React Aria canvas
  → `generated-samples/` (each step self-checks)
- `npm run typecheck` — `tsc -b --noEmit` (project refs: `tsconfig.app.json` + `tsconfig.node.json`)
- `npm run lint` / `lint:fix` — ESLint 9 flat config (`eslint.config.mjs`)
- `npm run format` / `format:check` — Prettier (the only formatter)
- `npm run build` — `tsc -b && vite build` (library mode, Rolldown)

Editor invariants: frame positions live in React Flow (export ignores them); IR lives in the zustand
store keyed by frame id. `jsx-a11y` interaction rules are relaxed for `src/editor/**` only (the
recursive node-selection chrome); product components in `src/components/**` stay strictly checked.

Tooling invariants (deliberate — don't "fix" them):

- **ESLint is pinned to 9.x**, not 10 — `eslint-plugin-react` crashes on ESLint 10 and `jsx-a11y`
  peer-caps at `^9`. The flat config is `.mjs` (not `.ts`) to avoid the untyped-plugin type-check
  cascade and the `jiti` dependency.
- **Prettier owns all formatting**; ESLint carries zero stylistic rules (`eslint-config-prettier/flat`
  is last). `.editorconfig`, `.vscode/settings.json`, and `.prettierrc` all agree (100 cols, 2-space,
  LF, single quotes) and Prettier reads `.editorconfig` as a fallback — so they can't drift.
- **`tsconfig.app.json` keeps `experimentalDecorators` and omits `verbatimModuleSyntax` /
  `erasableSyntaxOnly`** — the Angular generator emits decorators, which those flags reject.
