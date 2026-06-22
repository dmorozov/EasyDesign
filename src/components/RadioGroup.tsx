import { type CSSProperties, type ReactNode } from 'react';
import { Label, Radio as AriaRadio, RadioGroup as AriaRadioGroup } from 'react-aria-components';

import { type StyleMap } from '../ir/types';

import { styleFromTokens } from './tokens';

// The compound Component (RP-10 / ADR-0016): a themed, accessible RadioGroup whose options are Radio
// children. React Aria handles the roving-tabindex / arrow-key behaviour; we only paint the theme. This
// is β's React home for the radio markup (ADR-0005); the string generators keep their own copy in
// leaf-style. Preview state is uncontrolled (the canvas shows a design, it doesn't persist selection).

const groupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-sm)',
  border: 'none',
  margin: 0,
  padding: 0,
};
const legendStyle: CSSProperties = {
  marginBottom: 'var(--space-sm)',
  fontFamily: 'var(--font-family)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--color-text)',
};
const optionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-sm)',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-size-base)',
  color: 'var(--color-text)',
  cursor: 'pointer',
};
const dot = (selected: boolean): CSSProperties => ({
  width: 16,
  height: 16,
  borderRadius: '50%',
  border: '2px solid var(--color-brand)',
  background: selected ? 'var(--color-brand)' : 'transparent',
  boxShadow: selected ? 'inset 0 0 0 3px var(--color-surface)' : 'none',
  flex: '0 0 auto',
});

export interface RadioGroupProps {
  label: string;
  style?: StyleMap | undefined;
  children?: ReactNode;
}

export function RadioGroup({ label, style, children }: RadioGroupProps) {
  return (
    <AriaRadioGroup style={{ ...groupStyle, ...styleFromTokens(style) }}>
      <Label style={legendStyle}>{label}</Label>
      {children}
    </AriaRadioGroup>
  );
}

export interface RadioProps {
  value: string;
  children?: ReactNode;
}

export function Radio({ value, children }: RadioProps) {
  return (
    <AriaRadio value={value} style={optionStyle}>
      {({ isSelected }) => (
        <>
          <span style={dot(isSelected)} />
          {children}
        </>
      )}
    </AriaRadio>
  );
}
