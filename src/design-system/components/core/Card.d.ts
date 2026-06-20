import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Inner padding. Pass a falsy value for none. */
  pad?: 'sm' | 'md' | 'lg' | false;
  /** Surface treatment. */
  variant?: 'default' | 'sunken' | 'flat';
  /** Adds hover lift + pointer (use for clickable cards). */
  interactive?: boolean;
  /** Accent selection ring. */
  selected?: boolean;
  children?: React.ReactNode;
}

/** Card — neutral surface container with soft border + gentle shadow. */
export function Card(props: CardProps): JSX.Element;
