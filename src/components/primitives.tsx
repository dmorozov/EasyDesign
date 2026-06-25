import { type ReactNode } from 'react';

import { type StyleMap } from '../ir/types';
import { type TextStyle } from '../theme/generated/typography';

import { textCssVars } from './tokens';

export interface TextProps {
  variant: TextStyle;
  /** Free-form fontSize/fontWeight overrides (Type-scale refs); the rest comes from the style binding. */
  style?: StyleMap | undefined;
  children: ReactNode;
}

/** Themed text (RP-3). Real headings (h1/h2/h3) render as those tags for a11y; the rest as <p>. The
 *  typography (size/weight/line-height) is fully tokenized via the named style's binding. */
export function Text({ variant, style, children }: TextProps) {
  const css = textCssVars(variant, style);
  switch (variant) {
    case 'h1':
      return <h1 style={css}>{children}</h1>;
    case 'h2':
      return <h2 style={css}>{children}</h2>;
    case 'h3':
      return <h3 style={css}>{children}</h3>;
    default:
      return <p style={css}>{children}</p>;
  }
}

export interface ImageProps {
  src: string;
  alt: string;
  width?: number | undefined;
}

/** Responsive themed image (fills its container, capped at `width`). */
export function Image({ src, alt, width }: ImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        display: 'block',
        width: '100%',
        maxWidth: width != null ? `${String(width)}px` : '100%',
        height: 'auto',
        borderRadius: 'var(--radius-lg)',
      }}
    />
  );
}

// Display-only leaves (this ADR) — the canvas/editor twins of leaf-style's dividerDecls/spacerDecls, on
// the same CSS-var token graph, so the live canvas and the string exports stay aligned (ADR-0005).

/** A semantic horizontal rule: a 1px muted line with vertical breathing room. */
export function Divider() {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid var(--color-muted)',
        margin: 'var(--space-md) 0',
      }}
    />
  );
}

/** A flexible spacer that grows to push siblings apart along the parent's main axis (Chakra-style). */
export function Spacer() {
  return (
    <div
      aria-hidden="true"
      style={{ flex: '1 1 auto', minWidth: 'var(--space-md)', minHeight: 'var(--space-md)' }}
    />
  );
}
