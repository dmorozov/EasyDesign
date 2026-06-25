# Common design components: Paper, Stepper, Tool Bar, Menu Bar, and the display-only Divider/Spacer

EasyDesign gained five everyday design primitives on top of the existing seams: a **Paper** surface, a
**Stepper**, a **Tool Bar**, a **Menu Bar**, and the display-only **Divider**/**Spacer**. None is a new
seam — each reuses the layout-container path (ADR-0008) or the component-container / slot-child machinery
(ADR-0016/0019) and the compile-forced exhaustiveness of the Node Walk. This is also the deliberate
end-to-end exercise of **Capability A** ("add more Components"): a _display-only_ Component (Divider/Spacer)
needs only the render/export half — one descriptor row + the renderers the compiler demands — and **no**
editing half. The editor's drop / frames / paths / a11y / node-label modules are descriptor- or
union-driven, so they took **zero** per-type edits.

## Decision 1 — Paper is a LAYOUT container, not a component container

`Paper` is a surface the user fills, structurally a flow column like `Stack`, distinguished only by its
surface default styling (`background`/`padding`/`borderRadius` from `create()`). So it joins `shapeOf` and
renders through the shared `container()` on all five targets — no bespoke per-target renderer, and it reuses
every layout control (justify/align/wrap + the container style keys). It renders a `<div>` (a Paper _is_ a
styled div, like MUI's Paper); a semantic `<section>` would have cost a component-container's five bespoke
renderers for no clean-export gain. **Web-only** (`emailSafe:false`, like Grid/AppShell): the MJML flattener
only handles the root Stack + Rows + leaf-runs, so a nested surface can't flatten (ADR-0006).

## Decision 2 — Stepper / Tool Bar / Menu Bar are COMPONENT containers; variants are palette presets

Each renders a _specific element_ (`<ol>`, `<div role="toolbar">`, `<nav><ul>`), so they dispatch through
`emit.component` (ADR-0016), with a compile-forced renderer per web target and a bespoke MJML `unsupported`
arm. Their slot children follow the `RadioGroup → Radio` pattern: **Stepper → `Step`**, **Tool Bar →
`ToolButton`** (new slot leaves), and **Menu Bar → `NavLink`** (reusing the existing nav slot leaf). All are
web-only.

The parentheticals in the request ("Stepper (vertical, horizontal)", "buttons with/without labels") map to
the codebase's established **"parenthetical = palette variant"** idiom (the two Buttons, the Heading/Text
split), not to new Inspector controls:

- **Stepper orientation** is two palette presets over one seed (`makeStepper('horizontal' | 'vertical')`).
- **"buttons with/without labels"** is a property of each `ToolButton`: it renders its icon plus the label
  text _only when non-empty_, so clearing the label yields an icon-only button.

Following the `NavLink.active` precedent (ADR-0019), the **enum/visual state that the renderers honour but
the Inspector doesn't yet edit is a deferred follow-up**: `Step.status` (drives the badge + `aria-current`),
`Stepper.orientation` (set at creation), and `ToolButton.icon` (seeded; the icon picker is deferred). The
editable props are the `label` text fields (descriptor `textFields`), which flow through the existing
generic `setTextProp` — so Tool Bar edits its accessible name, a Step its label, a ToolButton its label.

## Decision 3 — Divider/Spacer are display-only leaves (the Capability-A proof)

Both carry **no props and no editing half** (no `textFields`, `controls`, or `styleKeys`) — the purest
demonstration that a display-only Component is "one descriptor row + the compile-forced leaf renderers".

- **Divider** is the one **email-SAFE** new Component: a semantic `<hr>` on web and `<mj-divider>` in email,
  so it reaches **all four** export targets (and compiles under MJML strict validation — proven in the
  generate self-check and the `divider` golden fixture). It is the end-to-end Capability-A path.
- **Spacer** is a flexible `flex:1` gap (Chakra-style) that pushes siblings apart. Flex has no equivalent in
  email's table model, so it is web-only and its MJML leaf is a throwing guardrail (like Radio/NavLink) —
  exercising the email-unsafe leaf path.

## Decision 4 — ToolButton icons inline ONE SVG source, shared by export and canvas

The IR/export layer must not import the chrome icon set (ADR-0007), and the SSR generate runner can't render
it. So the icon glyphs live once as raw inner-SVG markup in `generators/toolbar-icons.ts`, keyed by a small
`ToolIcon` union (its own string literals, copied from the design-system `Icon` set). The string targets
inline `<svg>{inner}</svg>` — presentation kept in `style` (not SVG attributes) so the **same** inner markup
serializes for HTML's string style and React's object style — and the canvas injects it via
`dangerouslySetInnerHTML`. One source ⇒ the live preview and the exported markup never drift, and the canvas
never pulls in `icons.jsx`. An icon-only ToolButton's accessible name comes from `TOOL_ICON_LABEL` (a human
name, not the developer key — WCAG 4.1.2), again from the single source.

## Decision 5 — Menu Bar is a semantic `<nav><ul>` nav bar, NOT `role="menubar"`

A Menu Bar was scoped as the "File/Edit/View application menu" (`role="menubar"`). On implementation that
ARIA contract proved **wrong** for this component: `role="menubar"` is the widget pattern for application
_command_ menus — it _requires_ `role="menuitem"` children plus roving-tabindex/arrow-key handling (which a
static export can't provide), and `menuitem` overrides the link semantics of real `<a href>` navigation,
which these are. A `role="menubar"` whose items are plain links is invalid ARIA (`aria-required-children`)
and announces an empty menubar. So Menu Bar renders a **valid, accessible navigation bar** —
`<nav aria-label="Menu"><ul>` of `<li>` links, the current one keeping `aria-current="page"` — kept distinct
from `TopNav`'s bare inline links by the list/bar structure and surface styling. (A future strict menubar
_widget_ would need its own slot leaf emitting `role="menuitem"` + exported keyboard JS — out of scope.)

## Consequences

- Thirteen Components now ride the ADR-0016 seam (RadioGroup, AppShell, AppBar, TopNav, SideNav, Breadcrumb,
  MenuBar, Stepper, ToolBar, plus the Radio/Region/NavLink/Step/ToolButton slot leaves), plus Paper on the
  layout-container path and Divider/Spacer as display-only leaves. Each addition stayed "one descriptor row
  and the adapters the compiler demands".
- **Valid list markup.** A Stepper's connector and a Menu Bar's items are wrapped so `<ol>`/`<ul>` contain
  only `<li>` (the connector is an `aria-hidden` `<li>`, still an `<ol>`-level flex sibling) — caught by an
  adversarial review, not the linter.
- **`dedupeDecls`** collapses a list reset (`padding:0`/`margin:0`) plus a token override into one clean
  declaration, so the exported React `style` object never carries a duplicate key (applied to every
  reset-plus-token list emitter).
- Coverage: golden fixtures per new component (incl. `divider` across all four targets), behavioral tests
  asserting the semantic markup + the email-safety boundary, descriptor/`canContain` slot-rule tests, and a
  showcase in `sampleCard` (the email Divider) + `sampleAppLayout` (the web components) with generate
  self-checks. No new design tokens (Divider reuses `color.muted`).
- Deferred: editing `Step.status`, `Stepper.orientation`, and `ToolButton.icon` (a status/orientation
  control + an icon picker), and a true `role="menubar"` widget — all following the `NavLink.active`
  deferral precedent.
