# Application chrome: AppBar, navigation, breadcrumb (+ a zero-spacing token)

EasyDesign gained the pieces a real web page needs around an `AppShell` (ADR-0017): a top **AppBar**
(branding + actions), **TopNav** (horizontal menu) and **SideNav** (vertical rail) navigation, a
**Breadcrumb** trail, and the **NavLink** they are built from. It also gained an explicit **zero**
spacing token so layout chrome can sit edge-to-edge. Nothing here is a new seam — every part reuses the
component-container / slot-child machinery (ADR-0016) and the Node Walk's compile-forced exhaustiveness
(ADR-0008/0009 era), exactly as `AppShell` did. This is the fourth–eighth Components on that seam.

## The problem

`AppShell` gives the page its grid, but the regions had nothing semantic to hold. Composing chrome from
`Row`/`Stack`/`Button` produces the wrong markup for the flagship clean-export value (ADR-0002):

1. **A menu of `<button>`s is wrong, inaccessible HTML.** Navigation must export as `<nav>` landmarks
   of `<a href>` anchors (with `aria-current` on the current page), and a breadcrumb as
   `<nav aria-label="Breadcrumb"><ol>` — none of which a `Row` of `Button`s emits (it emits `<div>` /
   `<a href="#">` pressables).
2. **No explicit zero.** The Inspector's only "no spacing" was the `Default` row, which _clears_ the
   key. That is ambiguous (it reads as "use some default", not "none") and lossy: MJML falls a missing
   `padding` back to `space.lg`. A full-bleed AppBar / butted-together rail (the canonical app layout,
   separated by background color, not gaps) had no first-class expression.

## Decision 1 — navigation/application chrome are COMPONENT containers, not layout boxes

To emit a _specific element_ (`<header>`, `<nav>`, `<nav><ol>`) rather than a styled `<div>`, the new
nodes join `ComponentContainerType` (ADR-0016/0017) and dispatch through `emit.component` — the same
generalisation `AppShell` made ("renders bespoke per target", not "renders as a named RAC Component").
Five adapters light up per node (html / react / angular / canvas / editor); MJML is bespoke (ADR-0008)
and only needs a compile-forced `unsupported` arm. Their internal flex (row/column, breadcrumb `<ol>`)
lives in their β (`leaf-style.ts` for the string targets, `components/Nav.tsx` for the React runtime),
mirroring how `radioGroupDecls`/`appShellDecls` work — not in a shared layout `shape`.

## Decision 2 — NavLink is the slot leaf; the menus are constrained to it

`NavLink` (`{ label, href, active? }`) is a leaf that renders `<a href>` (+ `aria-current="page"` when
`active`). `TopNav`/`SideNav`/`Breadcrumb` set `allowedChildren: ['NavLink']` and narrow
`children: NavLinkNode[]` — the exact `RadioGroup → Radio` slot pattern (compile half + runtime
`canContain`/`isFrameValid` half). So a menu can hold _only_ links, a `NavLink` can land _only_ in a
menu (it is a `RESTRICTED_CHILD_TYPE`), and the drop validator shows it blocked elsewhere. A `NavLink`
is draggable from the palette like `Radio` — it just refuses every non-menu parent.

## Decision 3 — AppBar is the one OPEN component container

The AppBar renders a semantic `<header>` (flex row, brand left / actions right via `space-between`) but
admits **any** child (no `allowedChildren`), so the user composes it freely — a brand `Text`/`Image`, a
`TopNav`, action `Button`s. This proves "component container" and "constrained children" are
**orthogonal**: bespoke rendering does not require a slot rule. The descriptor test's
"component-container ⇒ `allowedChildren` defined" invariant was relaxed to exempt the open AppBar.

## Decision 4 — web-only, like Grid / AppShell

All five are `emailSafe: false` (ADR-0006): navigation/app chrome has no MJML equivalent. The rule
derives from the descriptor (`EMAIL_UNSAFE_TYPES`), so the Palette lock, the drop guard, and the import
audit all follow for free; MJML's `classifyCardChild` gains compile-forced `unsupported` arms and
`MJML_LEAVES[NavLink]` throws as a guardrail (never reached in a valid email tree, like `Radio`).

## Decision 5 — `space.none` (0px), not a literal or a special marker

The zero-spacing fix is a single DTCG token: `space.none: 0px` in `tokens.json`. `StyleMap` stays
`Record<string, TokenRef>` — no literals, no `__zero__` sentinel — so the change **auto-flows** with
zero generator code: it appears in the Inspector's padding/gap pickers as `none · 0px` (the catalog's
`byCategory('space')`), resolves to `var(--space-none)` for web and the `0px` literal for email, and
lands in the Design Palette. It is the discoverable, predictable, round-trip-safe "None" the `Default`
clear-row never was.

## `NavLink.active` editing is a deferred follow-up

`active` lives in the IR and the generators honour it (`aria-current` + brand/semibold styling); a fresh
`Breadcrumb` seeds its last crumb active (the WAI-ARIA breadcrumb pattern keeps the current page a link
with `aria-current`). An Inspector toggle to flip it (a new boolean control kind) is out of scope here.

## Consequences

- A real page is now buildable: `AppShell` (header/left/main/footer) hosting an `AppBar`, `SideNav`, and
  `Breadcrumb` — see `sampleAppLayout` (`src/ir/sample.ts`), exported to HTML + the live canvas by
  `pnpm generate` (`app-layout.html`, `app-layout-canvas.html`) with semantic-landmark self-checks.
- Eight Components now ride the ADR-0016 seam: RadioGroup, AppShell, AppBar, TopNav, SideNav, and
  Breadcrumb, plus the Radio/Region/NavLink slot leaves. Each addition is still "one descriptor row and
  the adapters the compiler demands", the cost ADR-0016 priced in.
- Cost: per node, five bespoke renderers + a β entry (the standard component-container price), and a
  `Nav.tsx` React home alongside `AppShell.tsx`/`RadioGroup.tsx`.
- `space.none` is permanent surface in every spacing picker; tests pin its resolution, its appearance in
  the picker, the semantic export of each chrome Component on all three web targets, the email locks,
  and the slot/open `canContain` rules.
