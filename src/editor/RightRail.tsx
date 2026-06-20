import { type ReactElement } from 'react';

import { Tabs } from '../design-system';

import { ExportPanel } from './ExportPanel';
import { Inspector } from './Inspector';
import { useEditor, type RightTab } from './store';
import { ThemePanel } from './ThemePanel';

const TABS = [
  { value: 'inspector', label: 'Inspector' },
  { value: 'design', label: 'Design' },
  { value: 'export', label: 'Export' },
];

const TITLES: Record<RightTab, string> = {
  inspector: 'Properties',
  design: 'Design Palette',
  export: 'Export',
};

/** The right rail: a title + DS Tabs switching the Inspector / Design Palette / Export panels. */
export function RightRail(): ReactElement {
  const rightTab = useEditor((s) => s.rightTab);
  const setRightTab = useEditor((s) => s.setRightTab);

  return (
    <aside className="ed-right">
      <div className="ed-rail-head">
        <span className="ed-rail-title">{TITLES[rightTab]}</span>
      </div>
      <div className="ed-rail-tabs">
        <Tabs
          tabs={TABS}
          value={rightTab}
          onChange={(v) => {
            setRightTab(v as RightTab);
          }}
        />
      </div>
      <div className="ed-rail-body">
        {rightTab === 'inspector' && <Inspector />}
        {rightTab === 'design' && <ThemePanel />}
        {rightTab === 'export' && <ExportPanel />}
      </div>
    </aside>
  );
}
