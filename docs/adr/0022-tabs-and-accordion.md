# Interactive compound components: Tabs and Accordion

EasyDesign gained its first **interactive** compound components — a **Tabs** strip and an **Accordion**
of collapsible sections. They are the first Components whose value is runtime _behaviour_ (which tab is
shown, which sections are open), which forced an explicit answer to "how does an interactive widget cross
the static-export boundary (ADR-0007)?" Neither is a new seam: each rides the existing component-container
machinery (ADR-0008/0016) and the descriptor (ADR-0014). Both add **no new leaf types** and are
**web-only** (the `unsupported` arm, like Pagination).

## Decision 1 — Tabs and Accordion are component containers with OPEN, restricted panels

`Tabs` is a COMPONENT container constrained to `TabPanel`; `Accordion` is constrained to `AccordionItem`.
The panels (`TabPanel`, `AccordionItem`) are the novel part: each is an **OPEN container** — it omits
`allowedChildren`, so it holds arbitrary body content (a section of UI) — _and_ it is a **restricted
child** (it appears in its parent's `allowedChildren`, so it joins `RESTRICTED_CHILD_TYPES` and may live
**only** inside its compound). This is the first type to combine both, but both halves already existed:
**AppBar** is an open component container, and **Region** (⊂ AppShell) is a restricted child that is itself
open. So `canContain`/`RESTRICTED_CHILD_TYPES` (descriptors.ts) needed no change.

The container renderer reads its children's props to assemble the two visual regions — the tablist from
each `TabPanel.props.label`, the section headers from each `AccordionItem.props.title` — exactly the way
the `DataTable` renderer reads each row's `header` flag. So `TabPanel`/`AccordionItem` render only their
body content; the parent owns the wrapper (the `<div role="tabpanel">` / the `<details>`).

State that is set at creation, edited via palette presets (the `Stepper.orientation` idiom): a `Tabs`
carries `orientation` (horizontal/vertical) and an `Accordion` carries `exclusive` (single- vs multi-open).
Editing those in the Inspector is a deferred follow-up.

## Decision 2 — canvas vs export is decided by what HTML offers natively

The export targets emit **static, semantic markup** (ADR-0007 — React Aria is the editor runtime, not the
export substrate). What "static" means differs by widget, decided by whether a native element exists:

- **Accordion → native `<details>/<summary>`** on _both_ the canvas and all three web targets. This is
  interactive with **zero JavaScript**, SSR-trivial, and identical markup everywhere (**canvas == export**,
  the DataTable "hand-rolled native" spirit). The single-open variant uses the native exclusive-accordion
  `<details name="…">` grouping — still zero-JS. The canvas component (`components/Accordion`) mints one
  group `name` via `useId` and shares it with its items through context.
- **Tabs → a real React Aria `<Tabs>` on the canvas** (interactive switching + keyboard a11y for free, the
  **RadioGroup** precedent) but a **static `role="tablist"` snapshot on export**: a `<div role="tablist">`
  of `<button role="tab">`, the **first tab selected** and the rest carrying `hidden`, with one
  `<div role="tabpanel">` per panel. HTML has no native tab element, so switching in the exported code is a
  **deferred enhancement** — the snapshot is accessible and structurally identical across the three web
  targets. (A CSS-only radio-hack alternative was rejected as un-semantic; per-target stateful code was
  rejected as breaking structural parity.)

**Tabs is the first component that needs document-unique element ids** (to wire `aria-controls` /
`aria-labelledby`). Since no generator emitted ids before and the renderer signature carries no path, each
generator keeps a small `let tabsSeq = 0` in its `emit` closure, reset at the top of each `emit*` entry
function → ids `tabs-${seq}-tab-${i}` / `tabs-${seq}-panel-${i}`, deterministic in document order and
collision-free across multiple Tabs on one page. The same counter mints the exclusive-accordion
`name="acc-${seq}"`. React Aria handles ids itself on the canvas (`useId`, React 19 — no SSRProvider).

## Decision 3 — editor chrome rides on the panels; native `<details>` toggling is the reveal

The per-node chrome wraps each node in a `<div role="treeitem">` (`EditableShell`). Unlike a `<table>`
(ADR-0021), both widgets tolerate it:

- **Accordion**: `EditableShell` wraps the whole `<details>` (the shell `<div>` sits _outside_ `<details>`
  — legal). Each section's body is an **open drop zone** (the AppBar/Region empty-hint pattern). Expanding
  a section (clicking the summary, native behaviour) reveals its body to drop into — a collapsed
  `<details>` hides its content.
- **Tabs**: `EditableShell` wraps the React Aria `<Tabs>`; the tablist is built from the panels' labels and
  each rendered `TabPanel` (carrying its own shell + drop zone) becomes a tab's content. React Aria
  unmounts inactive panels, so a hidden panel is edited by **clicking its tab** to reveal it (tree-driven
  reveal is a deferred follow-up, mirroring DataTable's deferred per-cell canvas selection).

A `TabPanel`/`AccordionItem` lands **only** in its compound (the allowed-children rule), but — unlike a
`TableRow`, whose `DataTable` is not a canvas drop target — the `Tabs`/`Accordion` shell _is_ droppable, so
the slot tiles ("Tab panel" / "Accordion section") are genuinely usable.

## Consequences

- **Twenty Components now ride the ADR-0016 component-container seam** (the prior sixteen plus `Tabs`,
  `TabPanel`, `Accordion`, `AccordionItem`), with **no new leaf type**. Each addition stayed "one descriptor
  row + the adapters the compiler demands"; the editor's drop/frames/paths/a11y modules took the usual
  near-zero per-type edits (only the descriptor-driven `node-label` arms for the panel label/title).
- **The static-vs-interactive boundary is now explicit:** native `<details>` when an element exists
  (Accordion), React Aria on the canvas + a static accessible snapshot on export when it does not (Tabs).
- **Both are web-only.** `classifyCardChild` routes `Tabs`/`TabPanel`/`Accordion`/`AccordionItem` to the
  `unsupported` (throwing) arm — tabs and disclosure have no MJML model. The golden net exercises them
  through html/react/angular, and the app-layout sample + `generate` self-checks ship both.
- **Deferred** (the `Step.status`/`NavLink.active` precedent): tab-switching in exports, tree-driven reveal
  of a hidden canvas panel, and editing `Tabs.orientation` / `Accordion.exclusive` in the Inspector. No new
  design tokens (both reuse `color.*`, `radius.*`, `space.*`).
