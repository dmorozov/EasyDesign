# EasyDesign — Architecture Improvement Plan

This plan surfaces **deepening opportunities**: places where a _shallow_ cluster of modules (interface
nearly as complex as the implementation, logic copy-pasted across callers) should become a _deep_
module (a lot of behaviour behind a small interface). The aim is **locality** (change/bugs/knowledge
concentrate in one place) and **leverage** (callers and tests learn one interface, get a lot back),
which together make the codebase testable and AI-navigable.

It also folds in three requested features — **add/remove Frames**, **container style editing
(gap/padding Design-Token pickers)**, and **canvas keyboard accessibility** — by showing which seam
each one sits on. The headline finding: those features are currently _expensive_ precisely because
they land on the shallow clusters below. Deepen first, and each feature becomes small.

**Vocabulary.** Architecture terms (Module, Interface, Implementation, Depth, **Seam**, Adapter,
Leverage, Locality, the **deletion test**) follow `.claude/skills/improve-codebase-architecture/LANGUAGE.md`.
Domain terms (Board, Frame, Component, **Layout element** = Stack/Row/Column/Grid, Theme, **Design
Token**, Design Palette, Component Palette, Selection, **Export Target**) follow `CONTEXT.md`. Locked
decisions are in `docs/adr/0001–0007`; nothing here re-litigates them (one guardrail _reinforces_ ADR-0002/0006).

**Method.** Five read-only audit passes (generators, the React-Aria/canvas layer, the editor
store/history/persistence, editor render+drag, editor panels) applied the **deletion test** to each
suspected-shallow module: _imagine deleting it — does complexity vanish (pass-through, leave it) or
reappear across N callers (it was earning its keep — make it deep)?_ Every candidate below scored
"reappears across N callers."

**Status note.** There is **no test runner yet**. The largest payoff of these deepenings is that the
new modules are pure and unit-testable at their interface — so Phase 1 should also stand up `vitest`.

---

## The deepening opportunities

### D1 — The Node Walk: one deep traversal, per-target emitters

- **Modules/files:** `src/generators/{html,react,angular}.ts`, `src/components/canvas.tsx`,
  `src/editor/EditableNode.tsx` (and the IR vocabulary in `src/ir/types.ts`).
- **Problem (friction).** The dispatch over the Layout-element/Component vocabulary
  (`Stack/Row/Column/Grid/Text/Button/Image`) is re-stated in **six** places: the three web Export
  Target generators, the MJML generator, the `CanvasNode` preview renderer, and `EditableNode`'s
  `NodeInner`. Each independently encodes the same _decisions_ — "Stack is a flex-column", "Row wraps
  every child in `flex:1`", "Grid is `grid-template-columns`", "Button binds brand colour" — tangled
  with each target's _emission syntax_ (string vs JSX object vs Angular template vs React element).
  Adding the Grid Layout element earlier required editing five files in lockstep; the `Row` `flex:1`
  wrapper alone is copy-pasted five times.
- **Deletion test → CONCENTRATES.** Delete any one switch and that caller breaks while the identical
  decision tree still sits in the other five — proof of duplication, not a pass-through. The decision
  ("what _is_ a Stack, structurally") is one thing said six times.
- **Solution (the deep module + its seam).** Extract a `walkNode(node, emitter)` traversal plus an
  `Emitter<T>` interface (one method per node type) into `src/ir/walk.ts`. The traversal — dispatch,
  recursion, and the `Row` `flex:1` contract — lives **once**. Each caller becomes a small **adapter**
  implementing only its emission syntax: `Emitter<string>` for HTML/Angular, `Emitter<ReactElement>`
  for `CanvasNode`, and `EditableNode` wraps the same traversal with its editing chrome (drop targets,
  selection, drag handle). The **seam** is the `Emitter<T>` interface.
- **Benefits.** _Locality:_ the IR's structural contract is stated once; a new Layout element is one
  traversal case + one method per adapter (a visible, structured diff) instead of a six-file hunt.
  _Leverage:_ `EditableNode` collapses from ~140 lines of mixed traversal+chrome to "wrap each child";
  `CanvasNode` becomes trivial. _Tests:_ the traversal is a pure spec tested once at the interface,
  rather than re-asserting "Button binds brand colour" three times across generators.
- **Guardrail — MJML stays bespoke (do NOT fold into D1).** The MJML generator resolves Design Tokens
  to **literals** (not `var(--…)`) and **flattens** the tree into sibling `mj-section`s (ADR-0006). It
  solves a genuinely different problem; deleting its bespoke walk exposes no duplication, only breaks
  email. Keep it as its own emitter with its own resolver. _Worth an ADR_ ("the Node Walk is shared
  for web targets + the React renderers; MJML is intentionally separate") so a future review doesn't
  try to unify it.
- **Unlocks:** cheap new Layout elements/Components; **canvas-a11y** (focus/keyboard attributes attach
  at one traversal site).

### D2 — The Design-Token Model: a queryable Theme module

- **Modules/files:** new `src/theme/design-tokens.ts` (the seam); today the knowledge is smeared
  across `src/components/tokens.ts`, each generator's token resolver, `src/editor/literals.ts`,
  `src/editor/ThemePanel.tsx`, `src/editor/palette.ts`, `src/editor/store.ts`, `src/ir/sample.ts`.
- **Problem (friction).** Design-Token knowledge is **stringly-typed and scattered**. Four facts that
  belong together live apart: (a) the dot-path→`var(--…)` resolution is re-implemented in three web
  generators _and_ `components/tokens.ts`; (b) _which_ Design Tokens exist and their **category**
  (colour / spacing / radius / typography) is hardcoded — `ThemePanel`'s `SWATCHES` list, `palette.ts`
  `create()` defaults (`gap: 'space.md'` ×3), `store.ts`'s `webRoot`, `sample.ts`; (c) _which style
  keys a node type accepts_ (`background/padding/borderRadius/gap`) is filtered independently in every
  generator and in `styleFromTokens`; (d) nothing **validates** a token ref — `'color.surfce'`
  silently emits a broken `var()` for web and throws only at MJML runtime. The Theme is not a Module;
  it is loose strings. Crucially, **no module can answer "which Design Tokens are spacings?"** — the
  exact question container style editing must ask.
- **Deletion test → CONCENTRATES.** Delete the hardcoded lists/resolvers and the knowledge reappears
  in ≥7 files, each rebuilding it; a typo'd ref has no single place to be caught.
- **Solution (the deep module + its seam).** One Design-Token Model over the DTCG `tokens.json`,
  exposing a small interface: `byCategory('space'|'color'|…)`, `isValidRef(ref)`, `resolveVar(ref)`
  (web), and `stylableKeys(nodeType)` (the allowed style keys for a Layout element + each key's token
  category). The web generators and `components/tokens.ts` share `resolveVar`; the email **adapter**
  keeps its literal resolver (D1 guardrail); `ThemePanel`, `palette.ts`, and the future Inspector all
  _query_ the model instead of hardcoding. The **seam** sits between the IR's `StyleMap` contract and
  the targets/UI.
- **Benefits.** _Locality:_ every fact about Design Tokens (names, categories, defaults, valid style
  keys) is one module; adding a token in Style Dictionary makes it instantly queryable. _Leverage:_
  the Inspector builds gap/padding pickers by calling `stylableKeys(node.type)` + `byCategory('space')`
  — no hardcoding; generators stop re-deriving resolution. _Tests:_ pure functions — assert every
  hardcoded default (`palette.ts`, `sample.ts`) resolves in the catalog, so a renamed token fails the
  suite instead of rendering blank.
- **Unlocks:** **container-style-editing** (the central enabler); runtime IR validation on load;
  per-Frame overrides; a fuller Design Palette later.

### D3 — The Frame lifecycle Module + the Board↔React-Flow seam

- **Modules/files:** new `src/editor/frames.ts` + a `useFrameNodes` seam; today split across
  `src/editor/store.ts` (`createInitialFrames`, `moveFrame`), `src/editor/FrameNode.tsx` (target
  dropdown), `src/editor/Board.tsx` (React-Flow node seeding), `src/editor/Editor.tsx` /
  `src/editor/Palette.tsx` (`frame.target === 'email'` checks inline).
- **Problem (friction).** A **Frame**'s lifecycle has no owner. Creation lives in
  `createInitialFrames`; the target medium is mutated by a dropdown in `FrameNode`; the **email-mode
  restriction** (ADR-0006) is re-checked inline wherever a Component is inserted (`Editor` drop end,
  `Palette` click); position is split between `store.moveFrame` and Board's drag handler. And the
  Board↔React-Flow sync is **one-directional and brittle**: Board seeds React-Flow nodes once
  (`useMemo([])`) and only re-seeds by a full **remount** keyed on `docKey`. There is no place to put
  "add a Frame" / "remove a Frame".
- **Deletion test → CONCENTRATES.** The email-safe invariant is mandatory; delete the scattered checks
  and every inserter must re-implement it (drift + bugs). Delete Board's seed and nothing renders. Not
  a pass-through — these are load-bearing rules with no home.
- **Solution (the deep module + its seam).** A Frame lifecycle Module owning `createFrame(target)`,
  `deleteFrame(id)`, `setTarget`, `move`, and the single predicate `canInsertComponent(frame, node)`
  (the email-mode rule, consulting the Component Palette's `emailSafe` metadata). Separately, a
  `useFrameNodes()` seam owns the `EditorFrame[] → React-Flow node[]` mapping reactively (add/remove
  without a remount; position write-back on drag). The **seam** is the Frame-lifecycle interface; the
  remount becomes an internal detail.
- **Benefits.** _Locality:_ Frame rules (target fixed at creation, target gates inserts, position
  mutable) co-locate; a new rule ("min width") touches one module. _Leverage:_ add/remove Frames
  becomes a couple of lifecycle calls, not a Board-remount choreography. _Tests:_ "cannot insert Grid
  into an email Frame", "createFrame yields a unique id" — tested without React or React Flow.
- **Unlocks:** **add-remove-frames**; Frame templates; strict validation on document load.

### D4 — The Editor history + persistence Module (hardening)

- **Modules/files:** `src/editor/store.ts` (`commit`/`undo`/`redo`), `src/editor/document.ts`,
  `src/editor/DocumentPanel.tsx`.
- **Problem (friction).** The invariant _"every change is undoable **and** auto-persisted"_ is
  **mixed-depth**: it works and reads cleanly, but it is enforced _per action_ — each mutating action
  must remember to call `commit(...)`, and auto-save is a dangling `useEffect` in `DocumentPanel`. Add
  a new mutating action and forget `commit()` → undo silently breaks, with nothing to catch it. The
  `Snapshot` shape is known in two places.
- **Deletion test → CONCENTRATES (mildly).** Remove `commit()` and history vanishes from every action;
  remove the `useEffect` and the persist need reappears at load. The invariant isn't negotiable.
- **Solution.** A history-aware dispatch so mutations are pure document transforms and one module
  records history + schedules persistence — making "undoable + saved" structural rather than a
  per-action ritual. Lower urgency than D1–D3 (it functions today); do it once the action set grows.
- **Benefits.** _Locality:_ coalescing, history limit, and debounce-save in one place. _Tests:_
  coalescing and persistence timing tested without zustand/React. _Leverage:_ named checkpoints,
  multi-field grouped undo become local additions.
- **Unlocks:** robustness as the action set grows; future checkpoints.

### Minor / deferred

- **DropManager** (`computeTarget` in `Editor.tsx`): already concentrated (extracted during the
  reorder work) — a single source of truth for before/after/inside. Leave as-is; revisit only if drop
  rules multiply.
- **`Row` `flex:1` wrapper**: folds into D1 (becomes the traversal's one `Row` case).

---

## How the requested features land on these seams

| Feature                                                        | Sits on                                          | Work once the seam exists                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **add/remove Frames**                                          | **D3** (Frame lifecycle + `useFrameNodes`)       | `createFrame`/`deleteFrame` actions; a "+ Frame" control in the Board/Document panel; React-Flow reflects them reactively (no remount). A Frame delete also clears Selection/history coalescing.                                                                                                                                          |
| **container style editing** (gap/padding Design-Token pickers) | **D2** (Design-Token Model) + a deeper Inspector | Inspector asks `stylableKeys(node.type)` → renders a picker per key; spacing keys list `byCategory('space')`. A new `setNodeStyle(frameId, path, key, ref)` store action (history-coalesced like text edits). No hardcoded token names.                                                                                                   |
| **canvas keyboard a11y**                                       | **D1** (Node Walk) + new `useCanvasA11y`         | A `useCanvasA11y(frameId, path)` hook supplies roving `tabIndex`/`role`/`aria-label` and arrow-key tree navigation, Enter (edit), Delete (remove) — attached at the single traversal site D1 creates. This finally lets the `jsx-a11y` relaxation for `src/editor/**` be **removed** (it currently masks this gap, not a false positive). |

---

## Suggested sequence (dependency-ordered)

**Phase 0 — Make it testable.** Add `vitest` (Vitest config already shipped as a template under
`.claude/skills/npm-package`). The deep modules below are pure; the interface is the test surface.

**Phase 1 — Deepen the seams the features need.**

1. **D1 Node Walk** — lowest risk, biggest immediate duplication relief; keep MJML separate (+ ADR).
2. **D2 Design-Token Model** — unblocks container editing; retires the most-scattered knowledge.
3. **D3 Frame lifecycle + `useFrameNodes`** — unblocks add/remove Frames.

**Phase 2 — Build the features on the new seams.**

4. **add/remove Frames** (on D3).
5. **container style editing** (on D2 + Inspector).
6. **canvas keyboard a11y** (on D1 + `useCanvasA11y`); then delete the `src/editor/**` `jsx-a11y` relaxation.

**Phase 3 — Hardening.**

7. **D4** history+persistence module once the action set has grown (Phase 2 adds several actions).
8. Tests at each new interface; the ADR for "MJML is intentionally not part of the Node Walk".

---

## ADR follow-ups to consider

- **MJML stays bespoke** — record that the Node Walk (D1) deliberately excludes the email Export
  Target (literal resolution + tree flattening, ADR-0006), so future reviews don't re-suggest unifying it.
- If D3's `canInsertComponent` becomes the _only_ enforcement point for the email-mode restriction,
  note it against ADR-0006 so the rule's single home is discoverable.

_Next step (per the skill): pick a candidate (D1–D4) to drop into a design/grilling conversation — we'd
walk the interface options for the deep module (Design It Twice), what sits behind the seam, and which
tests survive. D1 or D2 are the highest-leverage starting points._
