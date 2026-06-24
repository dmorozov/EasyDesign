// src/ir/appshell.ts — the AppShell application-layout grid template (ADR-0017).
//
// Pure and import-free (like the rest of the IR substrate): the ONE place the app-shell grid maths
// lives, shared by all five renderers (canvas, editor, html, react, angular) so the four Export
// Targets + the live canvas can never drift. An AppShell is a CSS grid whose template is COMPUTED
// from which Region children are present; each Region names the AREA it occupies, so toggling or
// reordering regions can never corrupt the layout (placement is by name, not document order).

export type RegionArea = 'header' | 'left' | 'main' | 'right' | 'footer';

/** Canonical visual order (top→bottom, left→right). Used to render the toggles + order the columns. */
export const CANONICAL_AREAS: readonly RegionArea[] = ['header', 'left', 'main', 'right', 'footer'];

/** The optional regions — everything except the required `main` (drives the Inspector panel toggles). */
export const OPTIONAL_AREAS: readonly RegionArea[] = ['header', 'left', 'right', 'footer'];

// Fixed v1 sizing baked into the template (per-region size controls are a deferred follow-up).
const LEFT_W = '240px';
const RIGHT_W = '300px';
/** A visible min-height so the shell reads as an application frame even while its regions are empty. */
export const APPSHELL_MIN_HEIGHT = '480px';

export interface AppShellTemplate {
  /** grid-template-areas (space-joined quoted rows). */
  readonly areas: string;
  /** grid-template-rows. */
  readonly rows: string;
  /** grid-template-columns. */
  readonly columns: string;
}

/** Compute the CSS grid template for the present regions. `main` is always implied present. */
export function appShellTemplate(present: readonly RegionArea[]): AppShellTemplate {
  const has = (a: RegionArea): boolean => present.includes(a);
  const header = has('header');
  const footer = has('footer');
  const left = has('left');
  const right = has('right');

  // Columns, left → right: [left] main [right].
  const cols: string[] = [];
  if (left) cols.push(LEFT_W);
  cols.push('minmax(0, 1fr)'); // main
  if (right) cols.push(RIGHT_W);

  // The middle row's named cells, in column order; header/footer rows span all present columns.
  // Single-quoted so the value is valid inside an HTML/Angular `style="…"` attribute (double quotes
  // would terminate it); CSS accepts either quote, and React's source wraps such values in "…".
  const middle: RegionArea[] = [];
  if (left) middle.push('left');
  middle.push('main');
  if (right) middle.push('right');
  const spanRow = (name: RegionArea): string => `'${middle.map(() => name).join(' ')}'`;

  const areaRows: string[] = [];
  const rowSizes: string[] = [];
  if (header) {
    areaRows.push(spanRow('header'));
    rowSizes.push('auto');
  }
  areaRows.push(`'${middle.join(' ')}'`);
  rowSizes.push('minmax(0, 1fr)');
  if (footer) {
    areaRows.push(spanRow('footer'));
    rowSizes.push('auto');
  }

  return {
    areas: areaRows.join(' '),
    rows: rowSizes.join(' '),
    columns: cols.join(' '),
  };
}
