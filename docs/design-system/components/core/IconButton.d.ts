import * as React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Square control size. */
  size?: 'sm' | 'md' | 'lg';
  /** Render with a white surface + 1px border (e.g. floating canvas controls). */
  bordered?: boolean;
  /** Selected/toggled state (indigo tint). */
  active?: boolean;
  /** Required for accessibility — describes the action. */
  'aria-label': string;
  children?: React.ReactNode;
}

/** IconButton — square, label-less control for toolbar & canvas actions. */
export function IconButton(props: IconButtonProps): JSX.Element;
