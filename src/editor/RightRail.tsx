import { type ReactElement } from 'react';

import { Icon, IconButton, Tabs } from '../design-system';

import { ExportPanel } from './ExportPanel';
import { Inspector } from './Inspector';
import { useEditor, type RightTab } from './store';
import { StructurePanel } from './StructurePanel';
import { ThemePanel } from './ThemePanel';

const TABS = [
  { value: 'inspector', label: 'Inspector' },
  { value: 'structure', label: 'Structure' },
  { value: 'design', label: 'Design' },
  { value: 'export', label: 'Export' },
];

const TITLES: Record<RightTab, string> = {
  inspector: 'Properties',
  structure: 'Structure',
  design: 'Design Palette',
  export: 'Export',
};

interface RightRailProps {
  /** Whether the panel is folded to its collapsed strip. */
  collapsed: boolean;
  /** Fold / unfold the panel. */
  onToggle: (collapsed: boolean) => void;
}

/** The right rail: a tabbed Inspector / Design Palette / Export panel. Foldable to a thin strip with a
 *  single expand button, handing the width to the Board. (Selecting a node auto-unfolds it — see store.) */
export function RightRail({ collapsed, onToggle }: RightRailProps): ReactElement {
  const rightTab = useEditor((s) => s.rightTab);
  const setRightTab = useEditor((s) => s.setRightTab);

  // Collapsed: just a thin strip with an expand button (the panel content is unmounted).
  if (collapsed) {
    return (
      <aside className="ed-right" data-collapsed="true">
        <div className="ed-rail-strip">
          <IconButton
            size="sm"
            aria-label="Expand inspector"
            onClick={() => {
              onToggle(false);
            }}
          >
            <Icon.chevronLeft />
          </IconButton>
        </div>
      </aside>
    );
  }

  return (
    <aside className="ed-right" data-collapsed="false">
      <div className="ed-rail-head">
        <span className="ed-rail-title">{TITLES[rightTab]}</span>
        <IconButton
          size="sm"
          aria-label="Collapse inspector"
          onClick={() => {
            onToggle(true);
          }}
        >
          <Icon.chevronRight />
        </IconButton>
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
        {rightTab === 'structure' && <StructurePanel />}
        {rightTab === 'design' && <ThemePanel />}
        {rightTab === 'export' && <ExportPanel />}
      </div>
    </aside>
  );
}
