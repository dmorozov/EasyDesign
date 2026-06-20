import * as React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Text label rendered beside the box. */
  label?: React.ReactNode;
  disabled?: boolean;
}

/** Checkbox — square multi-select control with an animated check. */
export function Checkbox(props: CheckboxProps): JSX.Element;
