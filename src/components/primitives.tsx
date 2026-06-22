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
