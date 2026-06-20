# Responsive layout is deferred (it needs stylesheet emission + a breakpoint model)

The container layout properties **justify / align / wrap** are supported as static, single-breakpoint
flexbox/grid settings (an optional `props` on each Layout element, threaded through the Node Walk —
ADR-0008). **Responsive** layout — properties or stacking that vary by viewport — is deliberately **not**
implemented yet; it is deferred to its own design pass.

**Why.** It is not a property addition; it is an architectural change on two fronts:

- **Web exports emit inline styles, which cannot carry media or container queries.** Responsive forces
  the HTML / React / Angular generators to move from inline `style="…"` to a generated **stylesheet +
  classes** — a different output shape for three Export Targets and the live canvas.
- **It needs a breakpoint model in the Theme** (ADR-0004): named breakpoints as Design Tokens, and a
  value model for "this token at this breakpoint." That touches the theming spine, not just the IR.
- **It is target-asymmetric.** MJML is already responsive — `mj-column` stacks on mobile by default — so
  email gets responsiveness "for free" while web must be built; a single IR representation has to map to
  both cleanly.

**Consequences.** When taken up, expect: a new generator output mode (class + stylesheet, not inline);
a breakpoint Design-Token category; an MJML mapping that leans on native column stacking; and a decision
about whether responsive values are per-breakpoint token refs or a small set of named layout behaviors
(e.g. "Row stacks below `sm`"). Until then, a design is single-breakpoint, and justify/align/wrap are the
extent of the layout-flexibility surface. Revisit this ADR before adding any breakpoint-varying styling.
