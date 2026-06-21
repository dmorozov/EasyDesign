import { describe, expect, it } from 'vitest';

import { catalog, createCatalog, STYLE_KEYS, type Token } from './design-tokens';

describe('catalog — query + validation', () => {
  it('get returns the entry for a valid ref, undefined for a typo (= isValidRef)', () => {
    expect(catalog.get('color.brand')?.literal).toBe('#4f46e5');
    expect(catalog.get('color.surfce')).toBeUndefined();
  });

  it('byCategory returns every token of a category, in catalog order', () => {
    expect(catalog.byCategory('space').map((t) => t.ref)).toEqual([
      'space.sm',
      'space.md',
      'space.lg',
    ]);
    // 6, not the old curated 4 — onBrand + muted are now in the Design Palette too.
    expect(catalog.byCategory('color')).toHaveLength(6);
  });
});

describe('catalog — resolution', () => {
  it('resolveVar is camelCase-correct (the onBrand bug the catalog closes by construction)', () => {
    expect(catalog.resolveVar('color.onBrand')).toBe('var(--color-on-brand)');
    expect(catalog.resolveVar('space.md')).toBe('var(--space-md)');
  });

  it('resolveLiteral resolves to the hex/px value', () => {
    expect(catalog.resolveLiteral('space.md')).toBe('16px');
    expect(catalog.resolveLiteral('color.onBrand')).toBe('#ffffff');
  });

  it('an unknown ref throws (fail loud — a broken var() never reaches an Export Target)', () => {
    expect(() => catalog.resolveVar('color.nope')).toThrow(/Unknown token ref/);
    expect(() => catalog.resolveLiteral('color.nope')).toThrow(/Unknown token ref/);
  });
});

describe('catalog — overrides + keying boundary', () => {
  it('withOverrides applies a dot-keyed override, else the base literal', () => {
    const lit = catalog.withOverrides({ 'color.brand': '#000000' });
    expect(lit('color.brand')).toBe('#000000');
    expect(lit('color.surface')).toBe('#ffffff');
  });

  it('fromKebab migrates a legacy kebab key back to the dot ref (incl. the camelCase case)', () => {
    expect(catalog.fromKebab('color-on-brand')).toBe('color.onBrand');
    expect(catalog.fromKebab('space-md')).toBe('space.md');
    expect(catalog.fromKebab('not-a-token')).toBeUndefined();
  });
});

describe('STYLE_KEYS — container style keys -> category', () => {
  it('maps each bound key to its token category', () => {
    expect(STYLE_KEYS).toEqual({
      background: 'color',
      padding: 'space',
      borderRadius: 'radius',
      gap: 'space',
    });
  });

  it("every style key's category is a real, non-empty catalog category", () => {
    for (const category of Object.values(STYLE_KEYS)) {
      expect(catalog.byCategory(category).length).toBeGreaterThan(0);
    }
  });
});

describe('createCatalog — the test seam (fixture entries, no build dependency)', () => {
  it('indexes a hand-written catalog', () => {
    const fixture: Token[] = [
      { ref: 'x.y', category: 'space', cssVarName: '--x-y', literal: '4px' },
    ];
    const c = createCatalog(fixture);
    expect(c.resolveVar('x.y')).toBe('var(--x-y)');
    expect(c.byCategory('space')).toHaveLength(1);
    expect(c.get('x.z')).toBeUndefined();
  });
});
