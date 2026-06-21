import { type CSSProperties } from 'react';

import { type StyleMap } from '../ir/types';
import { catalog, STYLE_KEYS, type StyleKey } from '../theme/design-tokens';

/**
 * Resolve a node's token-bound StyleMap to React CSSProperties referencing CSS variables. Only the
 * contract-bound container keys are mapped (STYLE_KEYS, ADR-0003); the dot->var resolution is the
 * Design-Token Model's, so there's one camelCase-correct home for it (D2 / ADR-0004).
 */
export function styleFromTokens(style: StyleMap | undefined): CSSProperties {
  if (!style) return {};
  const out: CSSProperties = {};
  for (const key of Object.keys(STYLE_KEYS) as StyleKey[]) {
    const ref = style[key];
    if (ref !== undefined) out[key] = catalog.resolveVar(ref);
  }
  return out;
}
