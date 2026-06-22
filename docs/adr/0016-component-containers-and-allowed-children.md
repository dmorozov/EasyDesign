# Compound Components: a component-container walk seam + an allowed-children constraint layer

EasyDesign gained its first **compound Component** — a `RadioGroup` whose options are `Radio`
children — and with it two decisions the IR had so far avoided: how a container can render as a
_specific Component_ (not a layout box), and how to constrain _which_ children a container accepts.
This is RP-10 from the refactoring plan, triggered (as the plan predicted) by the first compound
Component. Both decisions are deliberately **general**: the next compound — an anticipated data-grid
(distinct from the layout `Grid`) — plugs into the same two seams without touching either.

## The problem

Two gaps surfaced together:

1. **Rendering.** Every container so far (Stack/Row/Column/Grid) is a **layout** container: it renders
   as a styled `<div>`/flex/grid box, and all five walk adapters share one shape-driven `container()`
   renderer (`shapeOf` → `ContainerShape`). A `RadioGroup` is not a box — it renders as a React-Aria
   `<RadioGroup>` (canvas) / `<fieldset><legend>` (exports). Forcing it through the layout `container()`
   would mean a per-type `if (node.type === 'RadioGroup')` branch in every adapter — the exact
   information-leak the descriptor/registry refactors (ADR-0014, RP-9) removed for leaves.
2. **Structural validity.** The IR had **no constraint layer** — any node nested in any container. A
   `Radio` only makes sense inside a `RadioGroup`; dropping one into a `Grid`, exporting, and getting a
   broken tree was reachable. The IR's `children: Node[]` can't express "only `Radio` here" for the
   editor, which builds trees at runtime from generic `Node`s.

## Decision 1 — component containers dispatch through `emit.component`, parallel to `emit.leaf`

Containers split into two kinds, both `'children' in node`:

- **Layout containers** (`Stack`/`Row`/`Column`/`Grid`) keep the one shape-driven `container()`
  renderer. `shapeOf` is narrowed to `LayoutContainerNode`, so its switch stays exhaustive.
- **Component containers** (`RadioGroup`, `ComponentContainerType`) bypass `shapeOf`/`container()` and
  dispatch through a new **`emit.component: ComponentRenderers<T, C>`** field — a mapped type
  `{ [K in ComponentContainerType]: (node, children: T[], ctx) => T }`, exactly mirroring `emit.leaf`.
  The renderer receives the already-walked children and supplies the Component wrapper.

`walkNode` dispatches `node.type in COMPONENT_CONTAINERS ? emit.component[type] : emit.container(shapeOf)`.
Because `component` is a **required `Emitter` field keyed off the union**, adding a component-container
type is a **compile error at every walk adapter** until it supplies a renderer — the same
"locality ≠ safety" guarantee RP-9 gave leaves (probe: the union change lit up html / react / angular /
canvas / editor simultaneously). MJML is **not** a walk adapter (it is bespoke, ADR-0008): a
component-container reaching its bespoke flattener is rejected by `classifyCardChild` (RP-8), and the
new `Radio` leaf gets an entry in MJML's own `MJML_LEAVES` record that throws (it is email-unsafe).

The bespoke flattener and the walk are untouched in spirit: `walk.ts` still imports only `ir/types`;
the Component markup lives entirely in the adapters (`src/components/RadioGroup.tsx` for the RAC canvas,
`leaf-style.ts` for the export β). A real type guard `isLayoutContainer(node)` lets consumers that read
layout props (the Inspector's `resolveEditModel`) narrow without a cast and stay correct as more
component containers are added.

## Decision 2 — allowed-children is a descriptor field, enforced at two consumers

The constraint is a **`allowedChildren?: readonly NodeType[]` field on the Component Descriptor**
(ADR-0014) — `RadioGroup → ['Radio']`; omitted = an _open_ container. Two derived facts + one predicate
live in `descriptors.ts`, single-sourced from the descriptors:

- `RESTRICTED_CHILD_TYPES` = every type listed in some `allowedChildren` (the _slot_ children). A slot
  child may **only** go where explicitly allowed.
- `canContain(parent, child)` = a constrained parent admits only its listed types; an open parent
  admits anything that is **not** a slot child. So `Radio` is rejected by `Stack`/`Grid` (open, but
  `Radio` is restricted) and accepted by `RadioGroup` — a **bidirectional** rule from one declaration.

Two consumers enforce it, **hybrid compile + runtime**:

- **Compile time** — `RadioGroup`'s IR type narrows its children to `children: RadioNode[]`, so
  hand-authored IR, the sample, and the generators can't put a non-`Radio` in a `RadioGroup`. The
  type-agnostic editor (`node-tree.ts`) keeps its own structural `{ children: Node[] }` view of a
  container (array covariance admits the narrower `RadioNode[]`), so it still splices generic `Node`s
  unchanged; the runtime validator is what guards _its_ path.
- **Runtime** — the drag-drop validator (`drop-intent.ts`, RP-5) calls `canContain` against the node
  that will actually become the parent (the hovered node for `inside`, else its parent), and a violation
  becomes a `rejected` intent with `reason: 'invalid-child'` + `blocked` — so the indicator shows the
  drop disallowed (it never silently no-ops). The import audit `isEmailFrameClean → isFrameValid`
  generalises to reject email-unsafe **and** structurally-invalid trees in one walk, so an imported or
  hand-edited document can't smuggle a `Radio` outside a `RadioGroup`.

## Why this shape

- **One declaration, compile-forced fan-out.** A compound Component = a union branch + a descriptor row
  (with `allowedChildren`) + N `component`/`leaf` renderers the compiler demands. No per-type branches
  smeared across adapters or validators.
- **The render and constraint halves are orthogonal and both general.** `emit.component` doesn't know
  about `RadioGroup` specifically; `canContain` doesn't know about rendering. The next compound (a data
  grid) adds `'DataGrid'` to `ComponentContainerType` + `COMPONENT_CONTAINERS`, a descriptor row with
  `allowedChildren: ['…Row']` (or whatever its slots are), and the compiler enumerates every renderer to
  write — no edits to the seam itself. Multi-level compounds (grid → row → cell) compose via per-type
  `allowedChildren`.
- **Email stays safe by construction.** `RadioGroup`/`Radio` are `emailSafe: false`, so the Palette
  locks them in email Frames, `isFrameValid` rejects them on import, and MJML never has to render them.

## Consequences

- Adding a leaf or a component container is compile-checked across all five walk adapters; a forgotten
  renderer fails to build (RP-9 + this ADR). MJML, being bespoke, handles new leaves via `MJML_LEAVES`
  and new containers via `classifyCardChild`'s `never`-sentinel (RP-8).
- The drop indicator now has a second rejection reason (`invalid-child`) beside `email-unsafe`; both
  render as a `blocked` danger-coloured indicator.
- **Editing** is descriptor-declared free-text props. The old hardcoded `content` Inspector control was
  generalised into **`Descriptor.textFields: TextFieldSpec<T>[]`** — each entry a `{ key, label }` whose
  `key` is **type-checked to a real prop of that node** (`keyof NodeOf<T>['props']`), so Radio exposes
  only `value`/`label`, Text only `content`, etc. `resolveEditModel` projects them to a `text` section;
  the Inspector renders one labelled input each and writes back through a single generic
  **`setTextProp(frameId, path, key, value)`** store action (descriptor-gated — it refuses any
  `(type, key)` not in `textFields`, coalesced per `frame:path:key`). So RadioGroup edits its **Group
  label**, Radio its **Label** + **Value**, and Text/Button their content — all through one seam, no
  per-type setters. A fresh `RadioGroup` still mints two `Radio`s; the user drags more in and renames
  them. (Radio reordering within a group and add/remove-from-the-Inspector remain follow-ups.)
- Trade-off recorded: the children-union narrowing (`RadioGroup.children: RadioNode[]`) buys compile
  safety for authored IR + the generators; the type-agnostic `node-tree.ts` keeps working through its
  own `{ children: Node[] }` view (array covariance), and the runtime validator is the authoritative
  guard for the editor path. Output for all existing fixtures is byte-identical (the golden net only
  gained the new `radiogroup` fixture).
