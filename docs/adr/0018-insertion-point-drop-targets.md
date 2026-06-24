# Insertion-point drop targets (gap droppables) + a closest-fallback collision strategy

The intra-Frame drag-drop became **reliable to aim**: dropping a node _between_ or _under_ siblings
now catches across the whole gap, and a drag released in the blank space around a Frame's content no
longer silently does nothing. This is an **interaction-layer** decision on top of RP-5's pure
`drop-intent.ts` — it changes _which droppable the pointer resolves to_ and _how wide the target is_,
not what a resolved drop _means_ (RP-5's `placeAt`/email/allowed-children logic is reused verbatim).

## The problem

RP-5 resolves a drop from the **single hovered node** + the pointer's vertical fraction down that
node's rect: a container splits in **thirds** (`<0.25` before / `0.25–0.75` inside / `>0.75` after),
a leaf in halves (`computeMode`, `drop-intent.ts`). Two failures fell out of that geometry, both
reported as "it works but only after several tries":

1. **Reordering is a 25%-tall sliver.** To drop a node _between_ two sibling Rows (or _under_ one),
   the pointer must land in the **top/bottom 25%** of a Row — the middle 50% resolves to _inside_ that
   Row instead. Miss the sliver and the drop lands in the wrong container. The literal **gap between
   two siblings** (a `Stack`'s `gap` spacing) belongs to no child — only the parent container's
   droppable — so it resolves coarsely (the root forces _inside_ → append-at-end), never "insert at
   this index."

2. **Dead zones around the content.** dnd-kit's `pointerWithin` is precise but returns **nothing** in
   the blank areas a Frame leaves around its content (below the last child, in padding-less gaps, off
   the content on release). `over` goes `null`, no indicator shows, and drag-end dispatches nothing.

## Decision 1 — `closestCenter` fallback so a drag always resolves to a target

Collision detection (`deepestCollision`, `Editor.tsx`) keeps `pointerWithin` as the precise path —
when the pointer is genuinely within nodes it prefers the **deepest** (longest `path`). But when
`pointerWithin` returns nothing it now falls back to the single **`closestCenter`** droppable, so a
drag anywhere over the board resolves to _some_ target (fixing problem 2). The trade: a drag released
far from any Frame drops into the nearest node instead of no-op'ing — **Escape cancels** a drag
mid-flight. This is purely additive; the precise within-nodes behaviour is unchanged.

## Decision 2 — insertion-point ("gap") droppables own before/after between siblings

Each node renders **wide overlay hit-strips** at sibling boundaries (`GapDrop`, `EditableNode.tsx`):

- a **leading gap** on every non-root node = "drop _before_ me among my siblings", and
- a **trailing/append gap** on every non-empty container = "drop at the _end_ of me".

So the whole gap is the target, not a 25% edge (fixing problem 1); _inside_ a container is reached
only when the pointer is squarely over its body, away from the edges.

A gap is **not** a new concept downstream: it **anchors to an existing child node + a forced
`before`/`after` side**, so it resolves through the same node-drop pipeline. The leading gap of child
_i_ = "before child _i_"; the append gap = "after the last child". Both reduce to an existing
`{ parentPath, index }` via `placeAt`, and reuse that anchor node's own before/after indicator line —
`GapDrop` renders no visual of its own.

## Decision 3 — one forced-mode field, not a parallel resolution path

The only change to the pure module is a single optional `mode?: DropMode` on `DropZone`:
`resolveDropIntent` uses `zone.mode ?? computeMode(...)`. A gap supplies the mode (it _is_ an insertion
point); a plain node omits it and `computeMode` runs exactly as before. Everything else — the
**allowed-children** rule (parent must accept the dragged type, ADR-0016), the **email** rule
(ADR-0006), `blocked` indicators, the emitted op shape (RP-1) — is shared by both. The `DropTarget`
shape is **unchanged** (a gap reuses the anchor node's `path` + `mode`), so the store, the indicator
lines, and every existing RP-5 test are untouched.

## Decision 4 — gaps win ties with a `+0.5` collision-depth bias

A gap is a more specific intent than the node beneath it, so `collisionDepth` ranks a gap at
`anchorPath.length + 0.5` — beating both its anchor node (same `path.length`) and its parent container
in the thin overlap region. At a hard boundary, the genuinely deeper node still wins, so nested
insertion points keep working (insert before a grandchild beats insert before its parent).

## Zero layout impact (the canvas still mirrors the IR)

Gap strips are absolutely-positioned overlays with **`pointer-events: none`** — dnd-kit detects
droppables by **measured rect**, not DOM hit-testing, so detection still works, the strips never block
the selection click beneath them, and they add **no flow box** to the rendered design (ADR-0007's
golden rule: editor chrome must not alter the exported layout). They use chrome tokens, scoped to
`.ed-board-content`. Detection is measured in the React-Flow-transformed space the pointer lives in,
so it stays correct at any board zoom.

## Rejected alternatives

- **`@dnd-kit/sortable`.** The canonical list-reorder toolkit, but it assumes flat(-ish) lists +
  `arrayMove`; our IR is an arbitrary tree and a drop can land before/inside/after at any depth across
  containers. It would fight the tree-insertion model, not extend it.
- **Re-weight the thirds** (e.g. 40/20/40 for containers). One-line, near-zero risk, but a lower
  ceiling — the gap _between_ siblings still belongs to no child, so insert-at-index stays coarse. Kept
  the thirds as the **fallback over a node's body**; gaps own the boundaries.
- **A discriminated `DropTarget`/`DropZone` union for gaps.** Cleaner in the abstract, but it churns
  the store, the indicator rendering, and every RP-5 test for no behavioural gain over the anchor +
  forced-mode reuse.

## Known limitation — vertical orientation (deferred)

Gap strips sit at a node's **top/bottom** edges (horizontal bars), matching the existing
`.ed-drop-line` convention — correct for vertical `Stack`s (the dominant and reported case). For a
horizontal `Row`, the strip is at the row's top/bottom rather than its left/right edges; this is the
**same assumption the before/after lines already make**, so it is not a regression. A parent-axis-aware
(left/right) variant for horizontal Rows is a clean follow-up — it needs the parent's `shape.axis`
threaded to the gap, which the `Emitter` context (`NodePath`) does not carry today.

## Consequences

- Reorder/insert-between is a wide, reliable target; the felt "try several times" flakiness is gone.
- The pure `drop-intent.ts` keeps its single resolution path and full test coverage; the new behaviour
  is one `??`, a collision tweak, and a presentational overlay — easy to reason about and extend.
- Two extra droppables per node (roughly) are measured per drag — negligible for Frame-sized trees.
- Tests pin the **forced-mode** path: a forced `before` ignores geometry, a forced `after` on the last
  child appends, and a forced mode still runs the allowed-children + email rules (`drop-intent.test.ts`).
- Follow-ups: horizontal-Row gap orientation; if gaps ever need to diverge from node targets, promote
  `DropZone.mode` into a first-class gap variant.
