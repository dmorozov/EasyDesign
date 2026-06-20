import * as React from 'react';

export interface TabItem {
  value: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  /** Optional count pill (e.g. layer count). */
  count?: number;
}

export interface TabsProps {
  tabs: (string | TabItem)[];
  value: string;
  onChange?: (value: string) => void;
  /** `underline` (default, panel headers) or `pill` (compact toggle). */
  variant?: 'underline' | 'pill';
  className?: string;
}

/** Tabs — horizontal view switcher for right-rail panels and palette/export groups. */
export function Tabs(props: TabsProps): JSX.Element;
