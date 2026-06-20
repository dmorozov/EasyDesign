# Generator contract (frozen)

All four generators consume `src/ir.ts` (`Frame` / `Node`) and the compiled tokens. **Web targets
must produce visually identical DOM**; the email target maps onto MJML's grid with resolved literals.

## Inputs
- `src/ir.ts` — `sampleCard: Frame` and the `Node` union.
- `build/theme.css` — `:root { --color-brand: …; --space-md: …; … }` (web).
- `build/tokens.literals.json` — flat `{ "color-brand": "#4f46e5", "space-md": "16px", … }` (email).

## Token ref → name mapping
A style value `"color.surface"` maps to CSS var `var(--color-surface)` (web) and to the literal
`tokens.literals.json["color-surface"]` (email). Rule: dot-path → kebab, prefixed `--` for CSS.

## Node → web output (HTML / React / Angular must match)
Emit inline `style` using `var(--…)` for any token-bound property; literal CSS for fixed bits.

| Node | Web markup (semantic) |
|---|---|
| `Stack` | `<div>` `display:flex; flex-direction:column;` + its `style` map (gap/background/padding/borderRadius → vars) |
| `Row` | `<div>` `display:flex; flex-direction:row;` + `gap` var. Each direct child wrapped so it sits side-by-side with `flex:1` |
| `Column` | `<div>` `display:flex; flex-direction:column;` + `style` |
| `Text` h2 | `<h2 style="margin:0; font-family:var(--font-family); font-size:var(--font-h2); line-height:1.25; color:var(--color-text); font-weight:700">content</h2>` |
| `Text` body | `<p style="margin:0; font-family:var(--font-family); font-size:var(--font-body); line-height:var(--font-line); color:var(--color-text)">content</p>` |
| `Button` primary | `<a style="display:inline-block; text-align:center; text-decoration:none; padding:var(--space-sm) var(--space-md); border-radius:var(--radius-lg); background:var(--color-brand); color:var(--color-on-brand); font-family:var(--font-family); font-size:var(--font-body); font-weight:600">content</a>` |
| `Button` secondary | as primary but `background:transparent; color:var(--color-brand); border:1px solid var(--color-brand)` |
| `Image` | `<img src alt style="display:block; width:100%; max-width:{width}px; height:auto; border-radius:var(--radius-lg)">` |

- **React**: same markup as `.tsx`; `style` becomes a JSX style object (camelCase keys); `class` → `className`. Verify via `renderToStaticMarkup`.
- **Angular**: one standalone component, inline template mirroring the HTML; use `@if`/`@for` only if needed (the sample is static, so a literal template is fine). Must typecheck against `@angular/core`.

## Node → email output (MJML, resolved literals)
MJML can't nest sections in columns, so the tree FLATTENS to a sequence of sections:
- `Frame` → `<mjml><mj-body background-color="{color-page}"> … </mj-body></mjml>`
- top `Stack` (card) → `<mj-section background-color="{color-surface}" padding="{space-lg}" border-radius="{radius-lg}"><mj-column> …leaf children… </mj-column></mj-section>`
- a nested `Row` → its OWN sibling `<mj-section>` with one `<mj-column>` per child (this is the Row→two-column mapping). Give it the surface background so the card reads as continuous; **note this flattening as a finding**.
- `Text` h2/body → `<mj-text font-size font-family color line-height>`
- `Button` → `<mj-button background-color color border-radius href="#">` (primary = brand bg; secondary = transparent bg + brand border/text via css-class or `border`)
- `Image` → `<mj-image src alt width="{width}px">`
Compile with `mjml()` and confirm it returns `errors: []`.

## Output locations
- `out/html/index.html` — standalone (inlines/links `build/theme.css`)
- `out/react/Card.tsx` + the rendered string at `out/react/index.html`
- `out/angular/card.component.ts`
- `out/email/email.mjml` + compiled `out/email/index.html`
