# Email as an explicit restricted mode (target-aware Frames)

Full-fidelity email is impossible — MJML cannot express grids, interactive widgets, shadows/
gradients, or arbitrary breakpoints. Rather than let users build designs that silently break on
email export, **a Frame carries a target medium fixed at creation**:

- **Web** Frame → exports to React, Angular, or static HTML **interchangeably** (these three share
  the structured layout model and the CSS-variable theming path).
- **Email** Frame → the palette is **restricted to email-safe Components and layout** (Stack / Row /
  Column, no Grid, no interactive widgets), so the board stays true WYSIWYG and the MJML export can
  never be broken.

**Why (Model A over Model B).** The rejected alternative ("universal Frame + a pre-export linter
that flags/substitutes incompatibilities") preserves "any Frame → any of all four targets" but adds
build complexity and can still surprise users. Model A is the most beginner-proof — you cannot
construct a broken email — and it matches the product's own framing ("export to React **or** Angular
**or** HTML **or** MJML"). A marketing email and an app screen are different artifacts users rarely
want byte-identical, so the lost "design once → both" promise costs little.

**Consequences.** Email mode can ship in a later phase (start web-only) and slots in cleanly. The
common email shapes map predictably (Stack→`mj-section`, Row→columns, Text/Button/Image/Divider→
their `mj-*` tags); Grid, interactivity, and effects are simply absent from email Frames by
construction rather than failing at export.
