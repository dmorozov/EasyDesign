# Typography: DTCG composite Text styles over an editable primitive scale; a codegen step derives the union + binding the renderers resolve

Typography is now a token graph, not the hard-coded `lineHeight '1.25'` / `fontWeight '700'` / `'600'`
literals that the Theme could never reach (the §Appendix-B disease). Two layers in `tokens.json`:

- **Primitives — the editable Type scale.** `font.size.*`, `font.weight.*`, `font.lineHeight.*`,
  `font.letterSpacing.*` (DTCG `dimension` / `fontWeight` / `number`). These are the queryable Design
  Tokens — the catalog carries them, the Design Palette edits them, editing one re-themes everything.
- **Composite `text.*` Text styles — picked whole.** DTCG `$type: "typography"` tokens whose sub-values
  **alias** the primitives (`text.h2 = { fontSize:'{font.size.2xl}', fontWeight:'{font.weight.bold}',
lineHeight:'{font.lineHeight.tight}' }`). The user picks a style; they never edit its parts. This maps
  CONTEXT.md exactly: **Type scale** = the editable primitives, **Text style** = a fixed named binding.

A custom Style Dictionary format **codegens** `src/theme/generated/typography.ts` from the graph: the
`TextStyle` union (`'h1'|'h2'|'h3'|'body'|'caption'|'label'`), the `FontSizeRef`/`FontWeightRef` step
unions, and **`TEXT_STYLE_BINDING`** (each style → the primitive refs it aliases, read from the
_unresolved_ `original.$value`). The IR's `variant` is `TextStyle`; the renderers resolve the binding —
`leaf-style`/`primitives.tsx` to primitive `var()`s, `mjml` to primitive literals. Adding a heading =
**one composite token**; the types and the binding follow. There is no hand-authored binding table.

**Why composite tokens at all, since the render resolves to primitives.** Interop. Figma Variables /
Tokens Studio and other DTCG tools speak composite `typography` — keeping the named styles as DTCG
composites means a future import/export round-trips, and it makes the composites the **single source**
the codegen reads (so the binding can't drift from the authored styles). The composites are
authoring + interop + codegen-source; they are deliberately _not_ runtime CSS vars (filtered out of the
css/catalog platforms), because the render uses the primitives they bind to.

**Why the binding, not expanded composite CSS vars.** A ~1 hr gating spike confirmed the grilled
fallback works — SD `expand` + `outputReferences:true` _does_ preserve a composite's aliased sub-value
as a reference (`--text-h2-font-size: var(--font-size-lg)`), with email getting the literal. But routing
the render through the codegen'd binding to the **primitives directly** is strictly simpler and equal in
capability: the catalog stays primitives-only (no composite-sub-token pollution in the `fontSize`
picker), re-theming still flows from editing a primitive, and there is no `expand`/`typesMap` config to
maintain. The composite layer is the first thing to drop if token interop is ever deferred — then the
primitives + codegen'd unions alone suffice.

**Free-form text.** A Text style is the _base_; a node may override `fontSize`/`fontWeight` via its
`style` map — **still a Type-scale ref, never a raw value** (CONTEXT.md). The descriptor exposes those
two as Text's `styleKeys` (RP-4); the store's style gate is now descriptor-driven (RP-1/RP-4), so a Text
leaf accepts them where the old blanket container-gate refused.

**Consequences.**

- **Extends ADR-0004** (the dual-output spine now covers typography) and **ADR-0008** (the new β homes —
  `leaf-style.textDecls` for strings, `components/tokens.textCssVars` for the canvas — resolve the
  binding; the keyword↔CSS duplication stays one-home-per-side). The catalog `Category` grew fine-grained
  (`fontSize`/`fontWeight`/`lineHeight`/`letterSpacing`/`fontFamily`, RP-4) so a "pick weight" picker
  sources only weights — `categoryOf` derives it by path, and the same `byCategory` feeds RP-3's codegen.
- **MJML Outlook fix.** `mj-text line-height` is now resolved to **px** (`size × ratio`), not the
  decimal-unitless value Outlook treats as a percentage and rounds — the live bug at the old `mjml.ts:42`.
- **No schema migration (RP-12 not triggered).** `variant` widened from `'h2'|'body'` to `TextStyle`
  (those two remain valid) and free-form is additive `style` keys, so existing saved documents load
  unchanged — no `version` bump, no reset. The breaking-IR case the plan anticipated did not arise.
- **Guarded by RP-11.** The golden net caught every emitter change as a reviewed diff — web now emits
  `var(--font-line-height-tight)` / `var(--font-weight-bold)` where raw literals used to be; MJML keeps
  the same font-size/weight literals with px line-heights. The canvas copies (`primitives.tsx`,
  `Button.tsx`) — outside the vitest net — were verified via `npm run generate`'s SSR self-check.
- **Deferred to RP-6** (the Inspector editing surface): the **heading-style picker** (switching a Text's
  `variant`) and the full `resolveEditModel` refactor. RP-3/RP-4 ship the model + render + the free-form
  size/weight pickers; `CATEGORY_META` + the ThemePanel Type-scale section ride with RP-6's UI pass.
