# The Node Walk — one shared IR traversal for the web/React targets; MJML stays bespoke

The dispatch over the IR node vocabulary (`Stack/Row/Column/Grid/Text/Button/Image`) lives **once**, in
`src/ir/walk.ts`: a `walkNode(node, ctx, emitter)` traversal behind an `Emitter<T, C>` seam. The three
string **Export Targets** (HTML, React, Angular), the live canvas (`CanvasNode`), and the editor's
`EditableNode` are all small adapters over it — they supply only their output dialect (`T` = string |
ReactElement) and per-node context (`C` = void | depth | node path). A container's structural facts
resolve to a discriminated `ContainerShape` (`flow | grid`, carrying axis / columns / justify / align /
wrap), so the structure (**α**) is stated once. The leaf CSS vocabulary (**β**) lives once **per side**:
`src/generators/leaf-style.ts` for the string targets, the React-Aria component layer (`src/components`,
ADR-0005) for the canvas/editor.

**Why.** The same dispatch was re-stated in **six** places; adding the Grid Layout element earlier
touched five files in lockstep, and the `Row` `flex:1` rule was copy-pasted five times. Adding the
layout properties justify/align/wrap on that shape would have triplicated the keyword→CSS rule across
the string generators. The walk concentrates α to one traversal; the two β homes concentrate the
vocabulary; the discriminated `ContainerShape` makes a new layout property (or `kind`) a **compile
error** in every adapter rather than a silent omission.

**MJML stays bespoke — it is deliberately NOT an adapter of this seam.** The email generator resolves
Design Tokens to **literals** (not `var(--…)`) and **flattens** the Stack into sibling `mj-section`s;
its `renderLeaf` throws on container nodes (ADR-0006). It solves a genuinely different problem, so
deleting its bespoke walk would expose no duplication — only break email. Do not try to unify it; a
future review that sees five adapters sharing one walk should leave MJML out by design.

**The walk never leaves the substrate.** `walk.ts` and `leaf-style.ts` import only `src/ir/types` — no
`design-system`, no component layer (ADR-0007 holds). Editor chrome (selection, drag handle, drop
indicators) is applied by `EditableNode`'s per-node wrapper in `src/editor`, never by the walk.

**Consequences.** A new Layout element = one `walkNode` case + one method per adapter; a new layout
property = one `ContainerShape` field (flagged by the compiler in every adapter); a new web Export
Target = one `Emitter`. MJML changes stay isolated to `mjml.ts`. The promotion onto this seam preserved
behavior: HTML, React, MJML, and the SSR canvas stayed byte-identical on the sample; Angular changed
only by reordering Button style declarations to match the shared β order (cosmetic, no render
difference) — the consolidation of a pre-existing inconsistency between the generators.

**Amended (RP-9, 2026-06-22): leaves dispatch through a typed registry, so a missing leaf renderer is a
compile error in _every_ target.** The `Emitter`'s three named leaf methods (`text`/`button`/`image`)
were **not** keyed off the union — adding a leaf node type forced a new `walkNode` case but left the
five adapters (html / react / angular / canvas / editor) silently satisfying the unchanged interface (a
probe confirmed only `walk.ts`, `mjml.ts`, and the RP-2 descriptor failed to compile; the five emitters
did not). They are now one **`leaf: LeafRenderers<T, C>`** field — a mapped type
`{ [K in LeafType]: (node, ctx) => T }` over `LeafType = Exclude<Node, ContainerNode>['type']` (derived
from the union). `walkNode` dispatches `'children' in node ? container : emit.leaf[node.type](node)`, so
adding a leaf needs **zero** `walkNode` change and instead fails to compile at each adapter's `leaf`
record until the renderer is supplied (re-probe: all eight sites now error). The container half is
unchanged. MJML stays bespoke but shares the same `LeafType` for its own `MJML_LEAVES` record, so a
forgotten email leaf compile-fails too — its container-reaches-the-flattener throw is kept as a runtime
guardrail (ADR-0006), now behind a `'children' in node` check. One narrowing cast bridges TS's
correlated-union gap in `walkNode` and `renderLeaf`. Output byte-identical (golden net unchanged).

**Amended (RP-8, 2026-06-22): MJML's CONTAINER dispatch now shares the union vocabulary and is
compile-exhaustive too — MJML stays bespoke, it is still not an adapter of this seam.** RP-9 closed the
leaf half; this closes the container half. `renderCardSections` previously dispatched on a string
literal (`child.type === 'Row'`) with everything else implicitly a leaf-run, so adding a _container_
type left MJML compiling while a new shape fell through to `renderLeaf`'s runtime throw. The per-child
decision is now a `classifyCardChild(node): CardChild` keyed off the node union: a leaf (batched into a
leaf-run section), a `Row` (its own sibling section), or an `unsupported` container — with an exhaustive
`switch` whose `default` is a `never` sentinel (`return node`), so a **new container type is a compile
error here** (probe: omitting a `case` makes the sentinel fail `TS2322`), forcing an explicit email
decision (`Stack`/`Column`/`Grid` reject with a clear "cannot represent a nested X" error; `Grid` is also
email-unsafe per ADR-0006). `ContainerType` is now exported from `walk.ts` (symmetric with `LeafType`).
This is the limit of the alignment: the section/column **flattening itself stays bespoke** — the
cross-sibling leaf-run batching is non-compositional and does not belong in the post-order walk (the
walk is never touched; only mjml.ts shares its types). `renderLeaf`'s container guard is retained as
defense-in-depth for a container nested inside a Row column (a runtime-only constraint until RP-10's
`allowedChildren` lands). Output byte-identical (golden net unchanged).

**Amended (RP-10, 2026-06-22 — see ADR-0016): `walkNode` gained a third dispatch arm for COMPONENT
containers.** Containers now split into LAYOUT containers (Stack/Row/Column/Grid → the shared
shape-driven `container()`; `shapeOf` and `container`'s node param are narrowed to `LayoutContainerNode`)
and COMPONENT containers (RadioGroup → a new **`emit.component: ComponentRenderers<T,C>`** record, a
mapped type over `ComponentContainerType`, exactly parallel to `emit.leaf`). `walkNode` dispatches
`node.type in COMPONENT_CONTAINERS ? component[type] : container(shapeOf)`, so a component container that
renders as a real Component (not a box) needs no per-type branch in any adapter, and a forgotten
`component` renderer is a compile error at every walk adapter. The walk still imports only `ir/types`;
the Component markup stays in the adapters. MJML remains bespoke (a component container hits
`classifyCardChild`'s `unsupported`). Full rationale + the allowed-children constraint layer: ADR-0016.
