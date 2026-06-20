import { type CSSProperties, type ReactNode } from 'react';

import { type Align, type Justify, type StyleMap, type Wrap } from '../ir/types';

import { styleFromTokens } from './tokens';

export interface LayoutProps {
  style?: StyleMap | undefined;
  justify?: Justify | undefined;
  align?: Align | undefined;
  wrap?: Wrap | undefined;
  children?: ReactNode | undefined;
}

const column: CSSProperties = { display: 'flex', flexDirection: 'column' };
const row: CSSProperties = { display: 'flex', flexDirection: 'row' };

// Friendly keyword -> CSS value. This is β's React home for the new layout
// properties (ADR-0005); the string generators keep their own copy in leaf-style.
const JUSTIFY: Record<Justify, CSSProperties['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
};
const ALIGN: Record<Align, CSSProperties['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

/** justify/align/wrap -> CSS, applied to flex AND grid containers. */
function flowExtra({
  justify,
  align,
  wrap,
}: Pick<LayoutProps, 'justify' | 'align' | 'wrap'>): CSSProperties {
  return {
    ...(justify ? { justifyContent: JUSTIFY[justify] } : {}),
    ...(align ? { alignItems: ALIGN[align] } : {}),
    ...(wrap ? { flexWrap: wrap } : {}),
  };
}

/** Vertical flow container — the most common email-safe layout (ADR-0003). */
export function Stack({ style, justify, align, wrap, children }: LayoutProps) {
  return (
    <div style={{ ...column, ...flowExtra({ justify, align, wrap }), ...styleFromTokens(style) }}>
      {children}
    </div>
  );
}

/** Same as Stack; named separately so the IR vocabulary maps 1:1 to components. */
export function Column({ style, justify, align, wrap, children }: LayoutProps) {
  return (
    <div style={{ ...column, ...flowExtra({ justify, align, wrap }), ...styleFromTokens(style) }}>
      {children}
    </div>
  );
}

/** Horizontal container; children are wrapped flex:1 by the canvas renderer. */
export function Row({ style, justify, align, wrap, children }: LayoutProps) {
  return (
    <div style={{ ...row, ...flowExtra({ justify, align, wrap }), ...styleFromTokens(style) }}>
      {children}
    </div>
  );
}

export interface GridProps extends LayoutProps {
  columns: number;
}

/** CSS grid with `columns` equal tracks. NOT email-safe (ADR-0006). */
export function Grid({ columns, style, justify, align, children }: GridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${String(columns)}, 1fr)`,
        ...flowExtra({ justify, align, wrap: undefined }),
        ...styleFromTokens(style),
      }}
    >
      {children}
    </div>
  );
}
