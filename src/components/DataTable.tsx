import { Children, type CSSProperties, Fragment, type ReactNode } from 'react';

import { type StyleMap } from '../ir/types';

import { styleFromTokens } from './tokens';

// DataTable / TableRow / TableCell (ADR-0021) — β's React home for the canvas/editor runtime (ADR-0005).
// The string export generators keep their own copy in leaf-style (dataTableDecls/tableCellDecls/…); this
// stays byte-aligned with them on the same CSS-var token graph. A DataTable is a semantic <table> — a
// <caption>, a <thead> of header rows and a <tbody> of body rows — of plain-text cells. The ROW owns the
// <th>/<td> decision (its `header` flag, the single source of truth); the table is partitioned into
// thead/tbody by the EMITTER (which holds the IR), so this component only lays the groups out.

function tableStyle(style: StyleMap | undefined): CSSProperties {
  return {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text)',
    ...styleFromTokens(style),
  };
}

const captionStyle: CSSProperties = {
  textAlign: 'left',
  fontFamily: 'var(--font-family)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--color-text)',
  paddingBottom: 'var(--space-sm)',
};

const headerCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: 'var(--space-sm) var(--space-md)',
  borderBottom: '2px solid var(--color-muted)',
  fontFamily: 'var(--font-family)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--color-text)',
};

const bodyCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: 'var(--space-sm) var(--space-md)',
  borderBottom: '1px solid var(--color-muted)',
  color: 'var(--color-text)',
};

export interface TableRowProps {
  header?: boolean;
  children?: ReactNode;
}

/** One table row: a <tr> that wraps each cell in <th scope="col"> (header row) or <td> (body row). */
export function TableRow({ header = false, children }: TableRowProps) {
  const cells = Children.toArray(children);
  return (
    <tr>
      {cells.map((cell, i) =>
        header ? (
          <th key={i} scope="col" style={headerCellStyle}>
            {cell}
          </th>
        ) : (
          <td key={i} style={bodyCellStyle}>
            {cell}
          </td>
        ),
      )}
    </tr>
  );
}

export interface DataTableProps {
  caption?: string;
  style?: StyleMap | undefined;
  /** Rendered TableRow elements whose `header` flag is true — wrapped in <thead>. */
  headerRows?: ReactNode[];
  /** Rendered body TableRow elements — wrapped in <tbody>. */
  bodyRows?: ReactNode[];
}

/** A semantic <table>: a caption + a <thead> of header rows and a <tbody> of body rows. */
export function DataTable({ caption, style, headerRows = [], bodyRows = [] }: DataTableProps) {
  return (
    <table style={tableStyle(style)}>
      {caption ? <caption style={captionStyle}>{caption}</caption> : null}
      {headerRows.length > 0 && (
        <thead>
          {headerRows.map((r, i) => (
            <Fragment key={i}>{r}</Fragment>
          ))}
        </thead>
      )}
      {bodyRows.length > 0 && (
        <tbody>
          {bodyRows.map((r, i) => (
            <Fragment key={i}>{r}</Fragment>
          ))}
        </tbody>
      )}
    </table>
  );
}
