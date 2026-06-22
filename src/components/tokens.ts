import { type CSSProperties } from 'react';

import { type StyleMap } from '../ir/types';
import { catalog, STYLE_KEY_CATEGORY, type StyleKey } from '../theme/design-tokens';
import { TEXT_STYLE_BINDING, type TextStyle } from '../theme/generated/typography';

/**
 * Resolve a node's token-bound StyleMap to React CSSProperties referencing CSS variables. Only the
 * contract-bound style keys are mapped (STYLE_KEY_CATEGORY, ADR-0003); the dot->var resolution is the
 * Design-Token Model's, so there's one camelCase-correct home for it (D2 / ADR-0004).
 */
export function styleFromTokens(style: StyleMap | undefined): CSSProperties {
  if (!style) return {};
  const out: CSSProperties = {};
  for (const key of Object.keys(STYLE_KEY_CATEGORY) as StyleKey[]) {
    const ref = style[key];
    if (ref !== undefined) out[key] = catalog.resolveVar(ref);
  }
  return out;
}

/**
 * The React β home (ADR-0008) for Text typography: the named Text style's binding resolved to CSS
 * vars, with a free-form `fontSize`/`fontWeight` override — the canvas twin of `leaf-style.textDecls`
 * (RP-3), so the live canvas and the string export stay byte-aligned on the same token graph.
 */
export function textCssVars(variant: TextStyle, style: StyleMap | undefined): CSSProperties {
  const binding = TEXT_STYLE_BINDING[variant];
  return {
    margin: 0,
    fontFamily: 'var(--font-family)',
    fontSize: catalog.resolveVar(style?.fontSize ?? binding.fontSize),
    lineHeight: catalog.resolveVar(binding.lineHeight),
    color: 'var(--color-text)',
    fontWeight: catalog.resolveVar(style?.fontWeight ?? binding.fontWeight),
  };
}
