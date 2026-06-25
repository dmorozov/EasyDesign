import { type CSSProperties, type ReactNode } from 'react';
import { Tab, TabList, TabPanel, Tabs as AriaTabs } from 'react-aria-components';

import { type StyleMap } from '../ir/types';

import { styleFromTokens } from './tokens';

// Tabs / TabPanel (ADR-0022) — β's React home for the canvas/editor runtime (ADR-0005). Tabs have no
// native element, so — unlike the native Accordion — the canvas uses a real React-Aria <Tabs> (interactive
// switching + keyboard a11y, the RadioGroup precedent); the string generators emit a static role="tablist"
// snapshot in leaf-style. The EMITTER (holding the IR) supplies each panel's `label` and rendered body;
// this lays out the tablist + tabpanels, keyed by index so the tab↔panel association stays stable.

type Orientation = 'horizontal' | 'vertical';

function tabsStyle(orientation: Orientation, style: StyleMap | undefined): CSSProperties {
  return {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'column' : 'row',
    gap: 'var(--space-md)',
    ...styleFromTokens(style),
  };
}

function tabListStyle(orientation: Orientation): CSSProperties {
  return {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    gap: 'var(--space-sm)',
    ...(orientation === 'horizontal'
      ? { borderBottom: '1px solid var(--color-muted)' }
      : { borderRight: '1px solid var(--color-muted)' }),
  };
}

function tabStyle(orientation: Orientation, isSelected: boolean): CSSProperties {
  const indicator = isSelected ? 'var(--color-brand)' : 'transparent';
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'transparent',
    border: 'none',
    ...(orientation === 'horizontal'
      ? { borderBottom: `2px solid ${indicator}` }
      : { borderRight: `2px solid ${indicator}` }),
    cursor: 'pointer',
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--font-size-base)',
    fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
    color: isSelected ? 'var(--color-brand)' : 'var(--color-text)',
  };
}

function panelStyle(style: StyleMap | undefined): CSSProperties {
  return {
    flex: 1,
    padding: 'var(--space-md)',
    ...styleFromTokens(style),
  };
}

export interface TabsPanelSpec {
  label: string;
  style?: StyleMap | undefined;
  content: ReactNode;
}

export interface TabsProps {
  orientation?: Orientation;
  style?: StyleMap | undefined;
  /** One entry per panel: its tab `label`, its own token `style`, and the rendered panel body. */
  panels: TabsPanelSpec[];
}

export function Tabs({ orientation = 'horizontal', style, panels }: TabsProps) {
  return (
    <AriaTabs orientation={orientation} style={tabsStyle(orientation, style)}>
      <TabList aria-label="Tabs" style={tabListStyle(orientation)}>
        {panels.map((p, i) => (
          <Tab key={i} id={String(i)} style={({ isSelected }) => tabStyle(orientation, isSelected)}>
            {p.label}
          </Tab>
        ))}
      </TabList>
      {panels.map((p, i) => (
        <TabPanel key={i} id={String(i)} style={panelStyle(p.style)}>
          {p.content}
        </TabPanel>
      ))}
    </AriaTabs>
  );
}
