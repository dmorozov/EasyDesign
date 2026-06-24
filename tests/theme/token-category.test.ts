import { describe, expect, it } from 'vitest';

import { categoryOf } from '../../src/theme/token-category.mjs';

describe('categoryOf — DTCG $type + path -> Design-Token category', () => {
  it('color -> color', () => {
    expect(categoryOf('color', ['color', 'brand'])).toBe('color');
  });

  it('dimension under space / radius -> space / radius (by path group)', () => {
    expect(categoryOf('dimension', ['space', 'md'])).toBe('space');
    expect(categoryOf('dimension', ['radius', 'lg'])).toBe('radius');
  });

  it('font sub-types map to fine-grained categories by path (RP-4)', () => {
    expect(categoryOf('fontFamily', ['font', 'family'])).toBe('fontFamily');
    expect(categoryOf('dimension', ['font', 'size', '2xl'])).toBe('fontSize');
    expect(categoryOf('fontWeight', ['font', 'weight', 'bold'])).toBe('fontWeight');
    expect(categoryOf('number', ['font', 'lineHeight', 'tight'])).toBe('lineHeight');
    expect(categoryOf('dimension', ['font', 'letterSpacing', 'tight'])).toBe('letterSpacing');
  });

  it('throws on an unknown $type, and on an uncategorised dimension/number path', () => {
    expect(() => categoryOf('shadow', ['shadow', 'sm'])).toThrow(/Unknown token \$type/);
    expect(() => categoryOf('dimension', ['mystery', 'x'])).toThrow(/Uncategorised dimension/);
    expect(() => categoryOf('number', ['mystery', 'x'])).toThrow(/Uncategorised number/);
  });
});
