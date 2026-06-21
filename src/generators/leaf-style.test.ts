import { describe, expect, it } from 'vitest';

import { buttonDecls, containerDecls, imageDecls, structuralDecls, textDecls } from './leaf-style';

describe('structuralDecls — α/layout -> CSS, shared by the string targets', () => {
  it('a flow row is display:flex + flex-direction:row', () => {
    expect(
      structuralDecls({
        kind: 'flow',
        axis: 'row',
        wrapChildren: false,
        justify: null,
        align: null,
        wrap: null,
      }),
    ).toEqual([
      { prop: 'display', value: 'flex' },
      { prop: 'flexDirection', value: 'row' },
    ]);
  });

  it('maps the friendly keywords to CSS (start -> flex-start, etc.)', () => {
    const decls = structuralDecls({
      kind: 'flow',
      axis: 'row',
      wrapChildren: false,
      justify: 'space-between',
      align: 'start',
      wrap: 'wrap',
    });
    expect(decls).toContainEqual({ prop: 'justifyContent', value: 'space-between' });
    expect(decls).toContainEqual({ prop: 'alignItems', value: 'flex-start' });
    expect(decls).toContainEqual({ prop: 'flexWrap', value: 'wrap' });
  });

  it('a grid is repeat(n, 1fr) and has no wrap', () => {
    expect(structuralDecls({ kind: 'grid', columns: 2, justify: null, align: null })).toEqual([
      { prop: 'display', value: 'grid' },
      { prop: 'gridTemplateColumns', value: 'repeat(2, 1fr)' },
    ]);
  });
});

describe('containerDecls — token-bound container styles', () => {
  it('maps known style keys to var(--…) and skips unknown ones', () => {
    expect(
      containerDecls({ background: 'color.surface', padding: 'space.lg', bogus: 'x.y' }),
    ).toEqual([
      { prop: 'background', value: 'var(--color-surface)' },
      { prop: 'padding', value: 'var(--space-lg)' },
    ]);
  });

  it('no style -> no decls', () => {
    expect(containerDecls(undefined)).toEqual([]);
  });
});

// (token resolution moved to the Design-Token Model — see design-tokens.test.ts `resolveVar`.)

describe('leaf β — the CSS vocabulary, stated once', () => {
  it('a primary button binds the brand tokens', () => {
    const decls = buttonDecls({ type: 'Button', props: { content: 'x', variant: 'primary' } });
    expect(decls).toContainEqual({ prop: 'background', value: 'var(--color-brand)' });
    expect(decls).toContainEqual({ prop: 'color', value: 'var(--color-on-brand)' });
  });

  it('an h2 is bold at the heading font size', () => {
    const decls = textDecls({ type: 'Text', props: { content: 'x', variant: 'h2' } });
    expect(decls).toContainEqual({ prop: 'fontWeight', value: '700' });
    expect(decls).toContainEqual({ prop: 'fontSize', value: 'var(--font-h2)' });
  });

  it('an image omits max-width when it has no intrinsic width', () => {
    const decls = imageDecls({ type: 'Image', props: { src: 's', alt: 'a' } });
    expect(decls.find((d) => d.prop === 'maxWidth')).toBeUndefined();
  });
});
