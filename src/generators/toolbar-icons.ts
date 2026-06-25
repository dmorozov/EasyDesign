// src/generators/toolbar-icons.ts — the INNER SVG markup for each ToolButton icon (this ADR).
//
// The three string Export Targets must inline an icon's SVG (the IR/export layer can't import the
// chrome icon set — ADR-0007), so this is the export-side icon source. Only the INNER shapes live here
// (`<path>`/`<circle>`/`<rect>`), whose attributes (`d`/`cx`/`r`/…) are identical in HTML and JSX; the
// presentational styling (stroke/fill) is a shared `style` the emitters serialize per dialect
// (`leaf-style.ICON_SVG_STYLE`), so ONE inner-markup source serves all targets. The glyphs are copied
// verbatim from the design-system `Icon` set (`src/design-system/icons.jsx`) so the export matches the
// live canvas (which renders the chrome `<Icon[icon]>`); the keys are `ToolIcon`, so the map is
// compile-complete (a new ToolIcon is a missing-key error here).
import { type ToolIcon } from '../ir/types';

export const TOOLBAR_ICON_INNER: Record<ToolIcon, string> = {
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h1"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  image:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5L5 20"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  alignL: '<path d="M3 6h18M3 12h12M3 18h15"/>',
  alignC: '<path d="M3 6h18M6 12h12M5 18h14"/>',
  alignR: '<path d="M3 6h18M9 12h12M6 18h15"/>',
};

/** A HUMAN accessible name per icon (WCAG 4.1.2), the single source for an icon-only ToolButton's
 *  aria-label across all four export targets and the canvas — so a screen reader announces "Align left",
 *  not the developer key "alignL". */
export const TOOL_ICON_LABEL: Record<ToolIcon, string> = {
  undo: 'Undo',
  redo: 'Redo',
  copy: 'Copy',
  trash: 'Delete',
  image: 'Insert image',
  code: 'Code',
  search: 'Search',
  alignL: 'Align left',
  alignC: 'Align center',
  alignR: 'Align right',
};
