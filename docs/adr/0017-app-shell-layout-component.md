# AppShell: an application-layout component (computed grid-areas + region slots)

EasyDesign gained an **application-shell layout** — a `AppShell` with optional header / footer / left /
right panels around a required **main** region (the "holy grail" layout). It is the second compound
Component (after `RadioGroup`, ADR-0016) and reuses that seam, but generalises it: a component
container need not render as a _specific React-Aria Component_ — it can render as a **computed CSS
grid**. Regions are its slot children, each naming the grid area it occupies.

## The problem

A real app shell needs a **fixed-width sidebar** and a **header/footer band with the main region
filling the rest**. Neither is expressible from the existing primitives:

1. **No sizing.** Container style keys are `background/padding/borderRadius/gap` only (ADR-0014's
   `CONTAINER_STYLE_KEYS`) — there is no `width`/`height`, by ADR-0003's structured-auto-layout stance.
   So a `Stack`/`Row` composition can't make a 240px sidebar.
2. **No single-grow.** `Row` `distribute:'fill'` flexes _all_ children equally (ADR-0010) — there is no
   "main grows, sidebars stay fixed".

A dedicated node solves both by **baking the sizing into a computed `grid-template`** rather than
exposing free per-element sizing (which ADR-0003 deliberately avoids).

**React Spectrum was rejected** as the implementation. Its `Flex`/`Grid`/`View` (and Spectrum-2
`@react-spectrum/s2`, a build-time `style` macro) are _styled, Provider-bound React-runtime_
components: they cannot serialise to our IR nor emit to React/Angular/HTML/MJML, and they contradict
ADR-0005 (headless React Aria, not styled libraries), ADR-0007 (React Aria is the editor runtime, not
the export substrate), and ADR-0004 (our own DTCG theme). We reuse only the _concept_ —
`grid-template-areas` — in our own node, with no new dependency.

## Decision 1 — AppShell is a component container that renders a COMPUTED grid

Setting `grid-template-areas` is not enough: each child must be _placed_ into a named area
(`grid-area: header`). That placement is bespoke logic, not the shared shape-driven `container()`
renderer — so `AppShell` joins `ComponentContainerType` (ADR-0016) and dispatches through
`emit.component`. This **generalises** "component container" from _"renders as a specific RAC
Component"_ (RadioGroup) to _"renders bespoke per target"_: `AppShell` emits a styled `<div>` whose
`grid-template-areas/-rows/-columns` are **computed from its present regions**, wrapping each
already-walked child in a `grid-area` cell. Adding it lit up the same five adapters RP-10 predicted
(html / react / angular / canvas / editor); MJML is bespoke (ADR-0008) and only needs an
exhaustiveness arm. The anticipated data-grid is still the _next_ compound — it plugs into the same
seam.

## Decision 2 — Region is the slot child; placement is BY NAME

`Region` (`{ area }` + flow-column content) is `AppShell`'s slot child
(`allowedChildren: ['Region']`, mirroring `RadioGroup → Radio`). Each region **self-describes its grid
area**, so the template is derived from the _set_ of present areas, not document order. Toggling,
reordering, or deleting regions therefore can never corrupt the layout. A `Region` renders generically
as a flow column (its `shapeOf` case = `Stack`); only `AppShell` needs per-target code. `Region` is
**not a palette item** — it exists only inside an `AppShell` (seeded by a preset or the region toggle).

## Decision 3 — one pure template helper, shared by all five renderers

`appShellTemplate(areas)` (in dependency-free `src/ir/appshell.ts`) computes the `grid-template-*`
strings; absent rows/cols collapse, header/footer span all present columns. The three string targets
read it via `appShellDecls` (β's string home, `leaf-style.ts`); canvas + editor read it via
`components/AppShell.tsx` (β's React home, ADR-0005). One source ⇒ the targets can't drift (pinned by
`appshell.test.ts`). Area strings are **single-quoted** so the value is valid inside an HTML/Angular
`style="…"` attribute; the React source wraps such values in `"…"`.

## Decision 4 — web-only, like Grid

`AppShell` + `Region` are `emailSafe: false` (ADR-0006): a grid app shell can't flatten to MJML, so
email Frames lock them. MJML's `classifyCardChild` gains compile-forced `unsupported` arms for both
(RP-8) — a valid email tree never reaches them.

## Decision 5 — BOTH flexible toggles AND presets

The flexible half: a new descriptor `controls: ['regions']` surfaces an Inspector **Panels** section
(a `Checkbox` per optional area; `main` is locked on) wired to a `toggleRegion` store action that
inserts/removes a `Region` at its canonical position. The preset half: palette **variants** (`App
layout`, `Holy grail`, `Sidebar + Main`) via `makeAppShell(areas)` — a preset is just a different area
set. Both share `makeAppShell`/`makeRegion`, so there is one region-building source.

## Sizing is fixed in v1 (deferred follow-up)

The template bakes in `240px` left / `300px` right / `auto` header+footer / `1fr` main and a visible
`min-height`. Per-region size controls are deferred: they would need new `width`/`height` style keys,
re-opening the ADR-0003 structured-vs-free-form question — out of scope here.

## Consequences

- A new container that needs computed/bespoke rendering now has a home (component container), not just
  one that renders as a named RAC Component — the data-grid inherits this.
- The layout is robust to editor mutation (placement by name), at the cost of a `Region` indirection
  layer and five bespoke `AppShell` renderers (the standard compound-container cost).
- App shells are web-only; that is correct (an email is single-column) and consistent with `Grid`.
- Tests pin the computed template, per-target emission + placement, the slot rule (`canContain` /
  `isFrameValid`), the email lock, and the `toggleRegion` add/remove/undo behaviour.
