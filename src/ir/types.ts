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
 *  current`). Its ONLY valid parents are the navigation Components (TopNav/SideNav/Breadcrumb) — the
 *  descriptor's `allowedChildren` at runtime + the parents' `children: NavLinkNode[]` at compile time. */
export interface NavLinkNode {
  type: 'NavLink';
  props: { label: string; href: string; active?: boolean };
  style?: StyleMap;
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
  | NavLinkNode
  | { type: 'Text'; props: { content: string; variant: TextStyle }; style?: StyleMap }
  | {
      type: 'Button';
      props: { content: string; variant: 'primary' | 'secondary' };
      style?: StyleMap;
    }
  | { type: 'Image'; props: { src: string; alt: string; width?: number }; style?: StyleMap };

export interface Frame {
  target: 'web' | 'email';
  root: Node;
}

// Fully-resolved token values (hex/px), keyed by kebab name (e.g. "color-surface").
// Produced by Style Dictionary for the email generator (ADR-0004).
export type TokenLiterals = Record<string, string | number>;
