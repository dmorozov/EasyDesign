// src/generators/leaf-style.ts — the flat β table (ADR-0008): the CSS vocabulary the
// THREE string Export Targets share, as target-neutral camelCase declarations.
//
// This is NOT a seam — it is a pure lookup imported by the string emitters. One home
// for "Button primary = brand bg" and for the structural-/layout-property -> CSS map,
// instead of three. The React targets (canvas / EditableNode) do NOT import this;
// they delegate β to src/components (ADR-0005), so β has one home per side, not three.
import { type Align, type Justify, type StyleMap } from '../ir/types';
import { type ButtonNode, type ContainerShape, type ImageNode, type TextNode } from '../ir/walk';

export interface Decl {
  readonly prop: string; // camelCase: 'borderRadius', 'flexDirection'
  readonly value: string;
}

/** Token ref dot-path -> web `var(--…)`. */
export function tokenVar(ref: string): string {
  return `var(--${ref.replace(/\./g, '-')})`;
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

// The IR style keys the contract binds on containers (the 3x-duplicated map).
const CONTAINER_STYLE_PROP: Record<string, string> = {
  background: 'background',
  padding: 'padding',
  borderRadius: 'borderRadius',
  gap: 'gap',
};

/** Token-bound container decls (background/padding/radius/gap), now stated once. */
export function containerDecls(style: StyleMap | undefined): Decl[] {
  if (!style) return [];
  const out: Decl[] = [];
  for (const [key, ref] of Object.entries(style)) {
    const prop = CONTAINER_STYLE_PROP[key];
    if (prop === undefined) continue; // ignore keys with no defined web mapping
    out.push({ prop, value: tokenVar(ref) });
  }
  return out;
}

export function textDecls(node: TextNode): Decl[] {
  const h2 = node.props.variant === 'h2';
  return [
    { prop: 'margin', value: '0' },
    { prop: 'fontFamily', value: 'var(--font-family)' },
    { prop: 'fontSize', value: h2 ? 'var(--font-h2)' : 'var(--font-body)' },
    { prop: 'lineHeight', value: h2 ? '1.25' : 'var(--font-line)' },
    { prop: 'color', value: 'var(--color-text)' },
    ...(h2 ? [{ prop: 'fontWeight', value: '700' }] : []),
  ];
}

const BUTTON_BASE: Decl[] = [
  { prop: 'display', value: 'inline-block' },
  { prop: 'textAlign', value: 'center' },
  { prop: 'textDecoration', value: 'none' },
  { prop: 'padding', value: 'var(--space-sm) var(--space-md)' },
  { prop: 'borderRadius', value: 'var(--radius-lg)' },
  { prop: 'fontFamily', value: 'var(--font-family)' },
  { prop: 'fontSize', value: 'var(--font-body)' },
  { prop: 'fontWeight', value: '600' },
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
