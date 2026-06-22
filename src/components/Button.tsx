import { type CSSProperties, type ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';

// The base style every button variant shares. React Aria handles the accessible
// behaviour (focus management, keyboard, press); we only paint the theme.
const base: CSSProperties = {
  display: 'inline-block',
  textAlign: 'center',
  textDecoration: 'none',
  padding: 'var(--space-sm) var(--space-md)',
  borderRadius: 'var(--radius-lg)',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-size-base)',
  fontWeight: 'var(--font-weight-semibold)', // RP-3: was hard-coded 600
  cursor: 'pointer',
  borderStyle: 'solid',
  borderWidth: 0,
};

const primary: CSSProperties = { background: 'var(--color-brand)', color: 'var(--color-on-brand)' };
const secondary: CSSProperties = {
  background: 'transparent',
  color: 'var(--color-brand)',
  borderWidth: 1,
  borderColor: 'var(--color-brand)',
};

export interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: ReactNode;
  onPress?: () => void;
}

/**
 * Themed, accessible button built on React Aria Components (ADR-0005). The visual
 * states (hover/press/focus-visible) are driven by React Aria's render props, so
 * keyboard and pointer interaction are correct without extra wiring.
 */
export function Button({ variant, children, onPress }: ButtonProps) {
  return (
    <AriaButton
      {...(onPress ? { onPress } : {})}
      style={({ isHovered, isPressed, isFocusVisible }) => ({
        ...base,
        ...(variant === 'primary' ? primary : secondary),
        filter: isPressed ? 'brightness(0.92)' : isHovered ? 'brightness(0.96)' : undefined,
        outline: isFocusVisible ? '2px solid var(--color-brand)' : 'none',
        outlineOffset: 2,
      })}
    >
      {children}
    </AriaButton>
  );
}
