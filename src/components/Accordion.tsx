import { createContext, type CSSProperties, type ReactNode, useContext, useId } from 'react';

import { type StyleMap } from '../ir/types';

import { styleFromTokens } from './tokens';

// Accordion / AccordionItem (ADR-0022) — β's React home for the canvas/editor runtime (ADR-0005). Unlike
// the React-Aria compounds, an accordion is just native <details>/<summary>: interactive with zero JS,
// identical on the canvas and in the three web exports (canvas == export). The string generators keep
// their own copy in leaf-style (accordionDecls/…); this stays byte-aligned with them on the same CSS-var
// token graph. `exclusive` (single-open) is the native <details name> grouping — the Accordion mints one
// group name (useId) and shares it with its items via context, so opening one section closes the others.

const accordionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-sm)',
};
const itemStyle: CSSProperties = {
  border: '1px solid var(--color-muted)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  fontFamily: 'var(--font-family)',
};
const summaryStyle: CSSProperties = {
  padding: 'var(--space-sm) var(--space-md)',
  cursor: 'pointer',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-size-base)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--color-text)',
};
const panelStyle: CSSProperties = {
  padding: 'var(--space-md)',
  color: 'var(--color-text)',
};

/** When set, every AccordionItem shares this `<details name>` so only one opens at a time (single-open). */
const AccordionGroupContext = createContext<string | undefined>(undefined);

export interface AccordionProps {
  exclusive?: boolean;
  style?: StyleMap | undefined;
  children?: ReactNode;
}

export function Accordion({ exclusive = false, style, children }: AccordionProps) {
  const groupId = useId();
  const name = exclusive ? `acc-${groupId}` : undefined;
  return (
    <AccordionGroupContext.Provider value={name}>
      <div style={{ ...accordionStyle, ...styleFromTokens(style) }}>{children}</div>
    </AccordionGroupContext.Provider>
  );
}

export interface AccordionItemProps {
  title: string;
  open?: boolean;
  style?: StyleMap | undefined;
  children?: ReactNode;
}

/** One collapsible section: a native <details> whose <summary> is the title and whose body is the panel. */
export function AccordionItem({ title, open = false, style, children }: AccordionItemProps) {
  const name = useContext(AccordionGroupContext);
  return (
    <details name={name} open={open} style={{ ...itemStyle, ...styleFromTokens(style) }}>
      <summary style={summaryStyle}>{title}</summary>
      <div style={panelStyle}>{children}</div>
    </details>
  );
}
