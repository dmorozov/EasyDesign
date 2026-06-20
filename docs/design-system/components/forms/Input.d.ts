import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label rendered above the control. */
  label?: React.ReactNode;
  /** Helper text below the control. */
  hint?: React.ReactNode;
  /** Leading adornment (icon/unit). */
  lead?: React.ReactNode;
  /** Trailing adornment (icon/unit, e.g. "px"). */
  trail?: React.ReactNode;
  size?: 'sm' | 'md';
  /** Error styling. */
  invalid?: boolean;
}

/** Input — labeled single-line text field (Inspector content & dimension fields). */
export function Input(props: InputProps): JSX.Element;
