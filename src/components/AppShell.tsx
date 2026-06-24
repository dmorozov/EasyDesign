import { type CSSProperties, type ReactNode } from 'react';

import { APPSHELL_MIN_HEIGHT, appShellTemplate, type RegionArea } from '../ir/appshell';
import { type StyleMap } from '../ir/types';

import { styleFromTokens } from './tokens';

/** One placed region: the area it occupies + its already-rendered content. */
export interface AppShellCell {
  area: RegionArea;
  content: ReactNode;
}

export interface AppShellProps {
  /** The present regions (drives the computed grid template). */
  areas: readonly RegionArea[];
  /** The shell's token-bound style (background/padding/gap). */
  style?: StyleMap | undefined;
  /** The region contents, each placed into its grid area. */
  cells: AppShellCell[];
}

/** The application-shell grid container style for the given regions (ADR-0017). β's React home (canvas
 *  + editor); the string generators keep their copy in generators/leaf-style.ts (`appShellDecls`). */
function appShellGridStyle(areas: readonly RegionArea[], style?: StyleMap): CSSProperties {
  const t = appShellTemplate(areas);
  return {
    display: 'grid',
    gridTemplateColumns: t.columns,
    gridTemplateRows: t.rows,
    gridTemplateAreas: t.areas,
    minHeight: APPSHELL_MIN_HEIGHT,
    ...styleFromTokens(style),
  };
}

/**
 * A CSS-grid application shell (ADR-0017): a computed `grid-template-areas` grid that places each
 * `Region` cell into its named area. Web-only; the grid template is derived from which regions are
 * present, so toggling/reordering regions never corrupts the layout (placement is by name).
 */
export function AppShell({ areas, style, cells }: AppShellProps) {
  return (
    <div style={appShellGridStyle(areas, style)}>
      {cells.map((cell, i) => (
        // A grid item; `display:grid` lets the single Region child stretch to fill its cell.
        <div key={i} style={{ gridArea: cell.area, display: 'grid', minWidth: 0, minHeight: 0 }}>
          {cell.content}
        </div>
      ))}
    </div>
  );
}
