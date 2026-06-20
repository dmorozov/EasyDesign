import * as React from 'react';

export interface PanelSectionProps {
  /** ALL-CAPS micro-label shown in the header. */
  title: React.ReactNode;
  /** Optional trailing action (icon button) — clicks don't toggle the section. */
  action?: React.ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial state. */
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  /** Set false to render a fixed, non-collapsing section. */
  collapsible?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export interface PanelHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** PanelSection — collapsible right-rail section with an ALL-CAPS micro-label header. */
export function PanelSection(props: PanelSectionProps): JSX.Element;

/** PanelHeader — non-collapsible panel title block (title + subtitle + action). */
export function PanelHeader(props: PanelHeaderProps): JSX.Element;
