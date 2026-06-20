import { type CSSProperties, type ReactNode } from 'react';

import { type StyleMap } from '../ir/types';

import { styleFromTokens } from './tokens';

export interface LayoutProps {
  style?: StyleMap | undefined;
  children?: ReactNode | undefined;
}

const column: CSSProperties = { display: 'flex', flexDirection: 'column' };
const row: CSSProperties = { display: 'flex', flexDirection: 'row' };

/** Vertical flow container — the most common email-safe layout (ADR-0003). */
export function Stack({ style, children }: LayoutProps) {
  return <div style={{ ...column, ...styleFromTokens(style) }}>{children}</div>;
}

/** Same as Stack; named separately so the IR vocabulary maps 1:1 to components. */
export function Column({ style, children }: LayoutProps) {
  return <div style={{ ...column, ...styleFromTokens(style) }}>{children}</div>;
}

/** Horizontal container; children are wrapped flex:1 by the canvas renderer. */
export function Row({ style, children }: LayoutProps) {
  return <div style={{ ...row, ...styleFromTokens(style) }}>{children}</div>;
}

export interface GridProps extends LayoutProps {
  columns: number;
}

/** CSS grid with `columns` equal tracks. NOT email-safe (ADR-0006). */
export function Grid({ columns, style, children }: GridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${String(columns)}, 1fr)`,
        ...styleFromTokens(style),
      }}
    >
      {children}
    </div>
  );
}
