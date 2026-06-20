import * as React from 'react';

export interface SwatchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /** Swatch role name (e.g. "Primary", "Background", "Text"). */
  name: React.ReactNode;
  /** Current hex color. */
  value?: string;
  onChange?: (hex: string) => void;
  selected?: boolean;
  /** Show the hex value on the right. */
  showValue?: boolean;
}

export interface SwatchChipProps {
  value?: string;
  onChange?: (hex: string) => void;
  selected?: boolean;
  title?: string;
  className?: string;
}

/** Swatch — Design-Palette color row (chip + name + hex). Editing re-themes the board. */
export function Swatch(props: SwatchProps): JSX.Element;

/** SwatchChip — compact square color chip for tight palette grids. */
export function SwatchChip(props: SwatchChipProps): JSX.Element;
