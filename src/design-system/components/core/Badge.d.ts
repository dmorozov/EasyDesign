import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color tone. */
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'outline';
  /** Show a leading status dot. */
  dot?: boolean;
  children?: React.ReactNode;
}

/** Badge — small status pill for save state, mode, counts, markers. */
export function Badge(props: BadgeProps): JSX.Element;
