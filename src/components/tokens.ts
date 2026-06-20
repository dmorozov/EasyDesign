import { type CSSProperties } from 'react';

import { type StyleMap } from '../ir/types';

// Token ref "color.surface" -> CSS var(--color-surface). Dot-path -> kebab.
export function tokenVar(ref: string): string {
  return `var(--${ref.replace(/\./g, '-')})`;
}

// Resolve a node's token-bound StyleMap to React CSSProperties referencing CSS
// variables. Only the contract-bound container keys are mapped (ADR-0003/0004).
export function styleFromTokens(style: StyleMap | undefined): CSSProperties {
  if (!style) return {};
  const out: CSSProperties = {};
  if (style.background) out.background = tokenVar(style.background);
  if (style.padding) out.padding = tokenVar(style.padding);
  if (style.borderRadius) out.borderRadius = tokenVar(style.borderRadius);
  if (style.gap) out.gap = tokenVar(style.gap);
  return out;
}
