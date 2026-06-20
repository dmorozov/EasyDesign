import * as React from 'react';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional text label beside the toggle. */
  label?: React.ReactNode;
  disabled?: boolean;
}

/** Switch — on/off toggle for binary settings. */
export function Switch(props: SwitchProps): JSX.Element;
