# Refactoring Plan — toward a well-tested, easily-extendable EasyDesign

_Last updated: 2026-06-21. Produced by `/improve-codebase-architecture` (architecture review) +
a follow-up extensibility/typography research pass._

## Why this document exists

The architecture is settled (fifteen ADRs) and the editor MVP works end-to-end. The next phase is
**building more functionality on top** — concretely:

- **Capability A — add more React Aria Components** to the Component Palette / editor / exporters
  (today the palette is a small fixed set: Stack/Row/Column/Grid + Text/Button/Image).
- **Capability B — a real typography system** (today it is literally `variant: 'h2' | 'body'` with
  font sizes, weights, and line-heights hardcoded as raw literals — see §Appendix B).

The goal of this refactor is **not** to add those features yet. It is to reshape the seams so that
when we do, each addition is **a small, compiler-guarded, test-covered change** rather than a
12-to-17-file scavenger hunt. Every candidate below is justified by the **deletion test** (would
removing the module make complexity vanish, or reappear concentrated across N callers?) and measured
by **depth** (a lot of behaviour behind a small interface), **locality** (change/bugs/knowledge
concentrate in one place), and **leverage** (one implementation pays back across N call sites + M
tests).

## How to use this document

The plan is **eight candidates**, each written to be grilled and implemented **in its own session**.
Every candidate section is self-contained: Files, Problem (in deep/shallow terms), Evidence
(`file:line`), Proposed direction (plain English — the exact interface is left for the grilling
session, _not_ pre-decided here), Benefits (locality / leverage / tests), Tests that become possible,
Dependencies, ADR touchpoints, and Open questions to resolve during grilling.

**Read §1 (the crux) and §2 (the map) first**, then grill candidates in the §4 recommended order.
Architecture vocabulary follows `.claude/skills/improve-codebase-architecture/LANGUAGE.md`
(module / interface / depth / seam / adapter / leverage / locality). Domain vocabulary follows
`CONTEXT.md` (Frame, Component, Layout element, Node Walk, Design Token, Theme, Preview width,
medium / email-safe, Export Target, Selection).

---

## 1. The crux (root cause, stated once)

EasyDesign has **two genuinely deep modules, and they are healthy** — but they own only two of the
four things the IR node tree needs an owner for. **Two more modules are simply _missing_; their
absence is the whole refactor.**

**The two healthy modules — leave them alone:**

- **The Node Walk** (`src/ir/walk.ts`, ADR-0008) owns **structural traversal** — one 7-way `walkNode`
  switch + one `shapeOf` switch + a 5-method `Emitter<T,C>` interface, shared by
  HTML/React/Angular/canvas/editor. Delete it and the structural dispatch reappears across all five
  renderers.
- **The Design-Token Model / Catalog** (`src/theme/design-tokens.ts`, D2 / ADR-0004) owns **theming
  resolution** — one queryable catalog (`get` / `byCategory` / `resolveVar` / `resolveLiteral` /
  `withOverrides`) over the Style-Dictionary output, dual-compiled to CSS vars (web) and literals
  (email). Deep and clean — but it must _grow_ (additive primitive tokens — see RP-3/RP-4).

**The two missing modules — this refactor builds them:**

| Axis         | Owns                                                                                 | Status                | Candidate |
| ------------ | ------------------------------------------------------------------------------------ | --------------------- | --------- |
| traversal    | which children recurse, the Stack/Row/Column/Grid α-facts                            | healthy               | ADR-0008  |
| theming      | dot-ref → CSS var / literal, dual output                                             | healthy               | ADR-0004  |
| **identity** | per-_type_ facts: kind, email-safety, label, icon, defaultProps, controls, styleKeys | **missing → smeared** | **RP-2**  |
| **editing**  | per-_operation_ tree mutations: insert / move / delete / setProps / setStyle         | **missing → smeared** | **RP-1**  |

The two missing modules are keyed on **different axes** — identity on the node _type_, editing on the
_operation_ — which is why RP-1 depends on nothing and RP-2 is the keystone the read-side hangs off.
They are two single-responsibility modules, not two faces of one.

**(1) The identity smear (RP-2).** Every fact about a node _type_ that isn't structural traversal
leaks out of `walk.ts` into ~12 shallow sites that each re-encode the type list — _is-container?
is-email-safe? label? icon? default props? which Inspector controls? which style keys?_ — re-derived
inline at `paths.ts`, `frames.ts`, `palette.ts`, `Inspector.tsx`, `useCanvasA11y.ts`, and the five
emitters. Of these, **only two are compiler-enforced** (`walkNode`/`shapeOf` in `walk.ts`,
`structuralDecls` in `leaf-style.ts`). **Adding a Component = touch ~15 files, silently miss ~8** (no
compile error; it renders blank or drops out of email silently).

> **Locality is not safety.** Collapsing 12 sites to "one descriptor row" is a _locality_ win; it does
> **not**, by itself, turn _silent_ into _compiler-caught_ — a forgotten row or an unwired per-target
> renderer is still silent. Safety comes from **keying the descriptor off the union**: type it
> `Record<Node['type'], Descriptor>` so a missing row is a _build_ error, and back the per-target
> renderers with `Record<LeafType, Renderer>` (the §5.1 / RP-9 completeness lever) so a forgotten
> renderer is a _build_ error too. **Boundary rule:** the descriptor owns only facts the type system
> _cannot_ express (label, icon, emailSafe, defaultProps, controls, styleKeys); structural facts
> (container-ness, children-shape, axis) stay **union-derived** — never a hand-authored `kind` field
> that can drift from `walk.ts`. The descriptor _complements_ the deep module, it never _mirrors_ it.

**(2) The editing smear (RP-1).** All **7 document-mutating actions** in `store.ts` repeat
`structuredClone(frame.root)` → `nodeAt(root, path)` → splice/mutate →
`doc.frames.map(f => f.id === id ? {...f, root} : f)`, with the tricky invariants (`moveNode`'s
index-adjust, the `isPrefix` subtree guard, the root-delete guard, the Grid-`wrap` rule) inline in
untested bodies — `moveNode` / `deleteNode` have **zero unit tests**. This smear is _type-agnostic_:
it hangs off the _operation_, not the node type, which is exactly why it is a second module, not a
face of the first.

**The typography sub-problem (Capability B).** A _variant → token binding_ is an identity fact too,
but with an extra defect the other node-kind facts don't have: it is **not tokenized**. `h2`'s
`lineHeight '1.25'` and `fontWeight '700' / '600' / '400'` are **raw literals the Theme can never
reach**, triplicated across `leaf-style.ts`, `mjml.ts`, and the canvas component layer. **The disease
is non-tokenization; triplication is only the cost-multiplier.** The fix (RP-3): grow `tokens.json`
with the missing _primitive_ tokens (weight / line-height / letter-spacing — purely additive,
decoupled from RP-2, do first), then author the closed **Heading set** as DTCG **composite `typography` tokens whose sub-values _alias_
those primitives** (`heading.h2 = { fontSize:'{font.size.lg}', fontWeight:'{font.weight.bold}', … }`).
Style Dictionary's `expand` fans each composite out to per-property values — web `var()` + email
literals — and the `TextStyle` union is **codegen'd from the token graph** (the binding table is a
_generated_ artifact, not hand-authored). This keeps DTCG / Figma / Tokens-Studio interop **and**
compile-time safety. Acceptance test = the re-theme round-trip: editing one primitive re-themes `h2` in
web preview **and** in MJML export. (Composite was briefly rejected on the theory SD only flattens it —
but that flattening _is_ the intended `expand` seam; the alias-survives-`expand` web path is a 1-hr
gating spike, see RP-3.) The split is **Heading styles** (a closed, themed, named
set the user picks whole) vs **Free-form text** (the user picks size/weight **constrained to the type
scale, never arbitrary px**). The chrome design-system's
`Families → Weights → Scale → LineHeight → LetterSpacing → Semantic` _layering_ is the template, but
its values are re-authored for the user Theme — chrome tokens never bleed in (ADR-0007).

---

## 2. Capability → Enabler map

Which candidates must land before each named feature, and why (with `file:line`).

### Capability A — "Add more React Aria Components"

Adding one leaf Component today touches **~15 sites; only 2 fail to compile if forgotten** (see
Appendix A). The silent sites: `html.ts`, `react.ts`, `angular.ts` emitters; `mjml.ts:87` `renderLeaf`
(throws at runtime, doesn't compile-fail); `leaf-style.ts:72-120` (`textDecls`/`buttonDecls`/`imageDecls`
are standalone functions with **no switch, no exhaustiveness**); `canvas.tsx`; `EditableNode.tsx`;
`palette.ts:23`; `Inspector.tsx:170`; `frames.ts:80` (`EMAIL_UNSAFE`); `paths.ts:6` (`CONTAINER_TYPES`);
`useCanvasA11y.ts:20` (`describe()` falls into a generic `else`).

A splits into **two halves that need different modules** (§1). The common case — a display-only
Component (Divider, Spacer, Icon) — needs only the render/export half.

**Render / export half — hard-required for any new Component:**

| Enabler                                                                              | Why it's required                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RP-2 — Component Descriptor / Registry** _(primary unlock)_                        | The **identity** module: collapses the 8 silent per-type facts to one row; `palette.ts` / `isContainer` / `isNodeEmailSafe` / `describe()` become projections/lookups over `Record<Node['type'], Descriptor>`, so a missing row is a _compile_ error. 12-file change → 1 row + N renderers. |
| **RP-9 — Typed per-target renderer exhaustiveness** _(§5.1 — promoted into the map)_ | `Record<LeafType, Renderer>` per Export Target, so a forgotten renderer is a _build_ error rather than `mjml.ts:99`'s runtime throw or a blank canvas. This is the actual **silent→caught** lever; it sits _underneath_ RP-2.                                                               |
| **RP-8 — MJML walk-seam** _(low; only if email-safe rich)_                           | Once RP-9 supplies a leaf-renderer registry, MJML (`mjml.ts:87-101`) shares it so a forgotten email leaf compile-fails too. Low because email-unsafe rich widgets never reach it.                                                                                                           |

**Editing half — required only when the new Component adds editable props beyond `content`** (a
matched **write/read pair**; a display-only Component needs _neither_):

| Enabler                                                    | Why it's required                                                                                                                                                                  |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RP-1 — Layout-tree editing module** _(write side)_       | The new prop-setter (set-variant, set-src…) routes through the 7-action mutation smear; extract it so the next setter is 3 lines, not a 12-line copy.                              |
| **RP-6 — Inspector selection-editing model** _(read side)_ | `Inspector.tsx:170-180` hardcodes `editable = Text\|\|Button` inline; a Component with new props has nowhere to surface controls. Becomes table-driven, reading RP-2's `controls`. |

Not required for A: RP-5 (drag-drop intent), RP-7 (persistence/reconciliation).

### Capability B — "Real typography system"

Today: `variant: 'h2' | 'body'` (`types.ts:43`) with the **same three literals hardcoded in three
parallel places**: `leaf-style.ts:78,80` (`lineHeight '1.25'`, `fontWeight '700'`), `mjml.ts`
(`line-height="1.25"`, `font-weight="700"/"400"`), and the canvas copy in `src/components`.
`tokens.json:18-23` has **only 4 font tokens** (family, h2, body, line) — no weight, no letter-spacing,
no composite. `ThemePanel.tsx` shows colors only; Text nodes never get a style section
(`Inspector.tsx`, `styleKeys` is container-gated).

B has **two halves** (the settled Heading-style vs Free-form-text split, §1) that unlock through
**different** candidates, over one shared additive base — and, like A, each half has a render side and
an editing side. **Scope:** the binding is **typography-only and Text-only**; everything else (Button's
primary/secondary appearance) is _already_ token-based and out of scope. Button's lone typographic
smear — `fontWeight '600'` — is killed by **direct primitive adoption** (`font.weight.semibold` ref in
`buttonDecls`/`renderButton`/`Button.tsx`), **not** a binding row.

| Slice                               | Enabler                       | Role                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shared scaffolding** _(do first)_ | token growth (RP-3/RP-4 base) | add primitive `font.weight/scale/lineHeight/letterSpacing` tokens to `tokens.json` + `npm run tokens` — purely additive, decoupled from RP-2, lands first                                                                                                                                                                                    |
| **Heading styles**                  | **RP-3** _(primary)_          | DTCG **composite `typography` tokens aliasing the primitives** (Figma/Tokens-Studio round-trippable); SD `expand` → per-property web `var()` + email literals that `leaf-style.textDecls` / `mjml.renderText` / canvas copy _interpret_. Adding `h1`/`caption` = one composite token; the `TextStyle` union is **codegen'd** from the graph. |
| **Free-form text** _(read/model)_   | **RP-4** _(co-primary)_       | per-node-type style keys (Text → `fontSize`/`fontWeight`) — `STYLE_KEYS` (`design-tokens.ts:27`) is a flat _container_ map today — **plus** a finer token `Category` so a "pick weight" picker sources weights, not the whole intermixed `'font'` bucket. The `design-tokens.ts:24` comment predicts exactly this.                           |
| **Free-form text** _(write)_        | **RP-1** _(conditional)_      | free-form editing must **set `fontSize`/`fontWeight` on a Text leaf**, which `setNodeStyle` refuses today (`store.ts:293` container-gate). Relaxing that gate is an editing-module op — routes through RP-1 if landed (same conditional role as A's editing half).                                                                           |
| **Editing surface**                 | **RP-6**                      | `Inspector.tsx:41-49` builds options for _container_ keys only; renders the heading picker + free-form size/weight pickers, reading RP-2's control set. Extend "container-gated" → "per-node-type control set."                                                                                                                              |
| **Identity**                        | **RP-2**                      | declares that the Text descriptor exposes a **typography control set** (read by RP-6). Owns the _control declaration_, not the variant→token mapping (that is RP-3).                                                                                                                                                                         |

**A/B symmetry:** both capabilities decompose into a **render half** and an **editing half**, and the
editing half is always the **RP-1 (write) + RP-6 (read)** pair. This is why §4 puts RP-1 first — it is
on the critical path for _both_ capabilities' editing halves.

Not required for B: RP-5 (drag-drop intent), RP-7 (persistence/reconciliation), RP-8 (MJML walk-seam).

---

## 3. The candidates

Stable IDs (`RP-n`) are referenceable across sessions. The number is **not** the implementation order
— see §4 for sequencing. Priority: ★★★ keystone / ★★ high / ★ independent debt.

| ID      | Title                                                                  | Priority | Unlocks                                | Origin                       |
| ------- | ---------------------------------------------------------------------- | -------- | -------------------------------------- | ---------------------------- |
| RP-1    | Frame layout-tree editing module                                       | ★★       | A + B (editing/write side), foundation | state review                 |
| RP-2    | Component Descriptor / Registry (+ Node-kind facts)                    | ★★★      | A + B keystone                         | research synthesis (NEW)     |
| RP-3 ✅ | Typography token + Variant-binding seam (Text styles)                  | ★★★      | B (heading half)                       | research synthesis (NEW)     |
| RP-4 ✅ | Design-Token Model growth (per-node-type style keys)                   | ★★       | B (free-form half)                     | research                     |
| RP-5    | Drag-drop intent resolution module                                     | ★        | editor correctness                     | state + UI review            |
| RP-6 ✅ | Inspector selection-editing model                                      | ★★       | A + B (editing side)                   | UI review                    |
| RP-7    | Persistence + reconciliation pure decisions                            | ★        | test coverage                          | state review                 |
| RP-8    | MJML walk-seam alignment (ADR-0008)                                    | ★        | A (email widgets)                      | export review                |
| RP-9 ✅ | Typed per-target renderer exhaustiveness (`Record<LeafType,Renderer>`) | ★★       | A (render-half safety)                 | completeness §5.1 (promoted) |

---

### RP-1 — Frame layout-tree has no editing module; the edits live untested inside store actions

**Priority:** ★★ · **Sequence:** 1st · **Unlocks:** A (write side) + a tested mutation core for everything after.

> ✅ **IMPLEMENTED 2026-06-22** — extracted to `src/editor/node-tree.ts` (5 pure ops); the 7 store
> actions route through it via `applyTreeEdit`. See §4 step 2 for the full record.

**Files / sites:** `src/editor/store.ts` (the 7 mutating actions: `insertChild`, `insertAt`,
`moveNode`, `deleteNode`, `updateText`, `setLayout`, `setNodeStyle`), leaning on
`src/editor/paths.ts` (`nodeAt`, `isPrefix`, `isContainer` — load-bearing, **untested**;
`paths.test.ts` covers only `flattenPaths`). New module: e.g. `src/editor/node-tree.ts`.

**Problem (deep/shallow):** Each action repeats the same shape —
`structuredClone(frame.root)` → `nodeAt(root, path)` → splice/mutate →
`doc.frames.map(f => f.id === id ? {...f, root} : f)` — interleaved with zustand `set`, history
coalescing, and UI side-effects, so the tree edit is only reachable by driving the store and
observing outcomes. The genuinely tricky invariants live _inline in untested bodies_:
`moveNode`'s index adjustment (`if (fromParent === targetParent && fromIndex < i) i -= 1`), the
`isPrefix` "can't move into your own subtree" guard, the root-deletion guard, and the Grid
"delete `wrap`" rule. **`moveNode` and `deleteNode` have zero tests**; the others test only
history-coalescing, not mutation correctness. This is the skill's canonical anti-pattern: pure
functions (`frames.ts`, `paths.ts`) extracted for testability, while the bugs hide in the
_composition_ that calls them.

**Evidence:** `store.ts` 7 actions repeat the clone+nodeAt+splice+map boilerplate; `moveNode`
index-adjust; `deleteNode` root guard; `setLayout` Grid-`wrap` special case. `paths.ts:8-32`
(`nodeAt`/`isPrefix`/`isContainer`/`samePath`) used in 12+ call sites, none unit-tested.

**Proposed direction:** Give a Frame's layout tree its own **editing module** (`src/editor/node-tree.ts`),
**purely structural and type-agnostic** (resolved in grilling). **Five ops** serve the seven actions,
each a pure `(root, …) → { root, path } | null` that never mutates its input (full `structuredClone` at
entry):

- `insert(root, parentPath, index, node)` — both `insertChild` (index = `children.length`) and `insertAt`.
- `move(root, fromPath, parentPath, index)` — owns the index-adjust + `isPrefix` subtree guard.
- `remove(root, path)` — the root-delete guard (`delete` is reserved).
- `updateProps(root, path, patch)` — both `updateText` (`{content}`) and `setLayout` (a patch where
  `undefined` deletes a key); a **blind** props merge.
- `setStyle(root, path, key, ref|null)` — a blind style-map set/clear.

`path` is the resolved **structural** location (insert/move target, delete's parent, or the unchanged
path for in-place edits); `null` = a tree-level **no-op** (invalid path, root/subtree guard, no-change).
Store actions shrink to: look up the frame, call the op, on `null` return `null`, else assemble the body
and apply **UI policy** (map `path` → selection) through the existing `mutate()`. The store keeps
_orchestration_ (frame lookup, body assembly, selection policy, history); the module owns _structural
correctness_. **Node-type rules are NOT in the module** — the Grid-`delete-wrap` rule (`store.ts:278`)
and the container-gate (`store.ts:293`) are _semantic_ facts that stay as thin store-action sanitization
for now and **migrate to the descriptor in RP-2/RP-4** (RP-4 relaxes the gate so a Text leaf carries
`fontSize`/`fontWeight`). The module's structural "can receive children" check is `'children' in node`
(union-derived), not the hardcoded `isContainer` Set.

**Benefits:** **Locality** — every _structural_ layout-tree invariant in one place, not re-derived per
action and in `Editor.tsx`. **Leverage** — drag-drop (RP-5), keyboard a11y, and the store all edit
through one seam. **Tests** — the interface _is_ the test surface: "move into own subtree rejected",
"delete root is a no-op", "move index-adjust within the same parent", "insert into a leaf is a no-op"
become pure unit tests with no zustand/history/React. (The "Grid drops `wrap`" test is **not** here — it
is a node-type rule owned by RP-2.)

**Tests that become possible:** direct unit tests for all 5 ops incl. the move index-adjust and subtree
guard, the root guards, and "input root is never mutated" (purity); `paths.ts` primitives
(`nodeAt`/`isPrefix`) get their own unit tests (backfilled by RP-1).

**Dependencies:** none. Lowest-risk, do first.

**ADR touchpoints:** likely an amendment to ADR-0012 (history reducer / `mutate()` funnel) noting the
new tree-edit module sits _below_ the funnel. No reversal.

**Open questions** — _all resolved in grilling:_ returns **`{ root, path } | null`** (`path` = structural
location, store owns selection policy; `null` = tree-level no-op); module **owns the clone** (full
`structuredClone`, pure, never mutates input); **tree-validity** no-ops live in the module, the
**frame-lookup** no-op stays in the store; module is **structural/type-agnostic**; `updateText` +
`setLayout` collapse into `updateProps`; structural-sharing optimization explicitly deferred. _Remaining
for implementation:_ the exact `patch` typing for `updateProps`.

---

### RP-2 — Component Descriptor / Registry (the 12-file → 1-row unlock) ★★★

**Priority:** ★★★ keystone · **Sequence:** 2nd · **Unlocks:** A (primary) + B (declares variants).
**Grill together with the Node-kind-facts consolidation — they are the write-side and read-side of one
module.**

> ✅ **IMPLEMENTED 2026-06-22** (ADR-0014) — `src/editor/descriptors.ts` (union-mapped `DESCRIPTORS`);
> PALETTE / `EMAIL_UNSAFE_TYPES` / a11y `describe()` are now descriptor projections, the drift-guard is
> deleted, `controls`/`styleKeys` declared for RP-6/RP-4. RP-9 kept separate. See §4 step 3.

**Files / sites (consolidates):** `src/editor/palette.ts:23-93` (`PALETTE`),
`src/editor/frames.ts:80` (`EMAIL_UNSAFE`), `src/editor/paths.ts:6-10`
(`CONTAINER_TYPES`/`isContainer`), `src/editor/useCanvasA11y.ts:20-28` (`describe`),
`src/editor/Inspector.tsx:170-174` (editable/container gates); _feeds_ `leaf-style.ts`, `mjml.ts:87`,
`canvas.tsx`, `EditableNode.tsx` (emitter dispatch). New module: **`src/editor/descriptors.ts`** (it
carries editor-runtime facts — `icon`, `controls` — so it _cannot_ live in the dependency-free `src/ir`,
ADR-0008). RP-9's renderer registry is a **separate** library module (with the generators/components).

**Problem (deep/shallow):** `walk.ts` is genuinely deep, but every _fact about a node type that isn't
structural traversal_ leaks out of it into ~12 **shallow** sites that each re-encode the type list.
**There is no module that owns "what is a Component."** Adding one means editing the union
(`types.ts`) plus ~11 satellites, **8 of them silent** (no compile error). This is textbook
information leakage: the same decision (kind, email-safety, label, icon, default props, editable
controls, style keys) repeated at every call site. `frames.test.ts` exists _only_ to assert
`PALETTE.emailSafe` and `EMAIL_UNSAFE` never drift — a test that **disappears** once the fact has one
home.

**Evidence (verified):** `types.ts:33-49` (7-branch union). `design-tokens.ts:24` comment predicts
per-node-type evolution. `frames.ts` `EMAIL_UNSAFE = ['Grid']` separate from `palette.ts` per-item
`emailSafe`. `paths.ts:8` hardcodes `isContainer` over a `Set`. `useCanvasA11y.describe()` unguarded
`else`.

**Proposed direction:** One **descriptor as a mapped type over the union** (resolved in grilling) —
`type Descriptors = { [T in Node['type']]: Descriptor<T> }` — so a missing row is a _compile_ error and
each row's `create: () => Extract<Node,{type:T}>` is per-type-checked (parity **by construction**, no
test). `Descriptor<T>` = `{ label, icon, group, emailSafe, create, styleKeys, controls }` — **no `kind`**
field (container-ness stays union-derived `'children' in node`). `PALETTE` becomes a _projection_;
`isNodeEmailSafe` / `describe` become descriptor lookups; **`isContainer` stays union-derived** (not a
descriptor lookup); the Grid-`wrap` rule and the container-gate come home as `controls` / `styleKeys`.
`controls` is a **static data spec** (what a type can expose); **RP-6** renders it and owns the _dynamic_
filtering (fill hides justify/wrap; email root → background/padding). The per-target renderers stay
per-type-checked — but via **RP-9's renderer registry** (a separate library mapped type), not this
descriptor and not only `walk.ts`.

**Benefits:** **Locality** — adding a Component = a union branch (compile-forced everywhere via
`walk.ts`) + one descriptor row + N target renderers; the 8 silent satellites collapse to one row.
**Leverage** — descriptor-completeness is **compile-enforced** (mapped type), and one table-driven test
(`email-unsafe ⊆ palette; every `create()` yields a valid per-type node`) replaces the `frames.test.ts`
drift-guard and covers the satellites at once. ("Every leaf has a renderer in every target" is **RP-9's**
coverage, its own mapped registry.) **Deletion test** — delete a row and the
Component vanishes from palette, inspector, a11y, and the email rule simultaneously while a coverage
test flags the orphaned renderer: that single-point-of-failure _is_ the depth.

**Tests that become possible:** email-safety ⊆ palette invariant; `create()` yields a valid per-type
node (mostly compile-enforced); descriptor-completeness is the _type system_ (mapped type), not a test.
("Every leaf type appears in every emitter" coverage belongs to RP-9.)

**Dependencies:** none hard, but best after RP-1 (so new Component prop-setters use the tested tree
module). It is the **keystone** for RP-3 and RP-6, which read the descriptor.

**ADR touchpoints:** **new ADR** — "Component Descriptor as the single source of node-type facts."
Hard to reverse, surprising without context, a real trade-off (registry vs. exhaustive switches).
Must reconcile with ADR-0008 (walk owns structural dispatch — descriptor owns _non-structural_ facts
only) and ADR-0006 (email-safe rule moves _into_ the descriptor, `isEmailFrameClean` reads it). The ADR
also records the **union-mapped-type** shape (parity by construction, no `kind` field), the
**`src/editor/descriptors.ts`** home (editor-runtime `icon`/`controls`), and the **RP-9 split**
(per-target renderers are a separate library mapped registry, not this descriptor).

**Open questions** — _all resolved in grilling:_ **lives in `src/editor/descriptors.ts`** (carries
editor-runtime `icon`/`controls`; the IR stays dependency-free per ADR-0008); **no IR/editor split** —
the only library-side per-type concern is **RP-9's separate renderer registry**. `create`/`defaultProps`
stay in sync **by construction** via the **union-mapped type** (`{ [T in Node['type']]: Descriptor<T> }`
with `create: () => Extract<Node,{type:T}>`) — neither "derive union from descriptor" nor a parity test.
The descriptor owns `controls` as a **static data spec**; **RP-6** renders it and owns the dynamic
visibility (fill/email conditions). `kind` is _not_ a field — container-ness is union-derived.

---

### RP-3 — Typography token + Variant-binding seam (the type-scale unlock) ★★★

**Priority:** ★★★ · **Sequence:** 3rd · **Unlocks:** B (primary).

> ✅ **IMPLEMENTED 2026-06-22 (ADR-0015)** — composite `text.*` styles (interop) + codegen'd
> `TEXT_STYLE_BINDING`; renderers resolve to primitive `var()`/literals; MJML line-height→px. The
> hard-coded `1.25`/`700`/`600` are gone. See §4 step 4.

**Files / sites:** `src/theme/tokens.json:18-23` (add weight/line/composite tokens),
`src/theme/design-tokens.ts:12,27` (`Category` / `STYLE_KEYS` — shared with RP-4),
`src/generators/leaf-style.ts:72-93` (`textDecls`/`buttonDecls`),
`src/generators/mjml.ts` (`renderText`/`renderButton`),
`src/components/primitives.tsx` + `src/components/Button.tsx` (canvas copies),
`src/ir/types.ts:43,46` (variant unions). New module: e.g. `src/theme/variant-bindings.ts`.

**Problem:** The variant→token mapping is **triplicated** and **half-tokenized**.
`leaf-style.ts:77-80` resolves `font.h2`/`font.body` through tokens but bakes
`lineHeight '1.25'` and `fontWeight '700'` as **raw literals**; `mjml.ts` repeats the same literals
for email; `src/components` repeats them again for the live canvas. `tokens.json` has **no** weight,
line-height, letter-spacing, or composite typography tokens — so a designer editing weight in the
**Design Palette** cannot re-theme typography (the value isn't a **Design Token**). This contradicts
the dual-output spine (ADR-0004): the half-tokens never reach the Theme.

**Evidence (verified):** `tokens.json:18-23` — `font` = `{ family, h2, body, line }` only.
`leaf-style.ts:78` `lineHeight: h2 ? '1.25' : 'var(--font-line)'`; `:80` `fontWeight: '700'`; `:92`
button `fontWeight: '600'`. `types.ts:43` `variant: 'h2' | 'body'`.

**Proposed direction:** (1) Add the **discrete primitive** layer to `tokens.json` — `font.size.*`,
`font.weight.*` (numeric `400`/`700`), `font.lineHeight.*` (unitless `number`), `font.letterSpacing.*` —
all valid DTCG tokens; regenerate (`npm run tokens`). Button's lone `600` is a direct
`font.weight.semibold` ref. (2) Author the closed **Heading set** as DTCG **composite `typography`
tokens that _alias_ those primitives**
(`heading.h2 = { fontSize:'{font.size.lg}', fontWeight:'{font.weight.bold}', lineHeight:'{font.lineHeight.tight}' }`)
— standard DTCG, so Figma Variables / Tokens Studio can round-trip it. (3) Configure Style Dictionary
with **four platforms** over the one graph: _interop_ (no `expand`, pass-through composite for
round-trip), _web_ (`expand:{include:['typography']}` + `css/variables` + `outputReferences:true` →
per-property `var()`), _email_ (`expand`, `outputReferences:false` → resolved literals; MJML sets
`font-size`/`font-weight`/`line-height` as separate attributes — ADR-0004), _types_ (custom format → TS
unions). `textDecls`/`renderText`/canvas all _interpret_ the per-property output — no branching, no raw
literals. (4) **Compile-time safety via codegen:** a custom SD format reads the graph and emits
`type HeadingStyle = …` (the `typography` group) + `FontSize`/`FontWeight` step unions; the IR's
`variant` becomes `HeadingStyle`, free-form text picks `FontSize`/`FontWeight` (RP-4). The old
hand-authored `VARIANT_BINDINGS` table is **replaced by this generated artifact** — add a heading = one
composite token, types follow. **Gating spike (do FIRST, ~1 hr):** verify the alias survives `expand`
so web still emits `var(--font-size-lg)`, not a resolved literal (SD doesn't guarantee it — a known
flattening footgun). Email is unaffected (we _want_ literals). If it fails, web typography needs a
custom format / composite-level refs.

**Benefits:** **Locality** — adding `caption`/`h1`/`h3` = one composite token (+ primitive rows if new); zero
generator edits (generators become _interpreters_ of the table). **Leverage** — the binding feeds the
Inspector Typography picker (RP-6), the Design-Palette Type-Scale section, _and_ both export targets
from one source; one round-trip test (`for each variant, web var ↔ email literal resolve to the same
token`) covers all three. **Seam alignment** — kills the last raw literals in
`leaf-style.ts`/`mjml.ts`/`src/components`, keeping β with one home per side (the `leaf-style` vs
`src/components` split ADR-0008 mandates). **Deletion test** — delete a binding row → the variant
disappears from palette/inspector and both exporters refuse it; a Theme override of
`font.weight.heading` re-themes h2 across web preview _and_ email in one edit.

**Tests that become possible:** variant↔token round-trip (web var name vs email literal parity); "no
raw typographic literal remains in any generator" lint/test; Theme-override re-themes-h2 assertion.

**Dependencies:** RP-2 (descriptor declares which variants a Component offers) + RP-4 (the Category /
`STYLE_KEYS` growth to carry weight/line). Can begin token-graph work in parallel.

**ADR touchpoints:** **new ADR** — "Typography authored as DTCG composite `typography` tokens aliasing
a discrete primitive scale; Style Dictionary `expand` fans out to per-property web `var()` / email
literals; the `TextStyle` union is codegen'd from the token graph." Extends ADR-0004 (dual output now
covers composite typography). Trade-off resolved: composite-aliasing-primitives chosen over a bespoke
TS binding table — it earns DTCG / Figma / Tokens-Studio interop while the codegen step preserves
compile-safety. (The composite layer is the first thing to drop if token interop is ever deferred —
then discrete primitives + codegen'd unions suffice.)

**Open questions for grilling:** _Resolved:_ composite-vs-discrete → **both, layered**; `variant` →
**codegen'd `HeadingStyle` enum**; `lineHeight` unitless `number`, `fontWeight` numeric, curly-brace
`{dot.path}` refs; **naming** = `h1`/`h2`/`h3` heading roles (mapped to `<h1>/<h2>/<h3>` for a11y) +
`body`/`caption`/`label`; **named body composites deferred** (free-form primitive binding covers it);
**letter-spacing** token now, control later. _Remaining (verification/impl, not forks):_ the
alias-survives-`expand` **gating spike**; when to migrate string `"24px"` → `{value,unit}` (forward, not
a blocker); `font-family` stack quoting in MJML.

---

### RP-4 — Design-Token Model growth: per-node-type style keys

**Priority:** ★★ · **Sequence:** co-primary with RP-3 · **Unlocks:** B (free-form-text half).

> ✅ **IMPLEMENTED 2026-06-22 (ADR-0015)** — `STYLE_KEYS` → `STYLE_KEY_CATEGORY` + descriptor
> `styleKeys` (Text → `fontSize`/`fontWeight`); fine-grained `categoryOf` by path; store style-gate
> descriptor-driven; free-form size/weight pickers land. `CATEGORY_META`/ThemePanel section → RP-6.

**Files / sites:** `src/theme/design-tokens.ts:12` (`Category`), `:26-32` (`STYLE_KEYS` flat map),
`src/theme/token-category.mjs` (`categoryOf`), `src/editor/Inspector.tsx:41-49` (`STYLE_LABEL` /
`STYLE_OPTIONS`), `:72-73` (`stylableKeys` medium gate), `src/editor/ThemePanel.tsx` (hardcodes
`byCategory('color')`).

**Problem:** The Catalog itself is deep, but its _consumers_ hardcode category lists. `Category` is a
4-value union; `STYLE_KEYS` is a flat _container_ map (4 keys, all node types see the same set);
`STYLE_LABEL` duplicates the key list in the Inspector; `ThemePanel` shows only colors. Real
typography needs Text to expose `fontSize`/`fontWeight`/`lineHeight` style keys — i.e. `STYLE_KEYS`
must become **per-node-type** (or be owned by RP-2's descriptor). The code _predicts this exactly_:
`design-tokens.ts:24` — _"Evolve to per-node-type only when a node needs different keys (e.g. Text →
color/fontSize)."_

**Evidence (verified):** `design-tokens.ts:12` `Category`; `:27-32` `STYLE_KEYS` flat;
`:22-25` the prophetic comment. `tokens.json` four groups.

**Proposed direction** (resolved in grilling): split the conflated `STYLE_KEYS` into **two facts, two
homes** — (1) **`STYLE_KEY_CATEGORY: Record<StyleKey, Category>`** stays in `design-tokens.ts` (library,
token-model fact); (2) the **per-type `styleKeys: StyleKey[]` list** moves onto **RP-2's descriptor**
(node-type fact). The Inspector/RP-6 _composes_ them:
`descriptor.styleKeys.map(k → byCategory(STYLE_KEY_CATEGORY[k]))`. **`Category` grows finer by
path-derivation** — `categoryOf` (already path-aware) branches on `path[1]` within the `font` group →
`fontFamily`/`fontSize`/`fontWeight`/`lineHeight`/`letterSpacing` (drop the coarse `font`; add a
`fontWeight` `$type` arm). `byCategory('fontWeight')` then powers _both_ the free-form picker _and_
RP-3's codegen'd `FontWeight` step union — **one mechanism** (why RP-3/RP-4 are one session). `ThemePanel`
**auto-discovers the category set** but presents via a compile-forced
`CATEGORY_META: Record<Category, { label, order }>` (no hardcoded `byCategory('color')`). The medium gate
(web vs email) becomes **RP-6 filtering**, not inline JSX.

**Benefits:** **Locality** — adding a token category or a per-type style key stops requiring parallel
edits in `STYLE_KEYS`, `STYLE_LABEL`, `stylableKeys`, and `ThemePanel`. **Leverage** — Text gets a
real style section; the Design Palette can grow a Type-Scale section by registration. **Tests** —
category/style-key coverage becomes a table assertion.

**Dependencies:** RP-2 (descriptor owns per-type `styleKeys`). RP-3 and RP-4 are the **two halves of
Capability B** — RP-3 owns the Heading-style binding, RP-4 owns the Free-form-text model (per-node-type
style keys + a finer `Category` so size/weight pickers are sourced). Grill them together as one
"typography spine" session, over the shared additive token base (§2).

**ADR touchpoints:** amendment to ADR-0004 (the Design-Token Model now supports per-node-type style
keys and richer categories).

**Open questions** — _all resolved in grilling:_ `STYLE_KEYS` **splits** — the key→category map stays in
`design-tokens.ts` (library), the per-type list moves to the descriptor, the Inspector composes them.
`ThemePanel` **auto-discovers the category set** + a compile-forced `CATEGORY_META` for label/order.
**letter-spacing**: token + category land now (additive base), the editing control is deferred;
**shadow**: a separate `effects` category, **deferred entirely** (not Capability B).

---

### RP-5 — Drag-drop intent resolution is complex domain logic trapped in a component

**Priority:** ★ · **Sequence:** independent · **Unlocks:** editor correctness + drop feedback.

**Files / sites:** `src/editor/Editor.tsx` (`computeTarget`, `resolveDrop`, `onDragEnd`).

**Problem:** These pure-ish functions translate pointer geometry + dnd-kit event shapes into a tree
operation — drop-mode thresholds (`<0.25` before / `>0.75` after / else inside), the "root forces
inside" rule, insert-vs-move branching, and the email-safety guard applied _after_ the target is
computed. Real, bug-prone logic, reachable only by mocking dnd-kit's `DragEndEvent`/`over`, so none of
it is tested. The late email guard also means a blocked drop shows an indicator then silently drops.

**Proposed direction:** Name the **drop-intent module**: `(geometry, draggedItem, hoveredNode) →
resolved tree op | rejected`. `onDragEnd` shrinks to "resolve intent, dispatch to RP-1's tree module."
Move the email rule _into_ resolution so the indicator can reflect rejection.

**Benefits:** **Tests** — drop-mode maths + email restriction become pure unit tests. **Locality** —
"where does this drop land" stops being split between a component closure and the store. **Leverage** —
pairs with RP-1: intent resolution emits exactly the op the tree module consumes.

**Dependencies:** best after RP-1 (consumes its op type) and RP-2 (email-safe from descriptor).

**ADR touchpoints:** none expected.

**Open questions for grilling:** Where does dnd-kit's event shape get adapted (a thin boundary
function vs. inside the module)? Does "rejected" carry a reason for UI feedback?

---

### RP-6 — The Inspector decides "what can I edit about this selection" inline in JSX

**Priority:** ★★ · **Sequence:** 4th (after RP-2/RP-3) · **Unlocks:** A + B (the editing half).

> ✅ **IMPLEMENTED 2026-06-22** — new `src/editor/edit-model.ts` (`resolveEditModel(medium, node, path)
→ EditModel`, pure + typed); the Inspector is now a thin presenter. The heading-style picker
> (`setVariant`) and the deferred RP-3/RP-4 `CATEGORY_META` + ThemePanel Type-scale section landed too.
> No new ADR (consumes RP-2/RP-3/RP-4). See §4 step 5 for the full record.

**Files / sites:** `src/editor/Inspector.tsx` (`STYLE_OPTIONS`/`STYLE_LABEL` 41-49; `stylableKeys`
72-73; `editable`/`container`/`isFillRow`/`styleKeys` 170-180), reaching `catalog.byCategory`.

**Problem:** Given a Selection, the rules for _which_ controls appear — email Frames allow only
`background`/`padding` at root, Row-in-`fill` hides justify/wrap, which Design Token categories fill
each style field, **and (post-RP-3) which typography controls a Text node gets** — are computed inline
and interleaved with JSX, untested, and container-gated so leaves never get a style section. The
medium-gating (a domain rule tied to Frame target) is buried in a component.

**Proposed direction** (resolved in grilling): one **pure resolver**
`resolveEditModel(medium, node, path, descriptors, catalog) → EditModel` — a **structured, typed** model
(`{ content?, layout?: {distribute?,justify?,align?,wrap?}, typography?: {heading?,size?,weight?},
style?: StyleField[] }`) where each _present_ field carries its resolved options + current value; absence
= "not editable for this selection." The deep part — **medium** filtering (email root → only
`background`/`padding`), **state** filtering (Row-`fill` → drop justify/wrap), and **category→options**
resolution — lives entirely in the resolver. The Inspector becomes a **thin presenter** rendering each
present field with its **typed** component (no inline conditionals, no generic switch — honoring the
depth guard: don't over-genericize controls into shallow data). **Four layers:** RP-2 descriptor =
static per-type availability (`controls`/`styleKeys`); RP-4/library = `STYLE_KEY_CATEGORY` + `byCategory`

- RP-3's codegen'd unions = option _source_; the RP-6 resolver = dynamic medium/state filtering +
  option/value resolution; the presenter = `EditModel → typed components`. `Inspector.tsx`'s
  `editable`/`container`/`isFillRow`/`stylableKeys`/`STYLE_OPTIONS` all collapse into the resolver. Option
  lists split three ways: **invariant enums** (justify/align/wrap/distribute) = shared presenter constants;
  **per-type** (variant/heading) = descriptor; **dynamic token options** = resolver via `byCategory`.

**Benefits:** **Tests** — "email root exposes only background/padding", "Row-fill hides justify",
"Text exposes the type-scale picker" become pure assertions. **Locality** — medium-aware editing
rules sit beside the email-insert rule in domain code, not in JSX.

**Dependencies:** RP-2 (control/style-key source) + RP-3 (typography controls to render) + RP-4
(per-type style keys). Grill **after** them so it consumes finished tables.

**ADR touchpoints:** none expected (it consumes RP-2/RP-3 ADRs).

**Open questions** — _resolved in grilling:_ a **pure function** returning a **structured typed
`EditModel`** (not scattered predicates, not a fully-generic form spec); the typed `SegmentedControl`/
`Select`/`Input` JSX **stays** but is driven by the model's present fields (no inline conditionals).
Invariant enum options stay as presenter constants; the resolver owns medium/state filtering + dynamic
token-option resolution.

---

### RP-7 — Persistence + React-Flow reconciliation hide clever, untested decisions in hooks

**Priority:** ★ · **Sequence:** independent · **Unlocks:** test coverage.

**Files / sites:** `src/editor/usePersistence.ts`, `src/editor/useFrameNodes.ts`,
`src/editor/document.ts` (only `parseDocument` is tested).

**Problem:** Both hooks contain subtle logic reachable only through React: `usePersistence`'s
reference-identity trick to skip StrictMode's double-invoke + the initial-load re-save, the debounce,
and the `saveStatus` transitions; `useFrameNodes`'s reconcile that adopts the store position _only
when it changed_ so it never fights an in-flight drag. `saveToLocal`/`loadFromLocal`/`toDocument` and
the reconcile decision are untested.

**Proposed direction:** Push the _decisions_ (should-save? adopt-store-position-or-keep-node?) into
pure functions the hooks call; leave the hooks as thin effect wrappers.

**Benefits:** **Tests** — "don't fight the drag" and "don't re-save what we just loaded" become unit
tests. Lower payoff than RP-1…RP-4; independent, schedule when convenient.

**Dependencies:** none.

**ADR touchpoints:** none (ADR-0012 already covers persistence shape).

**Open questions for grilling:** Is the reconcile decision a pure `(prevNodes, frames) → nodes` fn
worth its own test, or is it too thin to extract?

---

### RP-8 — MJML re-implements the structure traversal the Node Walk owns (contradicts ADR-0008)

**Priority:** ★ (optional) · **Sequence:** last · **Unlocks:** A (only when an email-safe rich
Component is added).

**Files / sites:** `src/generators/mjml.ts` (`renderLeaf` 87-101, `renderCardSections`,
`renderRowSection`) vs. `src/ir/walk.ts`.

**Problem:** The three web targets share the Node Walk; MJML hand-rolls its own child loops + type
dispatch — a **second source of truth** for document-order traversal. Adding a container/leaf type
means updating both the walk and MJML's bespoke dispatch in sync; `renderLeaf` throws at runtime
(doesn't compile-fail) when a leaf is forgotten.

**Why flagged despite the ADR:** ADR-0008 _deliberately_ keeps MJML bespoke because email's
section/column flattening is genuinely different from flex/grid — that rationale is sound. **Do not
act on this unless container/leaf types start churning.** Surfaced so the duplication reads as a known
decision, not an oversight. (The keyword→CSS duplication between `leaf-style.ts` and
`components/Layout.tsx` is likewise deliberate per ADR-0008 — leave it.)

**Proposed direction (if taken up):** Let MJML at least share the _leaf dispatch_ (the descriptor's
renderer registry from RP-2) so a forgotten leaf is a compile error, while keeping its bespoke
section/column structure. Revisit only on demand.

**Dependencies:** RP-2 (renderer registry).

**ADR touchpoints:** amendment to ADR-0008 _only if_ acted on.

**Open questions for grilling:** Can leaf rendering be registry-driven without dragging MJML's
section model into the walk? Is the cost worth it before email-safe rich Components exist?

---

## 4. Recommended sequencing (one candidate — or one tightly-coupled pair — per grilling session)

Ordered **safety harness → foundations → features**, respecting **prerequisite-before-dependent**. The
harness comes first because RP-2/RP-3 rewrite the four code generators, and golden snapshots are the
only output-level guard against an emitter regression (§5.3).

1. **RP-11 — Golden-output regression net** ✅ **IMPLEMENTED** (2026-06-22). Pure additive: a committed
   snapshot per Export Target (`IR → {html, react, angular, mjml}`) over a **fixture corpus** that
   isolates one feature each across the full IR vocabulary. Zero production change, zero risk, and the
   **only** output-level guard for the emitter-touching refactors below — every later step reviews its
   snapshot diff instead of hoping. (§5.3.)
   - **Where:** `src/generators/golden.test.ts` + committed `__snapshots__/golden.test.ts.snap`
     (39 goldens). The canonical rich `sampleCard` keeps its own golden block in `generators.test.ts`.
   - **Corpus (11 fixtures):** covers every container (Stack/Row/Column/Grid), `distribute` fit+fill,
     every `Justify`/`Align`/`Wrap` value (`justify-matrix` / `align-wrap-matrix`), every leaf variant
     (Text h2/body, Button primary/secondary, Image width/no-width), the container style keys
     (background/padding/borderRadius/gap), and a `nested-deep` recursion fixture. Table-driven
     `GoldenFixture { name, frame, emailSafe }`.
   - **Target split:** **email-safe** fixtures (Stack root, leaf / Row-of-leaf children) run all four
     targets; **web-only** fixtures (Grid/Column/nesting) run the three web targets — MJML deliberately
     rejects those shapes (ADR-0006/0008), so feeding them to `emitMJML` would throw, not regress.
   - **Verified:** all 146 tests pass, `typecheck`/`lint`/`format:check` clean, change set is two new
     files only.
   - **⚠ Known gap for RP-3:** the vitest net covers the **four string generators only**. RP-3 also
     edits the **React-Aria canvas copies** (`src/components/primitives.tsx`, `Button.tsx`) — the
     typography literals `1.25`/`700`/`600`. Those are excluded from vitest by deliberate policy
     (React UI is E2E-verified, `vitest.config.ts`), so an RP-3 canvas-copy regression would **not**
     trip this net. RP-3 must either visually verify the canvas via `npm run generate` or add an SSR
     canvas snapshot (needs a `.test.tsx` + jsdom — out of RP-11's additive scope).
2. **RP-1 — Layout-tree editing module.** ✅ **IMPLEMENTED** (2026-06-22). Lowest-risk refactor,
   highest immediate coverage: the 7 mutations had _no unit test surface_. Wrote the
   `moveNode`/`deleteNode` characterization tests **first** (green against the unmodified store),
   then extracted. Gives a tested mutation library _before_ the Component-specific ops (set-prop,
   set-variant) that A and B need. Depended on nothing.
   - **Where:** new `src/editor/node-tree.ts` — **5 pure, type-agnostic ops** (`insert`/`move`/
     `remove`/`updateProps`/`setStyle`), each `(root, …) → { root, path } | null`, owning the full
     `structuredClone` (never mutates input; `insert` clones the inserted node too). `move` owns the
     index-adjust + `isPrefix` subtree guard + root guard; container check is union-derived
     (`'children' in node`), never a `kind`/`isContainer` list.
   - **Store:** a small `applyTreeEdit(doc, frameId, op)` helper collapses the 7 actions to ~4–6
     lines each — the store keeps frame-lookup, Selection/history policy, and the **node-type
     sanitization** (Text/Button gate, container gate, Grid-`wrap` drop) as thin reads → these move
     onto the descriptor in RP-2/RP-4. `insertChild`+`insertAt` collapse into `insert`;
     `updateText`+`setLayout` into `updateProps`.
   - **Tests:** `node-tree.test.ts` (the 5 ops incl. purity / index-adjust / both subtree guards /
     root guards) + backfilled `paths.test.ts` (`nodeAt`/`isPrefix`/`samePath`/`isContainer`).
     **204 tests pass**, node-tree.ts + paths.ts at **100%** lines, typecheck/lint/format clean,
     golden net unchanged (zero emitter touch). Added both modules to the vitest coverage include.
   - **ADR:** ADR-0012 gets a one-line amendment (the tree-edit module sits _below_ the `mutate()`
     funnel) — no reversal; written when convenient.
3. **RP-2 — Component Descriptor / Registry (+ Node-kind facts).** ✅ **IMPLEMENTED** (2026-06-22,
   ADR-0014). The **keystone**: largest extensibility unlock (12-file → 1-row), every Reader's PRIMARY,
   prerequisite for RP-3/RP-4/RP-6; guarded by RP-11's snapshots (which stayed unchanged — zero emitter
   touch).
   - **Where:** new `src/editor/descriptors.ts` — `DESCRIPTORS: { [T in Node['type']]: Descriptor<T> }`
     (mapped type → a missing row is a _compile_ error; `create: () => Extract<Node,{type:T}>` →
     create/union parity **by construction**). Fields: `label, icon, group, emailSafe, create,
styleKeys, controls`. **No `kind`** — container-ness stays union-derived (`'children' in node`,
     `isContainer` untouched).
   - **Collapsed:** `PALETTE` → a projection (bare type projects the descriptor; named variants — the two
     Buttons, Heading/Text, Grid's "(2-col)" — override only id/label/icon/create); `frames.ts`
     `EMAIL_UNSAFE_TYPES` **derived** from `emailSafe` (the `['Grid']` literal gone); `useCanvasA11y`
     `describe()` reads `descriptor.label`. The `frames.test.ts` Palette-vs-EMAIL_UNSAFE **drift-guard is
     deleted** (one home → nothing to drift), replaced by `descriptors.test.ts`.
   - **Deferred to consumers:** `controls`/`styleKeys` are declared (static spec) but the Inspector still
     renders inline — **RP-6** consumes them via `resolveEditModel`, **RP-4** grows the Text `styleKeys`.
   - **Verified:** 209 tests pass, descriptors.ts + palette.ts at **100%** lines, typecheck (mapped-type
     completeness) / lint / format clean, golden snapshots unchanged. New ADR-0014.
   - **RP-9 — ✅ IMPLEMENTED 2026-06-22** (landed just after RP-2, as planned; kept a **separate** library
     concern per ADR-0014 — not in the descriptor). See the §5.1 record below.
4. **RP-3 + RP-4 — the typography spine.** ✅ **IMPLEMENTED 2026-06-22 (ADR-0015).** DTCG composite
   Text styles + Free-form-text primitive binding — both co-primary halves of Capability B. The
   triplicated `'1.25'`/`'700'`/`'600'` literals are gone.
   - **Spike (gate, done first):** confirmed a composite's alias survives `expand` → web
     `var(--font-size-lg)`, email literal. Approach then refined to a codegen'd **binding** (cleaner —
     see ADR-0015): composites stay the DTCG-standard authoring + interop + codegen source; the render
     resolves to **primitives** via `TEXT_STYLE_BINDING`.
   - **Model:** `tokens.json` grew the primitive Type scale (`font.size/weight/lineHeight/letterSpacing`)
     - composite `text.*` styles aliasing them; a custom SD format codegens
       `generated/typography.ts` (`TextStyle` union, `FontSize/FontWeight` refs, `TEXT_STYLE_BINDING`).
       `categoryOf` split fine-grained (RP-4); `STYLE_KEYS` → `STYLE_KEY_CATEGORY` + descriptor `styleKeys`
       (Text → `fontSize`/`fontWeight`); store style-gate now descriptor-driven.
   - **Render:** `leaf-style`/`mjml`/`primitives.tsx`/`Button.tsx` interpret the binding (web `var()`,
     email literal) + free-form overrides; IR `variant` → `TextStyle`; **MJML line-height → px** (Outlook
     fix). Button `600` → `font.weight.semibold` ref.
   - **Verified:** 211 tests, 100% lines / typecheck / lint / format; golden net updated (reviewed
     typography diffs); `npm run generate` SSR self-check green (canvas copies). **No RP-12 bump** —
     `variant` widened (h2/body still valid) + additive style keys ⇒ saved docs load unchanged.
   - **Deferred to RP-6 — ✅ all landed there 2026-06-22:** the heading-style picker (`setVariant`),
     `CATEGORY_META` + the ThemePanel Type-scale section, and the full `resolveEditModel`. Free-form
     size/weight pickers had already landed in the RP-4 model.
5. **RP-6 — Inspector selection-editing model.** ✅ **IMPLEMENTED 2026-06-22.** Consumed RP-2's
   `controls`/`styleKeys`, RP-3's Heading bindings, and RP-4's free-form style keys; unlocks the
   _editing_ half of both A and B. The whole "what can I edit about this Selection" decision — the
   inline `editable`/`container`/`isFillRow`/`stylableKeys`/`STYLE_OPTIONS` smear that was interleaved
   with Inspector JSX and untested — is now a pure function.
   - **Where:** new `src/editor/edit-model.ts` — `resolveEditModel(medium, node, path) → EditModel`, a
     **structured, typed** model (`{ type, content?, layout?{distribute,justify,align,wrap},
typography?{heading,size,weight}, style?: TokenField[] }`) where a _present_ field = an editable
     section. The resolver owns the **dynamic** rules: medium narrowing (email container → root
     `background`/`padding` only, none deeper), state filtering (Row-`fill` drops justify+wrap),
     container-vs-leaf gating, the **typographic-vs-container styleKey split** (font-ish categories →
     the Typography section, the rest → Style), and token-option resolution via `byCategory`.
   - **Presenter:** `Inspector.tsx` is now thin — present model fields render their typed control
     (`Input`/`Select`/`SegmentedControl`), no inline domain logic. **Invariant** enum option lists
     (justify/align/wrap/distribute) + the `TextStyle` label set stay as presenter constants; only the
     **dynamic** token options live in the model (the §RP-6 three-way split, honoured exactly).
   - **Heading-style picker (the deferred RP-3 item):** new store action `setVariant(frameId, path,
variant: TextStyle)` — Text-gated, routes through RP-1's `NodeTree.updateProps` via
     `applyTreeEdit` (the "next prop-setter is ~6 lines" payoff). The descriptor gained a `heading`
     `ControlKind` so the picker is descriptor-declared.
   - **CATEGORY_META + ThemePanel Type-scale section (the deferred RP-4 item):** compile-forced
     `CATEGORY_META: Record<Category, {label, order}>` in `design-tokens.ts`; `ThemePanel` now
     **auto-discovers** the category set from the Catalog (no hard-coded `byCategory('color')`),
     rendering colors as Swatches and the Type-scale primitives as literal Inputs — editing either
     re-themes the board live (the generic `buildOverrideCss`/`withOverrides` path already carried it).
   - **Tests:** new `edit-model.test.ts` (13 pure assertions — email-root narrowing, Row-`fill` hiding,
     Grid no-wrap, per-type controls, default resolution, option sourcing) + 3 `setVariant`
     characterization tests. typecheck (mapped-type completeness on `CATEGORY_META`
     - `ControlKind`) / lint / format clean, **golden net byte-identical** (zero emitter touch), and
       `npm run generate`'s SSR self-check green. **No new ADR** — RP-6 consumes the RP-2/RP-3/RP-4 ADRs.
   - **Hardened by an adversarial-review workflow (5 dimensions → refute each finding; 7 confirmed, 2
     refuted).** Behaviour-preservation found nothing; the resolver core drew one low finding. Fixes:
     (a) the layout pickers (`JUSTIFY/ALIGN/WRAP/DISTRIBUTE_OPTS`) were hand-authored arrays with no tie
     to the IR unions (silent-drift seam) → extracted to a pure **`src/editor/inspector-options.ts`**,
     **compile-forced** off `Record<Justify,string>` etc. (the heading-picker pattern), now unit-tested;
     (b) `edit-model.ts` `TYPOGRAPHIC` set was hand-listed under a comment claiming derivation →
     `Record<Category, boolean>` (compile-forced) + honest comment; (c) the ThemePanel **letterSpacing**
     section was a dead control (no render path consumes it) → `CATEGORY_META.editable` flag + a pure
     `paletteCategories()` that drops it; (d) a blank Theme override left a stale `''` (`--x: ;` / MJML
     `NaNpx`) → `setThemeOverride` deletes the key on blank; (e) a malformed type-scale override could
     ship `line-height="NaNpx"` to email → `mjml.renderText` falls back to the binding ratio on a
     non-finite product (golden-safe). **Net: 242 tests, 100% stmts/funcs/lines + 96% branch on the
     covered set, all gates green;** `edit-model.ts` + `inspector-options.ts` added to the coverage allowlist.
6. **RP-7 — Persistence/reconciliation pure decisions.** Independent; good test ROI; no blocker.
7. **RP-5 — Drag-drop intent resolution.** Independent; valuable but touches neither named feature.
   Do when the drop logic next needs to change.
8. **RP-8 — MJML walk-seam alignment.** Last/optional; ADR-0008 cleanup; only bites when an
   _email-safe_ rich Component is added.

**One-liner:** RP-11 lays the golden safety net; RP-1 gives a tested mutation core with no deps; RP-2
is the keystone everything hangs off; RP-3/RP-4/RP-6 are the two named features riding the keystone;
RP-5/RP-7/RP-8 are independent debt with no feature gate.

---

## 5. Completeness check — dimensions NOT yet covered by any candidate

The candidates cover node-type facts, props modeling, the token graph, typography, and the untested
orchestration. Of the dimensions first flagged here, **RP-9** (typed renderer exhaustiveness) and
**RP-11** (golden-output net) are now **promoted** into §3/§4. **Two genuine gaps remain (RP-10, RP-12)**,
plus a secondary import-audit confirmation:

1. **Typed per-target renderer exhaustiveness (RP-9). ✅ IMPLEMENTED 2026-06-22 (ADR-0008 amended).**
   The silent-emitter gap is closed: the `Emitter<T,C>`'s three named leaf methods became one
   **`leaf: LeafRenderers<T, C>`** field — a mapped type `{ [K in LeafType]: (node, ctx) => T }` over
   `LeafType = Exclude<Node, ContainerNode>['type']` (derived from the union). `walkNode` dispatches
   `'children' in node ? container : emit.leaf[node.type](node)`, so a missing leaf renderer is now a
   _compile_ error at **each** adapter's `leaf` record — not a runtime throw (`mjml.ts:99`) or a blank
   canvas. **Empirically verified by a probe:** a temporary `Divider` leaf errored in only **3** files
   before (walk/mjml/descriptor) but **8** after — every previously-silent target (html / react /
   angular / canvas / editor) now fails to compile, plus mjml (its own `MJML_LEAVES` record, container
   throw kept as a runtime guardrail). Output byte-identical (golden net unchanged). Kept a **library**
   concern, separate from RP-2's editor-runtime descriptor (ADR-0007/0014).
2. **`allowed-children` / structural validity (RP-10) — deferred until the first _compound_ Component,
   mandatory then.** The IR has **no constraint layer** — any node nests in any container. Simple
   leaves (Divider/Spacer/Badge) don't care; but the first _compound_ RAC Component (`Tabs` must contain
   `Tab`s; `RadioGroup → Radio`; `Select → Item`) makes this a **correctness requirement** — without it
   the user drops a `Radio` into a `Grid`, exports, and gets a broken/invalid tree. **Not a standalone
   module:** it's an `allowedChildren`/`slots` **field on RP-2's descriptor**, read by two consumers —
   **RP-5** (drag-intent rejects an invalid drop, carrying a reason for the indicator) and a
   **generalized import audit** (`isEmailFrameClean` → `isFrameValid(descriptor, root)`, one path that
   then rejects email-unsafe _and_ structurally-invalid trees). **Hybrid compile/runtime** — the one
   place pure build-time safety isn't reachable: narrowing the children union
   (`{ type:'RadioGroup'; children: RadioNode[] }`) compile-checks hand-authored IR + the generators,
   but the editor builds trees at runtime (`insertChild` takes a generic `Node`), so the drag-insert
   path needs the descriptor's **runtime** validator.
3. **Export round-trip / golden-output regression net — the most important gap.** ✅ **CLOSED by
   RP-11** (2026-06-22, `src/generators/golden.test.ts` — see §4 step 1). The committed per-target
   snapshot corpus over the full IR vocabulary now catches any emitter regression as a reviewable
   diff. **Residual:** the net covers the four _string_ generators; the React-Aria canvas copies
   (`src/components`) remain E2E-only by deliberate policy — RP-3 must visually verify them (see the
   RP-11 ⚠ note in §4).
   _Original gap (kept for context):_ the plan optimizes _unit_ testability of extracted modules, but
   the stated goal is a codebase you can _safely extend_; `npm run generate` self-checks samples but is
   a build step, not a regression net, so the RP-2/RP-3 refactors would otherwise change emitter
   behaviour with no output-level guard.
4. **IR schema versioning + migration (RP-12) — deferred, by decision.** RP-3 restructures the Text
   node (`variant:'h2'|'body'` → a discriminated union) — a **breaking IR change**. `document.ts` has a
   `version: 1` guard but only _additive_ migrations (`withMigratedOverrides`/`withFrameDefaults`) and
   **no node-shape rewrite**; `isEditorFrame:34-50` never validates `props`, so a legacy Text node would
   pass validation then mis-render under the new renderers (silent corruption). **Decision (no real
   users yet — free to wipe):** do **not** build migration machinery now (the schema is still moving in
   RP-3/RP-4). Adopt the cheap discipline instead — **every breaking IR change bumps `version`; the
   loader resets stale documents** (an explicit wipe, which `isEditorDocument`'s `=== version` check
   already performs, not silent corruption). So RP-3 just bumps to `version: 2` and stale localStorage
   reseeds — no migration code. **Node-shape deep-validation folds into RP-2** (descriptor-driven).
   **Revisit** the full `v1 → vN` migrate path at the first real users / schema-freeze.

_(The former "secondary" import-audit note is folded into RP-10 above: `isFrameValid(descriptor, root)`
is the single descriptor-driven audit that rejects both an imported email-unsafe Component (ADR-0006)
and a structurally-invalid tree before either reaches an Export Target.)_

---

## Appendix A — The extensibility tax today (adding one leaf Component)

Ordered edit sites; **C** = compiler-enforced (forgetting = build error), **S** = silent (forgetting =
runtime gap / blank render, no error).

| #   | File                           | Edit                                                          | Guard                                         |
| --- | ------------------------------ | ------------------------------------------------------------- | --------------------------------------------- |
| 1   | `src/ir/types.ts`              | add `Node` union branch                                       | C (drives the rest)                           |
| 2   | `src/ir/walk.ts`               | `Emitter` method + `walkNode` case (+ `shapeOf` if container) | **C**                                         |
| 3   | `src/generators/leaf-style.ts` | `xxxDecls` function (or `structuralDecls` case)               | partial — `structuralDecls` C, leaf fns **S** |
| 4   | `src/generators/html.ts`       | emitter method                                                | S                                             |
| 5   | `src/generators/react.ts`      | emitter method                                                | S                                             |
| 6   | `src/generators/angular.ts`    | emitter method                                                | S                                             |
| 7   | `src/generators/mjml.ts`       | `renderXxx` + `renderLeaf` case                               | S (throws at runtime)                         |
| 8   | `src/components/<Comp>.tsx`    | React-Aria component                                          | —                                             |
| 9   | `src/components/canvas.tsx`    | emitter method                                                | S                                             |
| 10  | `src/editor/EditableNode.tsx`  | emitter method                                                | S                                             |
| 11  | `src/editor/palette.ts`        | `PALETTE` entry                                               | S                                             |
| 12  | `src/editor/frames.ts`         | `EMAIL_UNSAFE` (if unsafe)                                    | S                                             |
| 13  | `src/editor/Inspector.tsx`     | editable/container guard + controls                           | S                                             |
| 14  | `src/editor/useCanvasA11y.ts`  | `describe()` case                                             | S                                             |

**~14 sites, ~10 silent.** RP-2 collapses 9-14 to one descriptor row; RP-9 (completeness §5.1) would
make 4-7, 9-10 compile-exhaustive.

## Appendix B — Typography hardcoding inventory (verified `file:line`)

| Location                        | Hardcoded literal                                     | Should be                                                |
| ------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| `tokens.json:18-23`             | `font` = `{family, h2, body, line}` only              | + weight, line-height, letter-spacing / composite tokens |
| `leaf-style.ts:78`              | `lineHeight: h2 ? '1.25' : var(--font-line)`          | token ref (`font.line.heading`)                          |
| `leaf-style.ts:80`              | `fontWeight: '700'` (h2)                              | token ref (`font.weight.heading`)                        |
| `leaf-style.ts:92`              | `fontWeight: '600'` (button base)                     | token ref (`font.weight.button`)                         |
| `mjml.ts` `renderText`          | `line-height="1.25"`, `font-weight="700"/"400"`       | resolved literals from binding                           |
| `mjml.ts` `renderButton`        | `font-weight="600"`                                   | resolved literal from binding                            |
| `src/components/primitives.tsx` | `lineHeight: 1.25`, `fontWeight: 700` (canvas copy)   | token-driven via component layer                         |
| `src/components/Button.tsx`     | `fontWeight: 600` (canvas copy)                       | token-driven                                             |
| `types.ts:43,46`                | `variant: 'h2' \| 'body'`, `'primary' \| 'secondary'` | type-scale enum sourced from bindings                    |
| `Inspector.tsx`                 | Text nodes get no style section (container-gated)     | per-node-type Typography controls (RP-6)                 |

The same three literals (`1.25`, `700`, `600`) appear in **three** per-target copies — the exact
duplication RP-3's binding table removes.

## Appendix C — The Design-Token system map (for RP-3 / RP-4 grilling)

- **Source:** `src/theme/tokens.json` (hand-authored DTCG) → Style Dictionary
  (`style-dictionary.config.mjs`, `token-category.mjs`) → **two outputs**: `theme.css` /
  `theme.scoped.css` (CSS vars, web + live canvas) and `tokens.catalog.json` (resolved literals,
  email). Run via `npm run tokens`.
- **Model:** `src/theme/design-tokens.ts` — the `Catalog` (`get`/`byCategory`/`resolveVar`/
  `resolveLiteral`/`withOverrides`/`fromKebab`); `Category = color|space|radius|font`;
  `STYLE_KEYS` (flat container map). Dot-ref is the canonical id; kebab `cssVarName` is SD-derived.
- **Consumers:** `leaf-style.ts` `containerDecls` (string targets, `resolveVar`); `src/components/tokens.ts`
  (React side, parallel home per ADR-0008); `mjml.ts` (`withOverrides` → literals); `Inspector.tsx` /
  `ThemePanel.tsx` (`byCategory` pickers/swatches); `Editor.tsx` `buildOverrideCss` (live theming
  scoped to `.ed-board-content`, ADR-0007 golden rule).
- **Growth path (RP-3/RP-4):** add weight/line/composite font tokens; make `STYLE_KEYS`
  per-node-type (or descriptor-owned); auto-discover categories in UI. The dual-output + override
  machinery already supports arbitrary refs — composite **typography** tokens (aliasing primitives)
  unpack via Style Dictionary's `expand` into per-property web/email output, not in the Catalog.
