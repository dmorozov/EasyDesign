import { type CSSProperties, type ReactNode } from 'react';

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-h2)',
  lineHeight: 1.25,
  color: 'var(--color-text)',
  fontWeight: 700,
};

const bodyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-body)',
  lineHeight: 'var(--font-line)',
  color: 'var(--color-text)',
};

export interface TextProps {
  variant: 'h2' | 'body';
  children: ReactNode;
}

/** Themed text. `h2` renders a heading; `body` renders a paragraph. */
export function Text({ variant, children }: TextProps) {
  return variant === 'h2' ? (
    <h2 style={headingStyle}>{children}</h2>
  ) : (
    <p style={bodyStyle}>{children}</p>
  );
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
