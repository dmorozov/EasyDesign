// src/generators/leaf-style.ts — the flat β table (ADR-0008): the CSS vocabulary the
// THREE string Export Targets share, as target-neutral camelCase declarations.
//
// This is NOT a seam — it is a pure lookup imported by the string emitters. One home
// for "Button primary = brand bg" and for the structural-/layout-property -> CSS map,
// instead of three. The React targets (canvas / EditableNode) do NOT import this;
// they delegate β to src/components (ADR-0005), so β has one home per side, not three.
import { APPSHELL_MIN_HEIGHT, appShellTemplate, type RegionArea } from '../ir/appshell';
import { type Align, type Justify, type StyleMap } from '../ir/types';
import { type ButtonNode, type ContainerShape, type ImageNode, type TextNode } from '../ir/walk';
import { catalog, STYLE_KEY_CATEGORY } from '../theme/design-tokens';
import { TEXT_STYLE_BINDING, type TextStyle } from '../theme/generated/typography';

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
  return [
    { prop: 'display', value: 'flex' },
    { prop: 'flexDirection', value: 'column' },
    { prop: 'gap', value: catalog.resolveVar('space.sm') },
    { prop: 'border', value: 'none' },
    { prop: 'margin', value: '0' },
    { prop: 'padding', value: '0' },
    ...containerDecls(style),
  ];
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
