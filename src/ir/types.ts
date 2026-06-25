// EasyDesign IR (ADR-0002, ADR-0003).
// A Frame's contents are a STRUCTURED TREE of nodes — never absolute {x,y}.
// `style` values are token references in dot notation (e.g. "color.surface"),
// resolved to var(--color-surface) for web and to literals for email.

import { type TextStyle } from '../theme/generated/typography';

import { type RegionArea } from './appshell';

export type { RegionArea };

export type TokenRef = string; // dot path into the token graph, e.g. "space.md"
export type StyleMap = Record<string, TokenRef>;

// Friendly, target-agnostic layout keywords (mapped to CSS per Export Target —
// 'start' -> flex-start, etc.). Plain language in the IR; CSS jargon stays in the
// generators / component layer.
export type Justify = 'start' | 'center' | 'end' | 'space-between' | 'space-around';
export type Align = 'start' | 'center' | 'end' | 'stretch';
export type Wrap = 'nowrap' | 'wrap';

/** Optional layout controls shared by the flow containers (Stack/Row/Column). */
export interface FlowProps {
  justify?: Justify;
  align?: Align;
  wrap?: Wrap;
}

// How a Row distributes children along the main axis. 'fit' (default) = each child
// sizes to its content, so justify/wrap are meaningful; 'fill' = every child grows
// equally (flex:1) into equal columns, so justify has no free space to act on.
export type Distribute = 'fit' | 'fill';

/** Row also chooses how to distribute its children; Stack/Column always fit. */
export interface RowProps extends FlowProps {
  distribute?: Distribute;
}

/** A single option inside a RadioGroup. A leaf whose ONLY valid parent is RadioGroup — the first
 *  "slot" child (RP-10 / ADR-0016). The parent constraint is enforced by the descriptor's
 *  `allowedChildren` at runtime and by `RadioGroup.children: RadioNode[]` at compile time. */
export interface RadioNode {
  type: 'Radio';
  props: { value: string; label: string };
  style?: StyleMap;
}

/** A panel inside an AppShell (ADR-0017). Renders like a Stack (flow column) but also NAMES the grid
 *  `area` it occupies; its only valid parent is AppShell (the descriptor's `allowedChildren` at
 *  runtime + `AppShell.children: RegionNode[]` at compile time). Created only by AppShell — never a
 *  free palette item. `main` is required; the rest are optional. */
export interface RegionNode {
  type: 'Region';
  props: { area: RegionArea; justify?: Justify; align?: Align; wrap?: Wrap };
  style?: StyleMap;
  children: Node[];
}

/** A navigation link (ADR-0019). A leaf that renders as a semantic `<a href>` (NOT a `<button>` — a
 *  menu of buttons is wrong, inaccessible markup), with `active` marking the current page (→ `aria-
 *  current`). Its ONLY valid parents are the navigation Components (TopNav/SideNav/Breadcrumb) and the
 *  application MenuBar — the descriptor's `allowedChildren` at runtime + the parents'
 *  `children: NavLinkNode[]` at compile time. */
export interface NavLinkNode {
  type: 'NavLink';
  props: { label: string; href: string; active?: boolean };
  style?: StyleMap;
}

/** One step in a Stepper. A leaf whose ONLY valid parent is Stepper (the slot pattern — descriptor
 *  `allowedChildren` at runtime + `Stepper.children: StepNode[]` at compile time). `status` drives the
 *  rendered badge (a number, a check when `complete`) + `aria-current="step"` when `current`; like
 *  `NavLink.active`, editing it is a deferred follow-up (the `label` is the editable prop). */
export type StepStatus = 'complete' | 'current' | 'upcoming';
export interface StepNode {
  type: 'Step';
  props: { label: string; status: StepStatus };
  style?: StyleMap;
}

/** The curated icon set a ToolButton may show. Kept as its own string union (NOT the chrome `IconName`)
 *  so the dependency-free IR never imports the design-system (ADR-0007); the values are chosen to match
 *  `IconName` keys so the canvas can render `<Icon[icon]>`, while the export targets inline the matching
 *  SVG from `generators/toolbar-icons.ts`. */
export type ToolIcon =
  | 'undo'
  | 'redo'
  | 'copy'
  | 'trash'
  | 'image'
  | 'code'
  | 'search'
  | 'alignL'
  | 'alignC'
  | 'alignR';

/** One button in a Tool Bar. A leaf whose ONLY valid parent is ToolBar (the slot pattern). Renders a
 *  `<button>` showing `icon`, plus the `label` text only when non-empty — so clearing the label yields
 *  an icon-only button ("buttons with/without labels"). The icon picker is a deferred follow-up. */
export interface ToolButtonNode {
  type: 'ToolButton';
  props: { icon: ToolIcon; label: string };
  style?: StyleMap;
}

/** One cell in a Data Table. A leaf whose ONLY valid parent is TableRow (the slot pattern — descriptor
 *  `allowedChildren` at runtime + `TableRow.children: TableCellNode[]` at compile time). It holds plain
 *  text (`content`, the editable prop); the ROW renders it into a `<th scope="col">` (header row) or
 *  `<td>` (body row). Plain text is exactly what email's `<mj-table>` accepts, which is what lets the
 *  Data Table reach all four targets (the 2nd email-SAFE Component after Divider — ADR-0021). */
export interface TableCellNode {
  type: 'TableCell';
  props: { content: string };
  style?: StyleMap;
}

/** One row in a Data Table. A COMPONENT container CONSTRAINED to TableCell (compile half:
 *  `children: TableCellNode[]`; runtime half: allowedChildren + canContain). `header` is the SINGLE
 *  source of truth for header-ness: a header row's cells render as `<th scope="col">` inside `<thead>`,
 *  a body row's as `<td>` inside `<tbody>` (set at creation via the two palette presets, like the two
 *  Buttons — editing it is a deferred follow-up, ADR-0021). */
export interface TableRowNode {
  type: 'TableRow';
  props: { header: boolean };
  style?: StyleMap;
  children: TableCellNode[];
}

/** One panel inside a Tabs Component (ADR-0022). A COMPONENT container that is OPEN — its body holds any
 *  content, so it omits `allowedChildren` (the AppBar/Region precedent) — yet RESTRICTED to live only
 *  inside Tabs (compile half: `Tabs.children: TabPanelNode[]`; runtime half: Tabs' `allowedChildren` +
 *  canContain). `label` is the editable tab title: the Tabs renderer reads each panel's `label` to build
 *  the `<div role="tablist">`, exactly as DataTable reads each row's `header`. Web-only (interactive tabs
 *  have no MJML model). */
export interface TabPanelNode {
  type: 'TabPanel';
  props: { label: string };
  style?: StyleMap;
  children: Node[];
}

/** One collapsible section inside an Accordion (ADR-0022). Like TabPanel, an OPEN container (arbitrary
 *  body content) that is RESTRICTED to live only inside Accordion. Renders as a native `<details>`:
 *  `title` is the `<summary>`, `open` seeds the expanded state. Web-only. */
export interface AccordionItemNode {
  type: 'AccordionItem';
  props: { title: string; open: boolean };
  style?: StyleMap;
  children: Node[];
}

export type Node =
  | { type: 'Stack'; props?: FlowProps; style?: StyleMap; children: Node[] }
  | { type: 'Row'; props?: RowProps; style?: StyleMap; children: Node[] }
  | { type: 'Column'; props?: FlowProps; style?: StyleMap; children: Node[] }
  | {
      type: 'Grid';
      props: { columns: number; justify?: Justify; align?: Align };
      style?: StyleMap;
      children: Node[];
    }
  // Paper is a surface LAYOUT container: a flow column (like Stack) rendered as a styled `<div>` surface
  // (its `create()` seeds background/padding/borderRadius defaults). It shares the layout `shapeOf`/
  // `container()` path, so it needs no bespoke per-target renderer. Web-only (emailSafe:false): the MJML
  // flattener only handles the root Stack + Rows + leaf-runs, so a nested surface can't flatten (ADR-0006).
  | { type: 'Paper'; props?: FlowProps; style?: StyleMap; children: Node[] }
  // RadioGroup is the first COMPOUND Component: a container that renders as a specific Component (a RAC
  // RadioGroup, not a layout box) and whose children are CONSTRAINED to Radio. The narrowed
  // `children: RadioNode[]` is RP-10's compile-time half (hand-authored IR + the generators can't put a
  // non-Radio here); the editor's runtime drop validator (canContain) is the other half. ADR-0016.
  | { type: 'RadioGroup'; props: { label: string }; style?: StyleMap; children: RadioNode[] }
  | RadioNode
  // AppShell (ADR-0017) is a COMPOUND layout Component: a CSS-grid application shell whose grid template
  // is COMPUTED from its present Region children (appShellTemplate). It renders as a computed grid box,
  // not a layout *shape*, so — like RadioGroup — it dispatches via `emit.component`, not `shapeOf`.
  // Web-only (emailSafe:false). Children CONSTRAINED to Region (compile + runtime halves, as above).
  | { type: 'AppShell'; style?: StyleMap; children: RegionNode[] }
  | RegionNode
  // Navigation chrome (ADR-0019): semantic application-layout Components. Like RadioGroup/AppShell they
  // render as a SPECIFIC element (a `<nav>`), not a layout box, so they dispatch via `emit.component`.
  // AppBar is the top application bar — an OPEN component container rendered as a <header> (flex row,
  // brand left / actions right via space-between). Unlike the nav menus it admits any child (a brand
  // Text/Image + a TopNav + action Buttons), so it has no `allowedChildren`. Web-only (emailSafe:false).
  | { type: 'AppBar'; style?: StyleMap; children: Node[] }
  // TopNav is a horizontal menu, SideNav a vertical one, Breadcrumb a trail (rendered as <nav><ol>); all
  // three are CONSTRAINED to NavLink (compile half: `NavLinkNode[]`; runtime half: allowedChildren +
  // canContain). Web-only (emailSafe:false, ADR-0006).
  | { type: 'TopNav'; style?: StyleMap; children: NavLinkNode[] }
  | { type: 'SideNav'; style?: StyleMap; children: NavLinkNode[] }
  | { type: 'Breadcrumb'; style?: StyleMap; children: NavLinkNode[] }
  // MenuBar is a semantic application menu bar — rendered as `<nav><ul role="menubar">` of links, the
  // File/Edit/View pattern (distinct from TopNav's bare inline `<nav>`). A COMPONENT container CONSTRAINED
  // to NavLink (it reuses the same slot leaf as the nav menus). Web-only (emailSafe:false, ADR-0006).
  | { type: 'MenuBar'; style?: StyleMap; children: NavLinkNode[] }
  // Pagination is a page-navigation bar — rendered as `<nav aria-label="Pagination"><ul>` of boxed page
  // links, the current page marked `aria-current="page"`. A COMPONENT container CONSTRAINED to NavLink:
  // it REUSES the same slot leaf as the nav menus (like MenuBar), so it adds no new leaf. Web-only
  // (emailSafe:false, ADR-0006/0021).
  | { type: 'Pagination'; style?: StyleMap; children: NavLinkNode[] }
  | NavLinkNode
  // Stepper (+ its Step slot leaf): a COMPONENT container rendered as a semantic `<ol>` of steps with a
  // numbered/check badge + connectors; `orientation` lays them out in a row or column (set at creation
  // via the two palette presets, like the two Buttons). CONSTRAINED to Step. Web-only (emailSafe:false).
  | {
      type: 'Stepper';
      props: { orientation: 'horizontal' | 'vertical' };
      style?: StyleMap;
      children: StepNode[];
    }
  | StepNode
  // ToolBar (+ its ToolButton slot leaf): a COMPONENT container rendered as a `<div role="toolbar">` of
  // icon/label buttons. `label` is the toolbar's accessible name (aria-label). CONSTRAINED to ToolButton.
  // Web-only (emailSafe:false).
  | { type: 'ToolBar'; props: { label: string }; style?: StyleMap; children: ToolButtonNode[] }
  | ToolButtonNode
  // DataTable (+ its TableRow / TableCell slots): the first THREE-level compound (container → container →
  // leaf) and the 2nd email-SAFE Component after Divider. A COMPONENT container CONSTRAINED to TableRow,
  // rendered as a semantic `<table>` — a `<caption>` (the editable accessible title), a `<thead>` of the
  // header rows and a `<tbody>` of the body rows. Email exports through MJML's native `<mj-table>`, so it
  // reaches ALL FOUR targets (cells are plain text, exactly what mj-table accepts — ADR-0021).
  | { type: 'DataTable'; props: { caption: string }; style?: StyleMap; children: TableRowNode[] }
  | TableRowNode
  | TableCellNode
  // Tabs / Accordion (ADR-0022) — the first INTERACTIVE compounds. Each is a COMPONENT container
  // CONSTRAINED to its panel slot (compile half: the narrowed `children` below; runtime half:
  // allowedChildren + canContain); the panels are themselves OPEN containers holding arbitrary body
  // content (the AppBar/Region precedent). Both are web-only (emailSafe:false): the canvas is interactive
  // (Tabs via a React Aria <Tabs>, Accordion via native <details>), the exports are static-but-semantic,
  // and email has no interactive model. Tabs renders a `<div role="tablist">` of `<button role="tab">`
  // plus one `<div role="tabpanel">` per panel (the first selected); `orientation` lays the tablist out
  // horizontally or vertically (set at creation via the two palette presets, like Stepper). Accordion
  // renders a stack of native `<details>/<summary>`; `exclusive` switches to single-open via the native
  // `<details name>` grouping (also set via a palette preset).
  | {
      type: 'Tabs';
      props: { orientation: 'horizontal' | 'vertical' };
      style?: StyleMap;
      children: TabPanelNode[];
    }
  | TabPanelNode
  | {
      type: 'Accordion';
      props: { exclusive: boolean };
      style?: StyleMap;
      children: AccordionItemNode[];
    }
  | AccordionItemNode
  | { type: 'Text'; props: { content: string; variant: TextStyle }; style?: StyleMap }
  | {
      type: 'Button';
      props: { content: string; variant: 'primary' | 'secondary' };
      style?: StyleMap;
    }
  | { type: 'Image'; props: { src: string; alt: string; width?: number }; style?: StyleMap }
  // Display-only leaves (no props, no editing half — the Capability-A exercise). Divider renders a
  // semantic horizontal rule (`<hr>` / `mj-divider`) and is email-SAFE (reaches all four targets).
  // Spacer is a flexible `flex:1` gap that pushes siblings apart; flex has no equivalent in email's
  // table model, so it is web-only (emailSafe:false) and its MJML leaf is a guardrail (like Radio).
  | { type: 'Divider'; style?: StyleMap }
  | { type: 'Spacer'; style?: StyleMap };

export interface Frame {
  target: 'web' | 'email';
  root: Node;
}

// Fully-resolved token values (hex/px), keyed by kebab name (e.g. "color-surface").
// Produced by Style Dictionary for the email generator (ADR-0004).
export type TokenLiterals = Record<string, string | number>;
