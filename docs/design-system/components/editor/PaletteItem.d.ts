import * as React from 'react';

export interface PaletteItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Monochrome leading icon. */
  icon?: React.ReactNode;
  /** Component name shown to the user. */
  label: React.ReactNode;
  /** `row` (full-width, Content items) or `card` (square tile, Layout items). */
  layout?: 'row' | 'card';
  /** Render the drag-ghost (in-progress) appearance. */
  dragging?: boolean;
  /** Greyed/locked — not available in the current frame medium. */
  disabled?: boolean;
  /** Tooltip explaining why it's unavailable (e.g. "Not available in email"). */
  disabledNote?: string;
  draggable?: boolean;
}

/**
 * PaletteItem — draggable component tile/row in the left Component Palette.
 * @startingPoint section="Editor" subtitle="Draggable palette tiles & rows" viewport="700x200"
 */
export function PaletteItem(props: PaletteItemProps): JSX.Element;
