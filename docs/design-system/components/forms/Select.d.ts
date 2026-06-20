import * as React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  /** Options as strings or {value,label}. Ignored if children are passed. */
  options?: (string | SelectOption)[];
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

/** Select — native dropdown styled to match chrome controls. */
export function Select(props: SelectProps): JSX.Element;
