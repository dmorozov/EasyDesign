import { describe, expect, it } from 'vitest';

import { categoryOf } from './token-category.mjs';

describe('categoryOf — DTCG $type + path -> Design-Token category', () => {
  it('color -> color', () => {
    expect(categoryOf('color', ['color', 'brand'])).toBe('color');
  });

  it('dimension under space / radius -> space / radius (by path group)', () => {
    expect(categoryOf('dimension', ['space', 'md'])).toBe('space');
    expect(categoryOf('dimension', ['radius', 'lg'])).toBe('radius');
  });

  it('font family / line / size -> font (fontFamily, number, and dimension under `font`)', () => {
    expect(categoryOf('fontFamily', ['font', 'family'])).toBe('font');
    expect(categoryOf('number', ['font', 'line'])).toBe('font');
    expect(categoryOf('dimension', ['font', 'h2'])).toBe('font');
  });

  it('throws on an unknown $type rather than guessing', () => {
    expect(() => categoryOf('shadow', ['shadow', 'sm'])).toThrow(/Unknown token \$type/);
  });
});
