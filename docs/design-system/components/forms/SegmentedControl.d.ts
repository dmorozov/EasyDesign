import * as React from 'react';

export interface SegmentOption {
  value: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  options: (string | SegmentOption)[];
  /** Currently selected value. */
  value: string;
  onChange?: (value: string) => void;
  /** Hide labels, show only icons (e.g. alignment row). */
  iconOnly?: boolean;
  className?: string;
}

/** SegmentedControl — compact pill of mutually-exclusive options (Web↔Email, alignment). */
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
