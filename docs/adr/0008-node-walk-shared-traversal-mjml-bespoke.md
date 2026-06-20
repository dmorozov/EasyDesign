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
