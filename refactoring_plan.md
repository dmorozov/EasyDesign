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

**Method.** Six read-only audit passes (generators, the React-Aria/canvas layer, the editor
store/history/persistence, editor render+drag, editor panels, and a reskin-delta reconciliation)
applied the **deletion test** to each suspected-shallow module: _imagine deleting it — does complexity
vanish (pass-through, leave it) or reappear across N callers (it was earning its keep — make it deep)?_
Every candidate below scored "reappears across N callers."

**Status note.** ✅ **`vitest` is now stood up** (2026-06-20) — `npm run test`, 24 specs across
`src/ir/walk.test.ts`, `src/generators/leaf-style.test.ts`, `src/generators/generators.test.ts`
(unit tests on the pure seam + β table, plus golden snapshots of all four generators on the sample).
The largest payoff of these deepenings remains that the new modules are pure and unit-testable at
their interface — the interface is the test surface.

---

## Status delta since the chrome reskin (2026-06-20)

A full editor-**chrome** reskin landed _after_ the first draft of this plan (design system vendored at
`src/design-system/`; the editor chrome rebuilt on it; `src/components/*` deliberately left untouched
per ADR-0007). It does **not** invalidate D1–D4 — every deletion test still concentrates — but it
changes some facts the plan relied on. Read this before trusting the file/symbol references below.

- **Two-scoped Design Tokens (the golden rule, now structural).** Style Dictionary
  (`src/theme/style-dictionary.config.mjs`) now emits the one DTCG graph **three** ways: `theme.css` at
  `:root` (standalone export pages), `theme.scoped.css` at `.ed-board-content` (the live canvas), and
  `tokens.literals.json` (MJML). DS **chrome** tokens own `:root` (`src/design-system/chrome.css`); the
  **user** design Theme lives only under `.ed-board-content` (the class sits on `.ed-frame-body`,
  `FrameNode.tsx:43`), so the two never collide (e.g. `--radius-lg` 12px user vs 10px chrome). The live
  ThemePanel override now emits `.ed-board-content { … }` (`Editor.tsx:38` `buildOverrideCss`). **→ D2's
  model must be scope-aware and own the user token graph only.**
- **The right rail is now tabbed.** `src/editor/RightRail.tsx` + a `rightTab`/`setRightTab` store field
  (`store.ts`) switch **Inspector / Design / Export**. `selectNode` and every insert/move force
  `rightTab='inspector'` (`store.ts:136`); the Toolbar's "Export Code" sets `'export'`. `rightTab` is
  chrome-only UI state, intentionally excluded from `Snapshot`/undo (`store.ts:13` comment). **→ both
  requested UI features mount here; D4 must keep `rightTab` out of history.**
- **The Inspector already exists.** `src/editor/Inspector.tsx` (DS `PanelSection`/`Input`/`Badge`) edits
  the selected node and deletes it; `ThemePanel.tsx` is a working precedent for token-driven pickers (DS
  `Swatch` rows). **→ container-style editing _extends_ this tab; it does not build a panel.**
- **Stale references to correct.** `DocumentPanel.tsx` **never existed** — the debounced auto-save
  `useEffect` lives in `src/editor/Toolbar.tsx:28-41` (Toolbar now documents itself as the persistence
  owner and also owns undo/redo, dark toggle, JSON import/export/reset, and "Export Code"). The FrameNode
  target switch is a DS `SegmentedControl` (`FrameNode.tsx:34`), **not** a dropdown. `ThemePanel`'s
  `SWATCHES` is now a curated, **kebab-keyed** (`color-brand`) `{key,label}[]` rendered via DS `Swatch`,
  not a dot-path list. The email-mode restriction now shows email-unsafe palette items as **locked** (DS
  `PaletteItem disabled` + `disabledNote`) rather than hidden — so the old `paletteFor(target)` filter that
  implemented hiding (`palette.ts:94`) is now **dead code with zero callers**, and the `emailSafe` JSDoc
  that still reads "hidden in email Frames" (`palette.ts:13`) is stale. Remove the vestige (or fold the
  filter into D3's `canInsertComponent`) when D3 lands.

**Guardrail.** D1 touches `src/components/canvas.tsx`/`EditableNode.tsx`; the reskin left
`src/components/*` design-system-free on purpose (export substrate, ADR-0007). Anything D1 extracts must
import **no** design-system code — the seam stays inside `src/ir/` + `src/components/`.

---

## The deepening opportunities

### D1 — The Node Walk: one deep traversal, per-target emitters

> **✅ Implemented (2026-06-20, ADR-0008).** Promoted to `src/ir/walk.ts` (`walkNode` + `Emitter<T,C>`)
> with β split into `src/generators/leaf-style.ts` (string targets) and `src/components/layoutElement.tsx`
> (React). HTML/React/Angular, the canvas, and `EditableNode` are now adapters; MJML stays bespoke.
> Behaviour preserved (HTML/React/MJML/canvas byte-identical; Angular only reordered Button decls). The
> seam carried its first new feature — the **justify/align/wrap** layout properties — for ~one field +
> one method per adapter. The description below is retained as the original rationale.

- **Modules/files:** `src/generators/{html,react,angular}.ts` (`emitNode`/`renderNode` switches),
  `src/components/canvas.tsx` (`CanvasNode`), `src/editor/EditableNode.tsx` (`NodeInner`), and the IR
  vocabulary in `src/ir/types.ts`.
- **Problem (friction).** The dispatch over the Layout-element/Component vocabulary
  (`Stack/Row/Column/Grid/Text/Button/Image`) is re-stated in **six** places: the three web Export
  Target generators (`html.ts:41`, `react.ts:52`, `angular.ts:57`), the MJML generator (`mjml.ts:103`
  `renderLeaf` + the `renderCardSections` flattener), the `CanvasNode` preview renderer (`canvas.tsx:17`),
  and `EditableNode`'s `NodeInner` (`EditableNode.tsx:114`). Each independently encodes the same
  _decisions_ — "Stack is a flex-column", "Row wraps every child in `flex:1`", "Grid is
  `grid-template-columns: repeat(n, 1fr)`", "Button binds brand colour" — tangled with each target's
  _emission syntax_ (string vs JSX object vs Angular template vs React element). The `Row` `flex:1`
  wrapper alone is copy-pasted **five** times (`html.ts:53`, `react.ts:67`, `angular.ts:68`,
  `canvas.tsx:38`, `EditableNode.tsx:105`); MJML instead maps Row to its own sibling `<mj-section>` with
  one `<mj-column>` per child, which is exactly why it must stay out of D1.
- **Deletion test → CONCENTRATES.** Delete any one switch and that caller breaks while the identical
  decision tree still sits in the other five — duplication, not a pass-through. The decision ("what _is_
  a Stack, structurally") is one thing said six times.
- **Solution (the deep module + its seam).** Extract a `walkNode(node, emitter)` traversal plus an
  `Emitter<T>` interface (one method per node type) into `src/ir/walk.ts`. The traversal — dispatch,
  recursion, and the `Row` `flex:1` contract — lives **once**. Each caller becomes a small **adapter**
  implementing only its emission syntax: `Emitter<string>` for HTML/Angular, `Emitter<ReactElement>` for
  `CanvasNode`, and `EditableNode` wraps the same traversal with its editing chrome (drop targets,
  selection outline, drag handle). The **seam** is the `Emitter<T>` interface.
- **The reskin is corroborating evidence the seam is real.** It edited only `EditableNode`'s chrome — the
  drag handle now renders `<Icon.dots size={12}/>` (`EditableNode.tsx:88`) and the selection/drop outlines
  use chrome tokens `var(--selection)`/`var(--accent)` (lines 21-25) instead of the user's `--color-brand`
  — and left `NodeInner`'s switch (lines 114-140), the children-in-node recursion (line 94), and the Row
  `flex:1` special-case (lines 101-110) **fully intact**. The chrome already peels off the traversal
  cleanly, so extracting `walkNode` + an `Emitter<ReactElement>` adapter is lower-risk than first assumed.
- **Benefits.** _Locality:_ the IR's structural contract is stated once; a new Layout element is one
  traversal case + one method per adapter instead of a six-file hunt. _Leverage:_ `EditableNode` collapses
  from ~140 lines of mixed traversal+chrome to "wrap each child"; `CanvasNode` becomes trivial. _Tests:_
  the traversal is a pure spec tested once, rather than re-asserting "Button binds brand colour" three
  times across generators.
- **Guardrail — MJML stays bespoke (do NOT fold into D1).** The MJML generator resolves Design Tokens to
  **literals** via `makeLit` (not `var(--…)`) and **flattens** the Stack into sibling `mj-section`s — a
  leaf run becomes one section, a nested Row becomes its own section (`renderCardSections`/
  `renderRowSection`, `mjml.ts:122-184`), and `renderLeaf` actively throws on container nodes
  (`mjml.ts:115`). It solves a genuinely different problem; deleting its bespoke walk exposes no
  duplication, only breaks email. Keep it as its own emitter with its own resolver (ADR-0006). _Worth an
  ADR_ so a future review doesn't try to unify it.
- **Guardrail — no DS in the substrate.** The extracted traversal and the `Emitter<ReactElement>` adapter
  must import nothing from `src/design-system/` (ADR-0007); the chrome stays in `EditableNode`'s wrapper.
- **Unlocks:** cheap new Layout elements/Components; **canvas-a11y** — node-level roving
  `tabIndex`/`role`/`aria-label` finally has one place to live: the single `EditableNode` wrapper div
  (`EditableNode.tsx:60`) the traversal creates (the DS handle already carries `aria-label='Move node'`,
  but node-level attributes still have nowhere to attach today).

### D2 — The Design-Token Model: a queryable Theme module

- **Modules/files:** new `src/theme/design-tokens.ts` (the seam) over `src/theme/tokens.json`. Today the
  knowledge is smeared across `src/components/tokens.ts` (`tokenVar` + `styleFromTokens`), each web
  generator's resolver (`tokenToVar` + `STYLE_PROP_TO_CSS` in `html.ts`, plus the react/angular twins),
  `src/editor/literals.ts`, `src/editor/ThemePanel.tsx` (`SWATCHES`), `src/editor/palette.ts` (`create()`
  defaults), `src/editor/store.ts` (`webRoot`), and `src/ir/sample.ts`. New token-scope authorities the
  model must respect: `src/theme/style-dictionary.config.mjs` (the three emits) and
  `src/editor/Editor.tsx:38-42` (`buildOverrideCss`).
- **Problem (friction).** Design-Token knowledge is **stringly-typed, scattered, and now spread across two
  keyings**.
  - (a) The dot-path→`var(--…)` resolution is re-implemented in the three web generators _and_
    `components/tokens.ts` (`.replace(/\./g,'-')` copied each time — `tokens.ts:7`, `html.ts:7`).
  - (b) _Which_ Design Tokens exist and their **category** (colour / space / radius / typography) is
    hardcoded in **incompatible forms**: `palette.ts`/`webRoot` (`store.ts:76-96`)/`sample.ts` use
    **dot-paths** (`gap: 'space.md'` ×3); `ThemePanel`'s `SWATCHES` (`ThemePanel.tsx:8-13`) uses **kebab
    keys** (`color-brand`, a curated 4-of-6 subset) that double as `themeOverrides` keys and `baseLiterals`
    lookups.
  - (c) _Which style keys a node type accepts_ is filtered independently in every generator
    (`STYLE_PROP_TO_CSS`, `html.ts:11-16`) and in `styleFromTokens` (`tokens.ts:12-20`).
  - (d) Nothing **validates** a ref — `'color.surfce'` silently emits a broken `var()` for web and throws
    only at MJML runtime.
- **The reskin added a hard new fact the model must absorb.** The user Theme no longer owns `:root`. DS
  chrome tokens own `:root` (`chrome.css`); the user Theme is scoped to **`.ed-board-content`** via the
  second Style Dictionary output (`theme.scoped.css`), and live overrides emit `.ed-board-content { --… }`
  (`buildOverrideCss`). So `resolveVar(ref)` for the canvas resolves **under `.ed-board-content`** while
  standalone exports keep `:root` (`theme.css`). The model must own the **user** token graph **only** and
  never touch the chrome aliases. The literal `'.ed-board-content'` selector is itself hardcoded in three
  places (SD config, `buildOverrideCss`, the FrameNode class) — the model should own that constant so a
  rescope is one edit. **No module can answer "which Design Tokens are spacings?"** — the exact question
  container-style editing must ask.
- **Deletion test → CONCENTRATES.** Delete the hardcoded lists/resolvers and the knowledge reappears in ≥7
  files, each rebuilding it across two keyings; a typo'd ref has no single place to be caught.
- **Solution (the deep module + its seam).** One Design-Token Model over `tokens.json`, exposing:
  `byCategory('space'|'color'|'radius'|…)`, `isValidRef(ref)`, `resolveVar(ref)` (dot-path→kebab var name,
  with a documented contract that it is consumed under `.ed-board-content` in-editor / `:root` standalone),
  `toVarName`/`refFromVarName` (killing the ad-hoc kebab conversions and the hand-maintained `SWATCHES`
  keying), and `stylableKeys(nodeType)` (allowed style keys + each key's category). Web generators and
  `components/tokens.ts` share `resolveVar`; the email **adapter** keeps its literal resolver (D1
  guardrail); `ThemePanel`, `palette.ts`, and the **existing** Inspector tab (`RightRail` → `Inspector.tsx`)
  _query_ the model. **Invariant:** the model is the user token graph; it must not expose or touch chrome
  tokens (the golden rule, now structural rather than a convention). The **seam** sits between the IR's
  `StyleMap` contract and the targets/UI.
- **Benefits.** _Locality:_ names, categories, defaults, valid keys, and the dot-path↔kebab boundary are
  one module; adding a token in Style Dictionary makes it instantly queryable in both scopes and lets
  `ThemePanel` render `byCategory('color')` instead of hand-listing kebab keys (so adding `muted` to the
  Design Palette is a one-line token add). _Leverage:_ the existing Inspector tab builds gap/padding
  pickers from `stylableKeys(node.type)` + `byCategory('space')`, dispatching a history-coalesced
  `setNodeStyle`. _Tests:_ pure functions — assert every hardcoded default (`palette.ts`, `sample.ts`,
  `webRoot`) resolves, every `SWATCHES` kebab key exists in `tokens.literals.json`, and no chrome alias
  leaks — so a renamed token fails the suite instead of rendering blank.
- **Unlocks:** **container-style-editing** (now landing on the real Inspector tab); runtime IR validation
  on load; per-Frame overrides; a fuller Design Palette later (drop the curated `SWATCHES` subset).
- **Test it (Phase 0 is live — don't skip).** The Design-Token Model is pure: add
  `src/theme/design-tokens.test.ts` (assert `byCategory` / `isValidRef` / `resolveVar` / `stylableKeys`,
  that every hardcoded default in `palette.ts` / `sample.ts` / `webRoot` resolves, and that no chrome
  alias leaks) **and** add `src/theme/design-tokens.ts` to `coverage.include` in `vitest.config.ts`. The
  D1 seam tests (`src/ir/walk.test.ts`, `src/generators/*.test.ts`) are the pattern to copy.

### D3 — The Frame lifecycle Module + the Board↔React-Flow seam

- **Modules/files:** new `src/editor/frames.ts` + a `useFrameNodes` seam; today split across
  `src/editor/store.ts` (`createInitialFrames` :98, `setFrameTarget` :232, `moveFrame` :248),
  `src/editor/FrameNode.tsx` (the Web/Email `SegmentedControl` :34), `src/editor/Board.tsx` (React-Flow
  node seeding :24, drag write-back :40), and **three** inline email-mode checks — `Editor.tsx:162`
  (drop end), `Palette.tsx:102` (click insert), and `Palette.tsx:86` (the locked-tile `disabled` state).
- **Problem (friction).** A **Frame**'s lifecycle has no owner. Creation lives in `createInitialFrames`;
  the target medium is mutated by a DS `SegmentedControl` in `FrameNode` (`setFrameTarget`); the
  **email-mode restriction** (ADR-0006) is re-implemented inline at three sites. Notably the reskin
  changed the restriction from _hidden_ to _locked_: the Palette now keeps email-unsafe items visible but
  disabled (`Palette.tsx:86` → DS `PaletteItem disabled`/`disabledNote`), so the same
  `frame.target === 'email' && !item.emailSafe` predicate now also drives a user-facing affordance — a
  drifting copy is now a **visible** bug, not just a silent one. Position is split between
  `store.moveFrame` (`store.ts:248`) and Board's `onNodeDragStop` (`Board.tsx:40-42`). The
  Board↔React-Flow sync is **one-directional and brittle**: Board seeds nodes once (`useMemo([])`,
  `Board.tsx:24`) and only re-seeds by a full **remount** keyed on `docKey` (`<Board key={docKey}>`,
  `Editor.tsx`). There is still no place to put "add a Frame" / "remove a Frame".
- **Deletion test → CONCENTRATES.** The email-safe invariant is mandatory; delete the scattered checks and
  three callers (drop, click, locked-tile) must re-implement it (drift + a now-_visible_ bug). Delete
  Board's seed and nothing renders. Load-bearing rules with no home.
- **Solution (the deep module + its seam).** A Frame lifecycle Module owning `createFrame(target)`,
  `deleteFrame(id)` (also clearing Selection + the history coalesce key, and not stranding the Inspector
  tab on a dead frame — `rightTab` reconciliation), `setTarget` (a thin move of the existing
  `setFrameTarget`), `move`, and the single predicate `canInsertComponent(frame, item)` — consulted by
  **all three** sites, including the Palette tile's `disabled` prop. The predicate reads `emailSafe` from
  the enriched `PaletteItem` metadata (which now also carries `icon`/`group`), keeping the email rule
  co-located with the palette catalog. Separately, a `useFrameNodes()` seam owns the
  `EditorFrame[] → React-Flow node[]` mapping reactively (add/remove without a remount; position
  write-back on drag), making the `docKey` remount an internal detail.
- **Benefits.** _Locality:_ Frame rules co-locate; the email rule has one home that feeds both insert and
  the locked affordance. _Leverage:_ add/remove Frames becomes a couple of lifecycle calls, not a
  Board-remount choreography. _Tests:_ "cannot insert Grid into an email Frame", "createFrame yields a
  unique id" — tested without React or React Flow.
- **Unlocks:** **add-remove-frames**; Frame templates; strict validation on document load.
- **Test it (Phase 0 is live — don't skip).** The Frame lifecycle is pure (no React/React-Flow): add
  `src/editor/frames.test.ts` ("cannot insert Grid into an email Frame", "createFrame yields a unique
  id", "target is fixed at creation", `canInsertComponent` truth table) **and** add `src/editor/frames.ts`
  to `coverage.include` in `vitest.config.ts`. Keep `useFrameNodes` (the React-Flow seam) out of the unit
  suite — it's verified live, like the canvas/editor render path.

### D4 — The Editor history + persistence Module (hardening)

- **Modules/files:** `src/editor/store.ts` (`commit`/`undo`/`redo`), `src/editor/document.ts`, and the
  debounced auto-save `useEffect` in `src/editor/Toolbar.tsx` (lines 28-41 — Toolbar now documents itself
  as the persistence owner). _(There is no `DocumentPanel.tsx`; it never existed.)_
- **Problem (friction).** The invariant _"every change is undoable **and** auto-persisted"_ is
  **mixed-depth**: it works and reads cleanly, but it is enforced _per action_ — each mutating action in
  `store.ts` must remember to call `commit(...)` (verified: all ten document mutations do; the UI actions
  `selectNode`/`setRightTab`/`setExportTarget`/`setDropTarget` correctly do not). Add a new mutating action
  and forget `commit()` → undo silently breaks, with nothing to catch it. Persistence is a free-floating
  `useEffect` parked in `Toolbar` — load-bearing logic living in a presentation component. And the undoable
  document shape exists twice: `Snapshot` `{frames, themeOverrides}` (`store.ts:24-27`) and `EditorDocument`
  `{version, frames, themeOverrides}` (`document.ts:14-18`), kept in sync by hand.
- **Deletion test → CONCENTRATES (mildly).** Remove `commit()` and history vanishes from every action;
  remove the Toolbar effect and the persist need reappears at load. The invariant isn't negotiable.
- **Solution.** A history-aware dispatch so document mutations are pure transforms over
  `{frames, themeOverrides}` and one module records history + schedules persistence — making "undoable +
  saved" structural rather than a per-action ritual, and lifting the save effect out of `Toolbar` (which
  keeps only the 'saved'/'saving' presentation). **The reskin already proved the boundary this module must
  encode:** `rightTab` is store state but is deliberately excluded from `Snapshot` (`store.ts:13`), i.e. UI
  state must never enter history — and `selectNode`/inserts now thread `rightTab='inspector'` through the
  same `set()` as the document mutation (`store.ts:136,151`), so a history-aware dispatch should cleanly
  separate "document transform" from "UI side-effects". Make that an explicit rule, with the test
  "switching the right-rail tab creates no undo step." Lower urgency than D1–D3 (it functions today); do it
  once the action set grows.
- **Benefits.** _Locality:_ coalescing, history limit, and debounce-save in one place — not split between
  `store.ts` and a Toolbar effect. _Tests:_ coalescing, the document/UI split, and persistence timing
  tested without zustand/React. _Leverage:_ named checkpoints and multi-field grouped undo become local
  additions; a single `Snapshot`-as-`EditorDocument` shape removes the two-place drift.
- **Unlocks:** robustness as the action set grows; future checkpoints.

### Minor / deferred

- **DropManager** (`computeTarget` in `Editor.tsx`): already concentrated (extracted during the reorder
  work) — a single source of truth for before/after/inside. Leave as-is; revisit only if drop rules
  multiply.
- **`Row` `flex:1` wrapper**: folds into D1 (becomes the traversal's one `Row` case).
- **DS ref-wrapper pattern (watch, low urgency).** DS function components don't forward `ref` under
  React 19, so dnd-kit's `setNodeRef` sits on a native wrapper while listeners/attributes/onClick spread
  onto the DS component — duplicated in `Palette.tsx:110-125` (PaletteTile) and `EditableNode.tsx:70-78`
  (handle). Deletion test passes (the decision survives in the other site), so a tiny `useDsDraggable`
  helper is worth a note; fold in when a **third** site appears.
- **Explicitly considered and rejected (do not re-flag).** `editor.css` `--ed-*`→DS-token aliasing is a
  single intentional bridge layer (one place, not duplication). The two `localStorage` keys
  (`easydesign:document:v1` in `document.ts` vs `easydesign:theme` in `useDarkMode.ts`) are distinct
  concerns — document persistence vs chrome dark-mode preference (chrome-only, ADR-0007). Both fail the
  deletion test; leave them.

---

## How the requested features land on these seams

| Feature                                                        | Sits on                                                  | Work once the seam exists                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **add/remove Frames**                                          | **D3** (Frame lifecycle + `useFrameNodes`)               | `createFrame`/`deleteFrame` actions; a "+ Frame" control in the **Toolbar** (`src/editor/Toolbar.tsx`, which already owns the global-action row) or as a Board overlay — there is **no Document panel**. React-Flow reflects add/remove reactively (no remount). A Frame delete also clears Selection/history coalescing and reconciles `rightTab`. Per-Frame remove/target can also live in the Inspector tab.                                                                                                                                                                     |
| **container style editing** (gap/padding Design-Token pickers) | **D2** (Design-Token Model) + the **existing Inspector** | The Inspector already exists (`src/editor/Inspector.tsx`, a DS `PanelSection`/`Input`/`Badge` tab; selection routes to it via `store.selectNode` → `rightTab='inspector'`, `store.ts:136`). The feature only adds a "Layout/Spacing" `PanelSection`: ask `stylableKeys(node.type)` → render a picker per key; spacing keys list `byCategory('space')`. The Design tab (`ThemePanel.tsx`, DS `Swatch` rows) is the precedent to copy. A new `setNodeStyle(frameId, path, key, ref)` store action (history-coalesced like text edits). No hardcoded token names, no new panel chrome. |
| **canvas keyboard a11y**                                       | **D1** (Node Walk) + new `useCanvasA11y`                 | A `useCanvasA11y(frameId, path)` hook supplies roving `tabIndex`/`role`/`aria-label` and arrow-key tree navigation, Enter (edit), Delete (remove) — attached at the single traversal site D1 creates (the `EditableNode` wrapper, `EditableNode.tsx:60`). This finally lets the `src/editor/**` `jsx-a11y` relaxation — still present, exactly two rules (`click-events-have-key-events`, `no-static-element-interactions`, `eslint.config.mjs:142-148`) — be **removed** (it masks this gap, not a false positive).                                                                |

---

## Suggested sequence (dependency-ordered)

**Phase 0 — Make it testable.** ✅ **Done.** `vitest` is configured (`vitest.config.ts`, `npm run test`)
with a first suite against the D1 seam (`walkNode`/`shapeOf`), the β table (`leaf-style`), and golden
snapshots of all four generators. Extend it as each further deepening lands — the deep modules are pure;
the interface is the test surface.

**Phase 1 — Deepen the seams the features need.**

1. **D1 Node Walk** — lowest risk, biggest duplication relief; keep MJML separate (+ ADR); no DS imports
   in the substrate.
2. **D2 Design-Token Model** — unblocks container editing; retires the most-scattered knowledge; owns the
   user (`.ed-board-content`) token graph only.
3. **D3 Frame lifecycle + `useFrameNodes`** — unblocks add/remove Frames; `canInsertComponent` becomes the
   one home for the email rule (insert guards + the locked-tile affordance).

**Phase 2 — Build the features on the new seams.** (The right-rail tabs scaffolding — `RightRail.tsx` +
`rightTab` in `store.ts` — already ships, so the UI side of #5 is mostly token-picker rows in the existing
Inspector, not new panel chrome.)

4. **add/remove Frames** (on D3; "+ Frame" in the Toolbar).
5. **container style editing** (on D2 + the existing Inspector tab).
6. **canvas keyboard a11y** (on D1 + `useCanvasA11y`); then delete the two-rule `src/editor/**`
   `jsx-a11y` relaxation.

**Phase 3 — Hardening.**

7. **D4** history+persistence module once the action set has grown — note its auto-save lives in
   `Toolbar.tsx:28-41` (not a `DocumentPanel`), and `rightTab` must stay out of history.
8. Tests at each new interface; the ADR for "MJML is intentionally not part of the Node Walk".

---

## ADR follow-ups to consider

- **MJML stays bespoke** — record that the Node Walk (D1) deliberately excludes the email Export Target
  (literal resolution + tree flattening, ADR-0006), so future reviews don't re-suggest unifying it.
- If D3's `canInsertComponent` becomes the _only_ enforcement point for the email-mode restriction, note
  it against ADR-0006. The reskin gives this a UI consumer: the Component Palette now renders email-unsafe
  items **locked** (`Palette.tsx:86`, the DS `PaletteItem disabled` predicate) rather than hidden, and that
  disabled check plus the inline insert guards (`Palette.tsx:102`, `Editor.tsx:162`) should all derive from
  the single `canInsertComponent` predicate so the rule has one home.
- **Token scoping is structural, not a convention** — D2's model owns the user DTCG graph only; chrome
  tokens (`:root` via `chrome.css`) are out of scope (golden rule, ADR-0007). Worth recording so a future
  pass doesn't fold the two token worlds together.

_Next step (per the skill): pick a candidate (D1–D4) to drop into a design/grilling conversation — we'd
walk the interface options for the deep module (Design It Twice), what sits behind the seam, and which
tests survive. D1 or D2 are the highest-leverage starting points._
