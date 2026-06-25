// src/generators/leaf-style.ts — the flat β table (ADR-0008): the CSS vocabulary the
// THREE string Export Targets share, as target-neutral camelCase declarations.
//
// This is NOT a seam — it is a pure lookup imported by the string emitters. One home
// for "Button primary = brand bg" and for the structural-/layout-property -> CSS map,
// instead of three. The React targets (canvas / EditableNode) do NOT import this;
// they delegate β to src/components (ADR-0005), so β has one home per side, not three.
import { APPSHELL_MIN_HEIGHT, appShellTemplate, type RegionArea } from '../ir/appshell';
import {
  type Align,
  type Justify,
  type NavLinkNode,
  type StepStatus,
  type StyleMap,
} from '../ir/types';
import {
  type Axis,
  type ButtonNode,
  type ContainerShape,
  type ImageNode,
  type TextNode,
} from '../ir/walk';
import { catalog, STYLE_KEY_CATEGORY } from '../theme/design-tokens';
import { TEXT_STYLE_BINDING, type TextStyle } from '../theme/generated/typography';

import { TOOL_ICON_LABEL, TOOLBAR_ICON_INNER } from './toolbar-icons';

export interface Decl {
  readonly prop: string; // camelCase: 'borderRadius', 'flexDirection'
  readonly value: string;
}

// Friendly keyword -> CSS value (the string-side copy; React's home is Layout.tsx).
const JUSTIFY: Record<Justify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
};
const ALIGN: Record<Align, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

/**
 * Structural + layout-property decls for a container — the α/layout -> CSS mapping,
 * shared by all string Export Targets. The switch on `shape.kind` is exhaustive:
 * a new layout kind breaks compilation here (and in every other emitter).
 */
export function structuralDecls(shape: ContainerShape): Decl[] {
  switch (shape.kind) {
    case 'grid': {
      const out: Decl[] = [
        { prop: 'display', value: 'grid' },
        { prop: 'gridTemplateColumns', value: `repeat(${String(shape.columns)}, 1fr)` },
      ];
      if (shape.justify) out.push({ prop: 'justifyContent', value: JUSTIFY[shape.justify] });
      if (shape.align) out.push({ prop: 'alignItems', value: ALIGN[shape.align] });
      return out;
    }
    case 'flow': {
      const out: Decl[] = [
        { prop: 'display', value: 'flex' },
        { prop: 'flexDirection', value: shape.axis },
      ];
      if (shape.justify) out.push({ prop: 'justifyContent', value: JUSTIFY[shape.justify] });
      if (shape.align) out.push({ prop: 'alignItems', value: ALIGN[shape.align] });
      if (shape.wrap) out.push({ prop: 'flexWrap', value: shape.wrap });
      return out;
    }
  }
}

/**
 * AppShell β (ADR-0017): the CSS-grid container decls for an application shell, with the
 * `grid-template-*` computed from its present regions (the ONE template home is ir/appshell.ts).
 * Shared by the three string targets; the React canvas/editor keep their copy in components/AppShell.
 */
export function appShellDecls(areas: readonly RegionArea[], style: StyleMap | undefined): Decl[] {
  const t = appShellTemplate(areas);
  return [
    { prop: 'display', value: 'grid' },
    { prop: 'gridTemplateColumns', value: t.columns },
    { prop: 'gridTemplateRows', value: t.rows },
    { prop: 'gridTemplateAreas', value: t.areas },
    { prop: 'minHeight', value: APPSHELL_MIN_HEIGHT },
    ...containerDecls(style),
  ];
}

/** Places one Region child into its named grid area (the AppShell renderer wraps each child in this). */
export function gridAreaDecl(area: RegionArea): Decl {
  return { prop: 'gridArea', value: area };
}

/** Collapse repeated props to a single, LAST-wins declaration (preserving order) — so a list reset
 *  (`padding:0`/`margin:0`) followed by a token override from `containerDecls` yields one clean decl,
 *  not a duplicate key (harmless in inline CSS, but a dup key in the React `style` object). */
export function dedupeDecls(decls: Decl[]): Decl[] {
  const lastIndex = new Map<string, number>();
  decls.forEach((d, i) => lastIndex.set(d.prop, i));
  return decls.filter((d, i) => lastIndex.get(d.prop) === i);
}

/** Token-bound container decls: the bound style keys (STYLE_KEYS) resolved by the Design-Token Model
 *  (D2). One home for which keys bind + the dot->var resolution (camelCase-correct). */
export function containerDecls(style: StyleMap | undefined): Decl[] {
  if (!style) return [];
  const out: Decl[] = [];
  for (const [key, ref] of Object.entries(style)) {
    if (key in STYLE_KEY_CATEGORY) out.push({ prop: key, value: catalog.resolveVar(ref) });
  }
  return out;
}

/** The semantic tag for a Text style: real headings get <h1/h2/h3>, the rest a <p> (RP-3 a11y). */
export function textTag(variant: TextStyle): 'h1' | 'h2' | 'h3' | 'p' {
  return variant === 'h1' || variant === 'h2' || variant === 'h3' ? variant : 'p';
}

// Typography is fully tokenized (RP-3): the named Text style resolves through TEXT_STYLE_BINDING to
// primitive refs, and a free-form `fontSize`/`fontWeight` on the node OVERRIDES the style's default
// (still a Type-scale ref, never a raw value). No hard-coded literals remain.
export function textDecls(node: TextNode): Decl[] {
  const binding = TEXT_STYLE_BINDING[node.props.variant];
  const sizeRef = node.style?.fontSize ?? binding.fontSize;
  const weightRef = node.style?.fontWeight ?? binding.fontWeight;
  return [
    { prop: 'margin', value: '0' },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontSize', value: catalog.resolveVar(sizeRef) },
    { prop: 'lineHeight', value: catalog.resolveVar(binding.lineHeight) },
    { prop: 'color', value: 'var(--color-text)' },
    { prop: 'fontWeight', value: catalog.resolveVar(weightRef) },
  ];
}

const BUTTON_BASE: Decl[] = [
  { prop: 'display', value: 'inline-block' },
  { prop: 'textAlign', value: 'center' },
  { prop: 'textDecoration', value: 'none' },
  { prop: 'padding', value: 'var(--space-sm) var(--space-md)' },
  { prop: 'borderRadius', value: 'var(--radius-lg)' },
  { prop: 'fontFamily', value: 'var(--font-family)' },
  { prop: 'fontSize', value: catalog.resolveVar('font.size.base') },
  { prop: 'fontWeight', value: catalog.resolveVar('font.weight.semibold') }, // RP-3: was hard-coded 600
];

export function buttonDecls(node: ButtonNode): Decl[] {
  const variant: Decl[] =
    node.props.variant === 'primary'
      ? [
          { prop: 'background', value: 'var(--color-brand)' },
          { prop: 'color', value: 'var(--color-on-brand)' },
        ]
      : [
          { prop: 'background', value: 'transparent' },
          { prop: 'color', value: 'var(--color-brand)' },
          { prop: 'border', value: '1px solid var(--color-brand)' },
        ];
  return [...BUTTON_BASE, ...variant];
}

// RadioGroup / Radio (RP-10) β — the compound Component's CSS, shared by the three string targets.
// The RAC canvas keeps its own β in src/components (ADR-0005); this is the export-markup side.

/** The <fieldset> wrapper for a RadioGroup: a borderless vertical stack of options + its token style. */
export function radioGroupDecls(style: StyleMap | undefined): Decl[] {
  return dedupeDecls([
    { prop: 'display', value: 'flex' },
    { prop: 'flexDirection', value: 'column' },
    { prop: 'gap', value: catalog.resolveVar('space.sm') },
    { prop: 'border', value: 'none' },
    { prop: 'margin', value: '0' },
    { prop: 'padding', value: '0' },
    ...containerDecls(style),
  ]);
}

/** The <legend> (the group's label). */
export function legendDecls(): Decl[] {
  return [
    { prop: 'padding', value: '0' },
    { prop: 'marginBottom', value: catalog.resolveVar('space.sm') },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontWeight', value: catalog.resolveVar('font.weight.semibold') },
    { prop: 'color', value: 'var(--color-text)' },
  ];
}

/** One radio option: a <label> wrapping the input + its text. */
export function radioDecls(): Decl[] {
  return [
    { prop: 'display', value: 'flex' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'gap', value: catalog.resolveVar('space.sm') },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontSize', value: catalog.resolveVar('font.size.base') },
    { prop: 'color', value: 'var(--color-text)' },
  ];
}

// Application chrome (ADR-0019) β — shared by the three string targets; the React canvas/editor keep
// their copy in src/components/Nav. The AppBar is a flex-row `<header>` (brand left / actions right via
// space-between); a nav Component is a flex `<nav>` (row for TopNav, column for SideNav). The gap/
// background/etc. come from the node's token style (containerDecls), so clearing `gap`/`padding` to
// space.none butts children together / spans full width — the full-width-chrome story (ADR-0019).
export function appBarDecls(style: StyleMap | undefined): Decl[] {
  return [
    { prop: 'display', value: 'flex' },
    { prop: 'flexDirection', value: 'row' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'justifyContent', value: 'space-between' },
    ...containerDecls(style),
  ];
}

export function navDecls(axis: Axis, style: StyleMap | undefined): Decl[] {
  const out: Decl[] = [
    { prop: 'display', value: 'flex' },
    { prop: 'flexDirection', value: axis },
  ];
  if (axis === 'row') out.push({ prop: 'alignItems', value: 'center' });
  out.push(...containerDecls(style));
  return out;
}

/** One nav link: an `<a>` styled as a menu item. `active` (the current page) reads brand + semibold. */
export function navLinkDecls(node: NavLinkNode): Decl[] {
  const active = node.props.active === true;
  return [
    { prop: 'textDecoration', value: 'none' },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontSize', value: catalog.resolveVar('font.size.base') },
    {
      prop: 'fontWeight',
      value: catalog.resolveVar(active ? 'font.weight.semibold' : 'font.weight.medium'),
    },
    { prop: 'color', value: active ? 'var(--color-brand)' : 'var(--color-text)' },
  ];
}

// Breadcrumb (ADR-0019): a horizontal <ol> of crumbs with a muted separator between each. The <ol> is
// the styled element (token gap controls crumb spacing); the <nav> is a bare aria-label landmark.
export function breadcrumbListDecls(style: StyleMap | undefined): Decl[] {
  return dedupeDecls([
    { prop: 'display', value: 'flex' },
    { prop: 'flexDirection', value: 'row' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'flexWrap', value: 'wrap' },
    { prop: 'listStyle', value: 'none' },
    { prop: 'margin', value: '0' },
    { prop: 'padding', value: '0' },
    ...containerDecls(style),
  ]);
}

/** One crumb (`<li>`): holds the link and (for all but the last) its trailing separator. */
export function breadcrumbItemDecls(): Decl[] {
  return [
    { prop: 'display', value: 'flex' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'gap', value: catalog.resolveVar('space.sm') },
  ];
}

/** The `/` separator between crumbs — muted, and aria-hidden in the markup (decorative). */
export function breadcrumbSeparatorDecls(): Decl[] {
  return [
    { prop: 'color', value: 'var(--color-muted)' },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontSize', value: catalog.resolveVar('font.size.base') },
  ];
}

export function imageDecls(node: ImageNode): Decl[] {
  const out: Decl[] = [
    { prop: 'display', value: 'block' },
    { prop: 'width', value: '100%' },
  ];
  if (node.props.width !== undefined) {
    out.push({ prop: 'maxWidth', value: `${String(node.props.width)}px` });
  }
  out.push({ prop: 'height', value: 'auto' }, { prop: 'borderRadius', value: 'var(--radius-lg)' });
  return out;
}

// Display-only leaves (this ADR) — the Capability-A exercise. β shared by the three string targets; the
// canvas/editor keep their copy in src/components/primitives (ADR-0005).

/** A horizontal rule (`<hr>`): a 1px muted line with vertical breathing room. */
export function dividerDecls(): Decl[] {
  return [
    { prop: 'border', value: 'none' },
    { prop: 'borderTop', value: '1px solid var(--color-muted)' },
    { prop: 'margin', value: 'var(--space-md) 0' },
  ];
}

/** A flexible spacer: grows to push siblings apart along the parent's main axis (Chakra-style `flex:1`),
 *  with a minimum so it stays visible/selectable in an auto-sized container. */
export function spacerDecls(): Decl[] {
  return [
    { prop: 'flex', value: '1 1 auto' },
    { prop: 'minWidth', value: 'var(--space-md)' },
    { prop: 'minHeight', value: 'var(--space-md)' },
  ];
}

// Stepper / Step (this ADR) β — a semantic <ol> of steps with a status badge (a check when complete, a
// brand ring when current, a muted ring when upcoming) and connector lines between. orientation lays the
// steps in a row or column. Shared by the three string targets; the canvas keeps its copy in components.

/** The <ol> container: a flex row (horizontal) or column (vertical) of steps + connectors. */
export function stepperListDecls(
  orientation: 'horizontal' | 'vertical',
  style: StyleMap | undefined,
): Decl[] {
  return dedupeDecls([
    { prop: 'display', value: 'flex' },
    { prop: 'flexDirection', value: orientation === 'horizontal' ? 'row' : 'column' },
    { prop: 'alignItems', value: orientation === 'horizontal' ? 'center' : 'stretch' },
    { prop: 'listStyle', value: 'none' },
    { prop: 'margin', value: '0' },
    { prop: 'padding', value: '0' },
    ...containerDecls(style),
  ]);
}

/** One step's <li> wrapper (the Step content sits inside; flex:0 so connectors take the slack). */
export function stepItemDecls(): Decl[] {
  return [
    { prop: 'listStyle', value: 'none' },
    { prop: 'display', value: 'flex' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'flex', value: '0 0 auto' },
  ];
}

/** The Step's inner [badge, label] flex group (rendered by the Step leaf itself). */
export function stepDecls(): Decl[] {
  return [
    { prop: 'display', value: 'flex' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'gap', value: 'var(--space-sm)' },
  ];
}

/** The round status badge: a check on `complete` (brand fill), a brand ring on `current`, a muted ring
 *  on `upcoming`. */
export function stepBadgeDecls(status: StepStatus): Decl[] {
  const base: Decl[] = [
    { prop: 'display', value: 'flex' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'justifyContent', value: 'center' },
    { prop: 'width', value: '24px' },
    { prop: 'height', value: '24px' },
    { prop: 'borderRadius', value: '50%' },
    { prop: 'flex', value: '0 0 auto' },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontSize', value: catalog.resolveVar('font.size.sm') },
    { prop: 'fontWeight', value: catalog.resolveVar('font.weight.semibold') },
  ];
  if (status === 'complete') {
    return [
      ...base,
      { prop: 'background', value: 'var(--color-brand)' },
      { prop: 'color', value: 'var(--color-on-brand)' },
    ];
  }
  const ring = status === 'current' ? 'var(--color-brand)' : 'var(--color-muted)';
  return [
    ...base,
    { prop: 'background', value: 'transparent' },
    { prop: 'color', value: ring },
    { prop: 'border', value: `2px solid ${ring}` },
  ];
}

/** The step label: muted when upcoming, semibold when current. */
export function stepLabelDecls(status: StepStatus): Decl[] {
  return [
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontSize', value: catalog.resolveVar('font.size.sm') },
    { prop: 'color', value: status === 'upcoming' ? 'var(--color-muted)' : 'var(--color-text)' },
    {
      prop: 'fontWeight',
      value: catalog.resolveVar(
        status === 'current' ? 'font.weight.semibold' : 'font.weight.medium',
      ),
    },
  ];
}

/** The line drawn between two steps — horizontal (grows to fill) or a short vertical rail. */
export function stepperConnectorDecls(orientation: 'horizontal' | 'vertical'): Decl[] {
  return orientation === 'horizontal'
    ? [
        { prop: 'flex', value: '1 1 auto' },
        { prop: 'height', value: '2px' },
        { prop: 'minWidth', value: 'var(--space-lg)' },
        { prop: 'background', value: 'var(--color-muted)' },
        { prop: 'alignSelf', value: 'center' },
      ]
    : [
        { prop: 'width', value: '2px' },
        { prop: 'minHeight', value: 'var(--space-md)' },
        { prop: 'marginLeft', value: '11px' }, // centers the rail under the 24px badge
        { prop: 'background', value: 'var(--color-muted)' },
      ];
}

// ToolBar / ToolButton (this ADR) β — a <div role="toolbar"> of icon/label <button>s. Shared by the
// three string targets; the canvas keeps its copy in components, and the icon glyph in toolbar-icons.

/** The toolbar bar: a wrapping flex row of buttons, on the node's token surface. */
export function toolBarDecls(style: StyleMap | undefined): Decl[] {
  return [
    { prop: 'display', value: 'flex' },
    { prop: 'flexDirection', value: 'row' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'flexWrap', value: 'wrap' },
    ...containerDecls(style),
  ];
}

/** One tool button: an icon, plus the label text when present (the renderer omits an empty label). */
export function toolButtonDecls(): Decl[] {
  return [
    { prop: 'display', value: 'inline-flex' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'gap', value: 'var(--space-sm)' },
    { prop: 'padding', value: 'var(--space-sm) var(--space-md)' },
    { prop: 'border', value: '1px solid transparent' },
    { prop: 'borderRadius', value: 'var(--radius-lg)' },
    { prop: 'background', value: 'transparent' },
    { prop: 'color', value: 'var(--color-text)' },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontSize', value: catalog.resolveVar('font.size.sm') },
    { prop: 'fontWeight', value: catalog.resolveVar('font.weight.medium') },
    { prop: 'lineHeight', value: '1' },
    { prop: 'cursor', value: 'pointer' },
  ];
}

/** The inline-SVG presentation, kept as `style` (not SVG attributes) so ONE inner-markup source serves
 *  HTML's string style and React's object style alike (see toolbar-icons.ts). 16px is set as attributes. */
export const ICON_SVG_STYLE: Decl[] = [
  { prop: 'fill', value: 'none' },
  { prop: 'stroke', value: 'currentColor' },
  { prop: 'strokeWidth', value: '2' },
  { prop: 'strokeLinecap', value: 'round' },
  { prop: 'strokeLinejoin', value: 'round' },
];
export { TOOL_ICON_LABEL, TOOLBAR_ICON_INNER };

// MenuBar (this ADR) β — a <nav><ul role="menubar"> of links, styled as a full application bar. Shared
// by the three string targets; the canvas keeps its copy in components/Nav. Reuses the NavLink leaf, so
// the link markup is navLinkDecls; this owns the bar (the <ul>) and the menu item (the <li>).

/** The menu bar (`<ul role="menubar">`): a wrapping flex row of items on the node's token surface. */
export function menuBarListDecls(style: StyleMap | undefined): Decl[] {
  return dedupeDecls([
    { prop: 'display', value: 'flex' },
    { prop: 'flexDirection', value: 'row' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'flexWrap', value: 'wrap' },
    { prop: 'listStyle', value: 'none' },
    { prop: 'margin', value: '0' },
    { prop: 'padding', value: '0' },
    ...containerDecls(style),
  ]);
}

/** One menu item (`<li>`): padding around the link gives the bar item its hit area. */
export function menuItemDecls(): Decl[] {
  return [
    { prop: 'display', value: 'flex' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'padding', value: 'var(--space-sm) var(--space-md)' },
  ];
}

// DataTable / TableRow / TableCell (ADR-0021) β — a semantic <table> (caption + thead/tbody) of plain-
// text cells. Shared by the three string targets; the canvas keeps its copy in components/DataTable, and
// MJML resolves these same intentions to literals inline (mj-table). The ROW owns the th/td decision, so
// there is one cell-style home per cell kind (header vs body).

/** The <table> element: full width, collapsed borders, on the node's token type/colour. DataTable's
 *  styleKeys are [] today, so `containerDecls` is a no-op — kept for when surface styling is exposed. */
export function dataTableDecls(style: StyleMap | undefined): Decl[] {
  return [
    { prop: 'width', value: '100%' },
    { prop: 'borderCollapse', value: 'collapse' },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontSize', value: catalog.resolveVar('font.size.base') },
    { prop: 'color', value: 'var(--color-text)' },
    ...containerDecls(style),
  ];
}

/** The <caption> (the table's accessible title): left-aligned, semibold, with breathing room below. */
export function tableCaptionDecls(): Decl[] {
  return [
    { prop: 'textAlign', value: 'left' },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontWeight', value: catalog.resolveVar('font.weight.semibold') },
    { prop: 'color', value: 'var(--color-text)' },
    { prop: 'paddingBottom', value: 'var(--space-sm)' },
  ];
}

/** A header cell (`<th scope="col">`): left-aligned, semibold, with a heavier bottom rule. */
export function tableHeaderCellDecls(): Decl[] {
  return [
    { prop: 'textAlign', value: 'left' },
    { prop: 'padding', value: 'var(--space-sm) var(--space-md)' },
    { prop: 'borderBottom', value: '2px solid var(--color-muted)' },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontWeight', value: catalog.resolveVar('font.weight.semibold') },
    { prop: 'color', value: 'var(--color-text)' },
  ];
}

/** A body cell (`<td>`): left-aligned, a light bottom rule between rows. */
export function tableCellDecls(): Decl[] {
  return [
    { prop: 'textAlign', value: 'left' },
    { prop: 'padding', value: 'var(--space-sm) var(--space-md)' },
    { prop: 'borderBottom', value: '1px solid var(--color-muted)' },
    { prop: 'color', value: 'var(--color-text)' },
  ];
}

// Pagination (ADR-0021) β — a <nav aria-label="Pagination"><ul> of boxed page links. Reuses the NavLink
// leaf for the `<a aria-current>`, so this owns the bar (the <ul>) and the boxed page item (the <li>).
// Shared by the three string targets; the canvas keeps its copy in components/Nav.

/** The pagination bar (`<ul>`): a wrapping flex row of page items on the node's token surface. */
export function paginationListDecls(style: StyleMap | undefined): Decl[] {
  return dedupeDecls([
    { prop: 'display', value: 'flex' },
    { prop: 'flexDirection', value: 'row' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'flexWrap', value: 'wrap' },
    { prop: 'gap', value: catalog.resolveVar('space.sm') },
    { prop: 'listStyle', value: 'none' },
    { prop: 'margin', value: '0' },
    { prop: 'padding', value: '0' },
    ...containerDecls(style),
  ]);
}

/** One page (`<li>`): a boxed cell so each NavLink reads as a page button (a token border + radius). */
export function paginationItemDecls(): Decl[] {
  return [
    { prop: 'display', value: 'flex' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'justifyContent', value: 'center' },
    { prop: 'padding', value: 'var(--space-sm) var(--space-md)' },
    { prop: 'border', value: '1px solid var(--color-muted)' },
    { prop: 'borderRadius', value: 'var(--radius-lg)' },
  ];
}

// Tabs / TabPanel (ADR-0022) β — the static-export side of a tab strip: a `<div role="tablist">` of
// `<button role="tab">` plus one `<div role="tabpanel">` per panel (the first selected, the rest carry
// `hidden`). The CANVAS uses a real React Aria <Tabs> (components/Tabs); this is shared by the three
// string targets. `orientation` lays the tablist across the top (horizontal) or down the side (vertical).

/** The Tabs outer box: a flex column (tablist over panels) or row (tablist beside panels). */
export function tabsDecls(
  orientation: 'horizontal' | 'vertical',
  style: StyleMap | undefined,
): Decl[] {
  return dedupeDecls([
    { prop: 'display', value: 'flex' },
    { prop: 'flexDirection', value: orientation === 'horizontal' ? 'column' : 'row' },
    { prop: 'gap', value: catalog.resolveVar('space.md') },
    ...containerDecls(style),
  ]);
}

/** The `<div role="tablist">`: a flex row of tabs with a bottom rule (horizontal) or a flex column with a
 *  right rule (vertical) — the rule sits on the edge facing the panels. */
export function tabListDecls(orientation: 'horizontal' | 'vertical'): Decl[] {
  return orientation === 'horizontal'
    ? [
        { prop: 'display', value: 'flex' },
        { prop: 'flexDirection', value: 'row' },
        { prop: 'gap', value: catalog.resolveVar('space.sm') },
        { prop: 'borderBottom', value: '1px solid var(--color-muted)' },
      ]
    : [
        { prop: 'display', value: 'flex' },
        { prop: 'flexDirection', value: 'column' },
        { prop: 'gap', value: catalog.resolveVar('space.sm') },
        { prop: 'borderRight', value: '1px solid var(--color-muted)' },
      ];
}

/** One `<button role="tab">`: the selected tab reads brand with a brand indicator rule on the edge facing
 *  the panels (bottom for horizontal, right for vertical); the rest are plain text with no indicator. */
export function tabButtonDecls(selected: boolean, orientation: 'horizontal' | 'vertical'): Decl[] {
  const indicator = selected ? 'var(--color-brand)' : 'transparent';
  const edge: Decl =
    orientation === 'horizontal'
      ? { prop: 'borderBottom', value: `2px solid ${indicator}` }
      : { prop: 'borderRight', value: `2px solid ${indicator}` };
  return [
    { prop: 'display', value: 'inline-flex' },
    { prop: 'alignItems', value: 'center' },
    { prop: 'padding', value: 'var(--space-sm) var(--space-md)' },
    { prop: 'background', value: 'transparent' },
    { prop: 'border', value: 'none' },
    edge,
    { prop: 'cursor', value: 'pointer' },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontSize', value: catalog.resolveVar('font.size.base') },
    {
      prop: 'fontWeight',
      value: catalog.resolveVar(selected ? 'font.weight.semibold' : 'font.weight.medium'),
    },
    { prop: 'color', value: selected ? 'var(--color-brand)' : 'var(--color-text)' },
  ];
}

/** The `<div role="tabpanel">`: padded content that grows to fill. Deliberately sets NO `display` — an
 *  inline `display` would override the `hidden` attribute on inactive panels, leaving them visible. */
export function tabPanelDecls(style: StyleMap | undefined): Decl[] {
  return dedupeDecls([
    { prop: 'flex', value: '1' },
    { prop: 'padding', value: catalog.resolveVar('space.md') },
    ...containerDecls(style),
  ]);
}

// Accordion / AccordionItem (ADR-0022) β — a stack of native `<details>/<summary>` sections. Used by BOTH
// the canvas (components/Accordion renders the same native <details>) and the three string targets, so the
// accordion is canvas == export. Single-open (`exclusive`) is expressed in the markup via the native
// `<details name>` grouping, not here.

/** The Accordion outer box: a vertical stack of `<details>` sections with a small gap. */
export function accordionDecls(style: StyleMap | undefined): Decl[] {
  return dedupeDecls([
    { prop: 'display', value: 'flex' },
    { prop: 'flexDirection', value: 'column' },
    { prop: 'gap', value: catalog.resolveVar('space.sm') },
    ...containerDecls(style),
  ]);
}

/** One section (`<details>`): a bordered, rounded card whose corners clip the summary/panel. */
export function accordionItemDecls(style: StyleMap | undefined): Decl[] {
  return dedupeDecls([
    { prop: 'border', value: '1px solid var(--color-muted)' },
    { prop: 'borderRadius', value: catalog.resolveVar('radius.lg') },
    { prop: 'overflow', value: 'hidden' },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    ...containerDecls(style),
  ]);
}

/** The `<summary>` header: a clickable, semibold row (keeping the native disclosure marker). */
export function accordionSummaryDecls(): Decl[] {
  return [
    { prop: 'padding', value: 'var(--space-sm) var(--space-md)' },
    { prop: 'cursor', value: 'pointer' },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontSize', value: catalog.resolveVar('font.size.base') },
    { prop: 'fontWeight', value: catalog.resolveVar('font.weight.semibold') },
    { prop: 'color', value: 'var(--color-text)' },
  ];
}

/** The panel body inside a section (the content revealed below the summary). */
export function accordionPanelDecls(): Decl[] {
  return [
    { prop: 'padding', value: catalog.resolveVar('space.md') },
    { prop: 'color', value: 'var(--color-text)' },
  ];
}
