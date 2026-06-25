import { Children, type CSSProperties, Fragment, type ReactNode } from 'react';

import { type StepStatus, type StyleMap } from '../ir/types';

import { styleFromTokens } from './tokens';

// Stepper / Step (this ADR) — β's React home for the canvas/editor runtime (ADR-0005). The string export
// generators keep their own copy in leaf-style (stepperListDecls/step*Decls); this stays byte-aligned
// with them on the same CSS-var token graph. A Stepper is a semantic <ol> of steps with a status badge
// (a check when complete, a brand ring when current, a muted ring when upcoming) and connector lines
// between; `orientation` lays them out in a row or column.

function listStyle(
  orientation: 'horizontal' | 'vertical',
  style: StyleMap | undefined,
): CSSProperties {
  return {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    alignItems: orientation === 'horizontal' ? 'center' : 'stretch',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    ...styleFromTokens(style),
  };
}

const itemStyle: CSSProperties = {
  listStyle: 'none',
  display: 'flex',
  alignItems: 'center',
  flex: '0 0 auto',
};

const stepStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-sm)',
};

function badgeStyle(status: StepStatus): CSSProperties {
  const base: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: '50%',
    flex: '0 0 auto',
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-semibold)',
  };
  if (status === 'complete') {
    return { ...base, background: 'var(--color-brand)', color: 'var(--color-on-brand)' };
  }
  const ring = status === 'current' ? 'var(--color-brand)' : 'var(--color-muted)';
  return { ...base, background: 'transparent', color: ring, border: `2px solid ${ring}` };
}

function labelStyle(status: StepStatus): CSSProperties {
  return {
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--font-size-sm)',
    color: status === 'upcoming' ? 'var(--color-muted)' : 'var(--color-text)',
    fontWeight: status === 'current' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
  };
}

function connectorStyle(orientation: 'horizontal' | 'vertical'): CSSProperties {
  return orientation === 'horizontal'
    ? {
        flex: '1 1 auto',
        height: 2,
        minWidth: 'var(--space-lg)',
        background: 'var(--color-muted)',
        alignSelf: 'center',
      }
    : { width: 2, minHeight: 'var(--space-md)', marginLeft: 11, background: 'var(--color-muted)' };
}

export interface StepProps {
  status: StepStatus;
  label: string;
}

/** One step: a status badge + the label. `aria-current="step"` marks the current step. */
export function Step({ status, label }: StepProps) {
  return (
    <div aria-current={status === 'current' ? 'step' : undefined} style={stepStyle}>
      <span style={badgeStyle(status)}>{status === 'complete' ? '✓' : ''}</span>
      <span style={labelStyle(status)}>{label}</span>
    </div>
  );
}

export interface StepperProps {
  orientation: 'horizontal' | 'vertical';
  style?: StyleMap | undefined;
  children?: ReactNode;
}

/** A semantic `<ol>` of steps with a connector line between each. */
export function Stepper({ orientation, style, children }: StepperProps) {
  const steps = Children.toArray(children);
  return (
    <ol style={listStyle(orientation, style)}>
      {steps.map((step, i) => (
        <Fragment key={i}>
          <li style={itemStyle}>{step}</li>
          {/* The connector is its OWN aria-hidden <li> so the <ol> holds only <li> children (valid list
              markup), while staying an <ol>-level flex sibling that grows to fill the gap. */}
          {i < steps.length - 1 && <li aria-hidden="true" style={connectorStyle(orientation)} />}
        </Fragment>
      ))}
    </ol>
  );
}
