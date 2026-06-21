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
  implemented hiding was dead code with zero callers, and the `emailSafe` JSDoc read "hidden in email
  Frames". **Both removed/corrected in D3** — `paletteFor` is deleted and the rule now lives only in
  `frames.ts` (`canInsertComponent`/`canInsertInTarget`).

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

> **✅ Implemented (2026-06-20).** `src/theme/design-tokens.ts` (`catalog`: `get`/`byCategory`/`resolveVar`/
> `resolveLiteral`/`withOverrides`/`fromKebab` + `STYLE_KEYS`) over a build-generated `tokens.catalog.json`
> (4th Style-Dictionary output; `categoryOf` shared via `token-category.mjs`). All five cruxes shipped as
> decided: build-step catalog (a); Model owns literal resolution, `literals.ts` deleted (b); **dot keying
> collapsed atomically** with the 3-leg gate — `buildOverrideCss`→`cssVarName`, MJML via `withOverrides`,
> `fromKebab` load-shim — and `color.onBrand` canonicalized (c); scope-blind (d); flat `STYLE_KEYS` (e).
> Consolidated `tokenVar`×2 + `styleFromTokens`/`CONTAINER_STYLE_PROP` + `makeLit`; ThemePanel now shows
> all 6 colors via `byCategory`. Generators **byte-identical** (snapshots held); the `onBrand` `.replace`
> bug is closed by construction. Verified live: re-theme, MJML override, kebab→dot migration. The
> description below is retained as the original rationale.

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
- **Test it. ✅ Done.** `src/theme/design-tokens.test.ts` (get-as-validation, `byCategory`, `resolveVar`
  camelCase-correctness, `resolveLiteral`, `withOverrides`, `fromKebab`, `STYLE_KEYS`, the `createCatalog`
  fixture seam) + `src/theme/token-category.test.ts`; both modules added to `coverage.include`. Suite at
  43 tests / 99% stmts / 92% branch.

#### D2 design cruxes (to grill later)

These are the open interface decisions for the Design-Token Model — captured here to grill in a later
session. (A "Design It Twice" run produced four candidate interfaces + a comparison — digest after the
cruxes.) **Post-D1 reality:** the dot→CSS resolver is already down to **two** `var` copies
(`components/tokens.ts:7`, `leaf-style.ts:18`) plus MJML's `makeLit` literal path — D1 merged the three
generator resolvers. The headline gap is that **no module can answer "which Design Tokens are
spacings?"**, which is what blocks the gap/padding pickers. Candidate interface surface: `byCategory(cat)`
· `categoryOf(ref)` · `isValidRef(ref)` · `resolveVar(ref)` · `resolveLiteral(ref)?` · `styleKeys()`.

- **(a) Catalog source. ✅ RESOLVED (grilled 2026-06-20) — BUILD-STEP generated catalog.** Extend Style
  Dictionary to emit `tokens.catalog.json` — an array of `{ref (dot), category, cssVarName, literal}`
  keyed by the dot-ref — and the Model indexes that (no runtime DTCG parse). **Deciding premise:** the
  token graph will likely grow DTCG aliases / semantic tokens (e.g. `color.primary: {color.brand}`),
  which runtime-parse would have to re-resolve itself; SD already resolves them. Build-step is also what
  makes (c)'s `onBrand` fix correct — SD owns the camelCase-aware `name/kebab`, so the catalog's
  `cssVarName` (`--color-on-brand`) can't drift and we never hand-roll `.replace`. **Confirms & enables
  (c):** the catalog is keyed by the dot-ref (= (c)'s identity), and kebab lives only as the SD-derived
  `cssVarName` field. _Sub-decisions locked:_ (i) the catalog **subsumes `tokens.literals.json`** — it
  carries `literal` per entry, so `literals.ts` + `literalsWithOverrides` collapse into
  `catalog.withOverrides` (this **is** (c)'s regression-gate leg 2); net generated files stay 3→3.
  (ii) `categoryOf($type, path)` (the `dimension → space|radius|font` disambiguation) is a **shared pure
  function** imported by both the SD format and app validation — typed + unit-tested once, not buried in
  the `.mjs`. _Note:_ runtime-parse stays the right call only if the token graph is ever frozen as a flat
  literal list (no aliases) — not the expectation for a theming tool (ADR-0004).
- **(b) Literal-resolution ownership. ✅ RESOLVED by corollary of (a)-subsume.** The catalog carries
  `literal` per entry and owns `withOverrides`, so the Model **owns literal resolution**: `mjml.ts`'s
  `makeLit` becomes `resolveLiteral(ref)` over the catalog and `editor/literals.ts` collapses in. MJML's
  **flatten** (`renderCardSections`/`renderRowSection`) stays bespoke (ADR-0008) — the catalog hands MJML
  per-leaf literals only, never tree shape.
- **(c) dot↔kebab keying. ✅ RESOLVED (grilled 2026-06-20) — COLLAPSE TO DOT, atomically.** Make the IR
  dot-path the ONE true ref; migrate `themeOverrides` / `SWATCHES` / `buildOverrideCss` / persistence to
  dot **inside the D2 commit** (not staged). The bridge (`toKebab` / `fromKebab`) is **rejected**:
  permanent dual keying, it leaks the boundary D2 exists to delete, and it doesn't even save the `onBrand`
  fix (its `toKebab` must be SD-correct anyway). Risk today is **trivial** — only the `themeOverrides`
  _keys_ are kebab; the design structure (every `StyleMap`) is already dot, and the only persisted state
  is the dev's localStorage scratch + exported JSON. **Canonical ref mirrors `tokens.json` 1:1**, so the
  `onBrand` ref is `color.onBrand` (catalog derives `--color-on-brand`); fix `mjml.ts:77`'s `color.on-brand`
  cheat as part of the same change. "Single-keyed" means dot is the **identity**; kebab survives only as
  the catalog's derived `cssVarName` field (SD-computed, camelCase-correct), so the `.replace(/\./g,'-')`
  dies in all three files. See the three-leg regression gate below.
- **(d) Scope awareness. ✅ RESOLVED (grilled 2026-06-20) — SCOPE-BLIND.** `resolveVar('space.md')` →
  `'var(--space-md)'`, never a selector. This is **forced**, not a preference: a CSS `var()` _reference_
  is scope-invariant (it resolves against wherever it's used); scope lives only in the _declaration
  block's selector_, which `resolveVar` never emits. The selector is owned by the three places that emit
  blocks — SD config (`theme.css @ :root`, `theme.scoped.css @ .ed-board-content`), `buildOverrideCss`,
  and `FrameNode`'s class — **never the Model** (`.ed-board-content` is editor-chrome knowledge, not token
  knowledge; putting it in the Model is the ADR-0007 smell the rejected frozen-index design committed).
  Holds under per-Frame overrides / dark variants too (the editor's override-emitter picks the selector,
  the Model still just resolves refs). _Adjacent (non-Model, optional) tidy:_ hoist the `.ed-board-content`
  literal to one **editor** constant shared by `buildOverrideCss` + `FrameNode` — do it opportunistically
  when (c)'s `buildOverrideCss` change touches that line.
- **(e) `stylableKeys` granularity. ✅ RESOLVED (grilled 2026-06-20) — FLAT table.** A flat
  `Record<styleKey, category>` (`background→color, padding→space, borderRadius→radius, gap→space`),
  understood as the **container style keys** (consolidates `styleFromTokens` + `CONTAINER_STYLE_PROP`).
  Leaf-exclusion (e.g. `gap` never offered on a `Text`) comes from the **Inspector's existing
  container-gate**, not the table; the generators apply the table as a harmless filter (a leaf with
  `borderRadius` is fine). The `key→category` mapping is **global truth** (`gap` is always `space`), so
  only a per-node _set_ could ever vary → flat→per-node is a cheap local refactor, deferred until its real
  trigger: **user-editable `Text` color/`fontSize`** via the IR (then add `stylableKeys(nodeType)`).
  D2's token pickers are a **new** Inspector group (token-bound style), complementary to the existing
  keyword Layout controls (Distribute/Justify/Align/Wrap are props, not tokens), in the same
  container-gated panel.

**Candidate interfaces (Design It Twice — digest, 2026-06-20).** Four designs were generated and judged;
the run **agreed with every lean above** ((a) generated catalog · (b) own literal resolution · (c)
collapse to dot · (d) scope-blind). The menu:

| Design                       | Shape                                                                                                                    | Keying                   | Resolution seam                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------ | ---------------------------------------------------------------------- |
| **Catalog (minimal)** ★      | one self-describing `Token` {ref, category, var, cssVarName, literal} + `get()`; `get()===undefined` **is** `isValidRef` | collapse to dot          | none — `resolveVar`/`resolveLiteral` are thin projections over `get()` |
| Category-registry (flexible) | `byCategory` + pluggable `resolveFor(target)` / `registerTarget`                                                         | collapse to dot          | runtime plugin registry (unpaid-for surface; no 3rd target exists)     |
| Frozen index (common-caller) | two hot calls (`resolveVar`=Map.get, `byCategory`=bucket) + public `toKebab`/`fromKebab`                                 | **bridge (keeps kebab)** | two baked fields; also puts `SCOPE_SELECTOR` inside the Model          |
| Ports & adapters             | `resolve(ref, renderer)` + `webVar`/`emailLiteral` 1-line adapters                                                       | collapse to dot          | one real 2-adapter port, audited honestly                              |

**Verdict (to grill): ship the minimal `Token` catalog interface**, and adopt the ports design's
_explicit two-adapter audit_ as its written justification (source port collapsed = 1 adapter =
indirection → plain `createCatalog(entries)`; resolution is the real 2-adapter seam, realized as two
thin projections, **not** a `TokenRenderer` interface or a `registerTarget` plugin). **Reject** the
frozen-index design's public `toKebab`/`fromKebab` and its in-Model `SCOPE_SELECTOR` (the latter names
the chrome/canvas selectors _inside_ the token Model — an ADR-0007 smell). Flat `STYLE_KEYS` table
(`background→color, padding/gap→space, borderRadius→radius`); `byCategory` powers ThemePanel swatches
**and** the Inspector pickers; `literals.ts` collapses to a thin re-export.

**Non-negotiable regression gate (LOCKED — atomic, all THREE in the D2 commit).** The grill found a third
leg the first digest missed. The collapse to dot is safe _only if_ all of these land together:

1. **`buildOverrideCss`** switches `--${key}` → `--${catalog.get(ref).cssVarName}` — else the live canvas
   re-theme silently emits invalid `--color.brand:` and stops working (it's also a strict bug fix: the
   var name now always comes from SD, never a hand-typed kebab key).
2. **`literalsWithOverrides` / the MJML export path** stops doing `{ ...kebab baseLiterals, ...dot
overrides }` (which would merge as _separate_ keys → `makeLit` finds the base, silently ignores the
   live override) and routes through the catalog's dot-aware `withOverrides`.
3. **`loadFromLocal` AND `loadDocument`** (the JSON-import path too) get the one-line `fromKebab` shim —
   else saved kebab themes drop on load.

Miss any one → a _silent_ break (dead canvas re-theme, stale MJML export, or lost themes).

**Latent bug the catalog fixes (confirmed; canonical ref locked to `color.onBrand`).** `color.onBrand` → today's `.replace(/\./g,'-')`
(in 3 files) → `--color-onBrand`, but Style Dictionary emits `--color-on-brand`. Hidden only because no
`StyleMap` ref or swatch uses `onBrand` (mjml.ts hand-writes `color.on-brand`). The moment a user binds
`background: color.onBrand` — which `byCategory('color')` will now offer — the naive `.replace` ships a
broken `var()`. The catalog's SD-derived `cssVarName` closes it permanently: the decisive reason
build-step source (crux a) beats runtime-parse.

### D3 — The Frame lifecycle Module + the Board↔React-Flow seam

> **✅ IMPLEMENTED (2026-06-20, ADR-0011).** `src/editor/frames.ts` (pure: `TARGET_PROFILES`,
> `canInsertComponent`/`canInsertInTarget`/`insertHint`, `createFrame`/`deleteFrame`/`moveFrame`/
> `nextSlot`, injected `MintId`) + `frames.test.ts` (11 tests, in `coverage.include`). Seam
> `src/editor/useFrameNodes.ts` reconciles the React-Flow node list against the store off a cheap
> `id:x:y` signature — add/remove/move/undo with **no remount** (live-verified: undo dropped a Frame
> with a byte-identical viewport transform). Store gained `addFrame`/`removeFrame`/`renameFrame`/
> `selectFrame` and routes `moveFrame` through the module; **`undo`/`redo` no longer bump `docKey`**
> (load/reset still do → `fitView` on a fresh document only).
>
> **Decisions locked.** (1) **Target FIXED at creation** — `setFrameTarget` + the header Web/Email
> `SegmentedControl` are deleted; the medium is a read-only label that _drives the Palette_ (via the
> selected Frame's target) but is never toggled, closing the web→email-with-Grid → broken-MJML hole
> (ADR-0006). New Frames are minted via a Board `+ Web page` / `+ Email` panel. (2) **Module shape:**
> the simpler pure functions returning `{frames, created}` / `{frames, removed}`, with the store doing
> Selection reconciliation (chosen over a heavier `FrameMutation` object — `deleteFrame` has one
> caller, so it doesn't concentrate). (3) **Frame chrome** (per user): thin 1px **dashed** body, title
> label top-left = the React-Flow `dragHandle` **and** the select affordance, read-only medium label
> top-right — no window titlebar. Frame-level Selection = `selectedFrameId` set + `selectedPath: null`
> → a Frame Inspector panel (editable title via `renameFrame`, read-only medium, Delete frame). All
> **four** email-rule sites (Palette tile `disabled`, Palette click guard, Palette locked note, Editor
> drop guard) now route through `canInsertComponent`/`insertHint`. Green: typecheck · eslint · 54
> vitest (98.7% stmt) · `generate` · build · live browser pass.
>
> **Post-review (13 confirmed findings, all minor/nit) addressed.** Deleted dead `paletteFor`; unified
> the Inspector node badge on `TARGET_PROFILES[].label`; corrected the `emailSafe` JSDoc; softened the
> `nextSlot` comment; dropped the unused `data-target`; added the `moveFrame` unknown-id test. **Both
> deferred follow-ups now done:** (a) an **import-time audit** — `frames.ts` `isEmailFrameClean` +
> `EMAIL_UNSAFE_TYPES` (kept in sync with the Palette by a test), consulted in `isEditorFrame`, rejects
> an email-unsafe node in an email Frame on load/import (verified: a Grid-in-email doc is rejected,
> Grid-in-web accepted); (b) **pan-to-new-Frame** — `pendingFocusFrameId` + a `ViewportFocus` child
> `setCenter`s on a newly-added Frame, zoom preserved (verified live). 60 tests green.

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

> **✅ IMPLEMENTED (2026-06-20, ADR-0012).** Pure `src/editor/history.ts` (reducer over `DocumentBody`:
> `record`/`undo`/`redo`, coalesce + redo-clear + 100 cap; `history.test.ts`, 10 tests). Store rewritten
> around a single internal **`mutate(coalesceKey, edit)` funnel** (the one path for all 13 document
> mutations; `edit` is a pure `(doc, state) => {body, ui?} | null`) + a **denormalised present**;
> `commit()`/`Snapshot` deleted; `loadDocument`/`resetDocument`/`undo`/`redo` use the reducer directly.
> `document.ts` gained `DocumentBody` (+ `EditorDocument extends` it, `toDocument(body)`) and one
> `parseDocument()` pipeline (validate incl. ADR-0006 email audit, then D2 migrate) on both load paths;
> version stays 1, persisted format unchanged. **`usePersistence()`** hook (mounted once in `Editor`) owns
> the debounced save + transient `saveStatus`; Toolbar lost its autosave effect and just renders status.
> Decisions locked & built: (a) `mutate` funnel + pure reducer, **denormalised** present (zero selector
> ripple); (b) **hook** persistence (not store-subscribe/agnostic-module — keeps store + history.ts pure);
> (c) `DocumentBody` unifies the shape; (d) one `parseDocument`, **keep v1**; (e) **keep** clearing
> selection on undo. The 17-test regression net (written first) stayed green through the rewrite — proving
> behaviour preservation. Green: typecheck · eslint (0 warn) · 87 vitest (99.2% stmt) · generate · build ·
> live (Saving→Saved on edit, undo/redo, reload round-trips persistence, no console errors). _Deferred:_
> restore-selection-on-undo; a `version` 1→2 migration when the saved shape actually breaks.
>
> **Post-review (7 findings, all nit).** Addressed: documented `history.ts`'s by-reference snapshot
> immutability contract; fixed the stale `commit()` comment in `frames.ts`; added a `renameFrame` no-op
> guard (unknown id / unchanged title → no entry); added a history test for "same-key edit right after
> undo starts a fresh step"; and made `usePersistence` **StrictMode-robust** (a last-seen-body compare
> replaces the first-run flag that React StrictMode's dev double-invoke defeated, which had caused a
> spurious save-on-load — pre-existing from the old Toolbar). Live-confirmed: fresh load no longer flashes
> "Saving…", real edits still save. 88 tests green.

> **Design cruxes — grilled & resolved (2026-06-20, post-D3).** _Refresh:_ the per-action `commit()` surface grew to
> **thirteen** document mutations (D3 added `addFrame`/`removeFrame`/`renameFrame`); seven UI actions
> (`selectNode`/`setRightTab`/`clearSelection`/`setDropTarget`/`selectFrame`/`clearPendingFocus`/`setExportTarget`)
> correctly don't commit. A **regression net now exists** — `src/editor/store.test.ts` (17 characterization
> tests) pins the coalescing keys, the `{frames, themeOverrides}` Snapshot, undo-clears-selection, the
> redo-stack-clear, and the 100-entry cap — so D4's refactor can be proven behaviour-preserving.
> `document.ts` also grew a **second** load transform (`isEmailFrameClean`, D3) beside `withMigratedOverrides`
> (D2), so the load→validate→migrate pipeline is now D4's to unify.
>
> - **(a) Dispatch shape** — how "undoable + persisted" becomes unforgettable: a `mutate(coalesceKey, transform)`
>   store helper over a pure `history.ts` module (actions compute only a pure `doc → doc` transform) vs a
>   zustand middleware vs a Redux-style reducer+command enum. Sub-crux: keep the present **denormalised**
>   (top-level `frames`/`themeOverrides`, no selector ripple) vs **derive** it from `history.present` (true
>   single-source, ripples to every `useEditor(s => s.frames)`). _Lean: `mutate()` + pure module, denormalised present._
> - **(b) Persistence home** — lift the 400ms autosave out of `Toolbar`: a store-level subscribe+debounce
>   owning a `saveStatus` field (Toolbar just renders it) vs a dedicated `usePersistence` hook vs leave it.
>   _Lean: store-level; contestable because it puts a timer + localStorage in the store module._
> - **(c) One document shape** — extract `DocumentBody = {frames, themeOverrides}`; `Snapshot` IS
>   `DocumentBody`, `EditorDocument = DocumentBody & {version}`. _Lean: yes (removes the hand-sync)._
> - **(d) Load pipeline + versioning** — fold the two load transforms into one `load(raw) → {ok,doc}|{error}`;
>   bump `version` 1→2 (dot-keyed, explicit migrations) vs keep v1 + lenient normalisation. _Lean: keep v1._
> - **(e) Selection on undo** — undo/redo currently CLEAR selection (it's out of Snapshot); keep vs restore
>   the selection at each history point. _Lean: keep clearing; "restore selection" is a later enhancement._
> - **Scope** — D4 is hardening, not a feature unblock. _Lean: do (a)+(b)+(c); defer (d)'s versioning; (e) is one line._

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

4. ✅ **add/remove Frames** — done in D3 (Board `+ Web page`/`+ Email` panel; `addFrame`/`removeFrame`).
5. ✅ **container style editing** — done (2026-06-20). `setNodeStyle(frameId, path, key, ref)` store action
   through the D4 `mutate()` funnel (coalesced per `style:frame:path:key`, `''` clears); the Inspector's
   container-gated **Style** `PanelSection` renders a DS `<Select>` per D2 `STYLE_KEYS` entry, options from
   `catalog.byCategory` + a "Default" clear. Live canvas preview (via `components/tokens.ts`) + undo +
   autosave. Tests in `store.test.ts`. No hardcoded token names, no new panel chrome.
6. ✅ **canvas keyboard a11y** — done (2026-06-20). `src/editor/useCanvasA11y(frameId, path, node)` gives the
   `EditableShell` wrapper `role="treeitem"`, a roving `tabIndex`, `aria-label`/`aria-selected`, and
   `onKeyDown` (Enter/Space select · Delete/Backspace remove · Escape deselect · Arrow Up/Down walk the tree
   in document order via the new pure `flattenPaths`). Props applied **explicitly** (jsx-a11y is static), the
   click handler stays for the mouse, and the **two-rule `src/editor/**` `jsx-a11y` relaxation is deleted\*\* —
   lint passes clean. Verified live (Enter/Arrow/Delete/Escape + ARIA).

> **Post-review (both features, 14 findings — 2 major, rest minor/nit) addressed.** (1) **Style picker is
> now target-aware** — an email Frame offers only the keys MJML honours (`background`/`padding`, root Stack
> only), so a live-preview edit can't silently vanish on email export (ADR-0006); web keeps all four.
> (2) **Valid ARIA tree** — each Frame body is `role="tree"`, nodes carry `aria-level` + `aria-expanded`
> (containers) + `aria-selected` (selected only). Plus: `setNodeStyle` gained the container guard +
> value-equality no-op (matches `setLayout`); keyboard Delete now lands focus on the parent and Backspace no
> longer browser-navigates; Arrow ←/→ step parent/first-child; Image/empty `aria-label`s; options hoisted;
> deeper `flattenPaths` tests. **Deferred (noted):** a `style` ref absent from the catalog (only via
> hand-edited JSON) shows "Default" in the Select — the real fix is import-time style-ref validation
> (a stale ref already throws in `resolveVar` on export), a separate hardening. 95 tests green.

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
