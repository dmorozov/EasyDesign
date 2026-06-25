import { type CSSProperties, type ReactNode } from 'react';

import { TOOL_ICON_LABEL, TOOLBAR_ICON_INNER } from '../generators/toolbar-icons';
import { type StyleMap, type ToolIcon } from '../ir/types';

import { styleFromTokens } from './tokens';

// ToolBar / ToolButton (this ADR) — β's React home for the canvas/editor runtime (ADR-0005). The string
// export generators keep their own copy in leaf-style (toolBarDecls/toolButtonDecls). The icon glyph has
// ONE source — `toolbar-icons.ts` (raw inner SVG) — shared by BOTH the export emitters and this canvas
// (injected via dangerouslySetInnerHTML), so the live preview and the exported markup never drift, and
// the SSR canvas never pulls in the chrome icon set (which would break the headless generate runner).
// A ToolBar is a <div role="toolbar"> of icon/label buttons.

function barStyle(style: StyleMap | undefined): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...styleFromTokens(style),
  };
}

const buttonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-sm)',
  padding: 'var(--space-sm) var(--space-md)',
  border: '1px solid transparent',
  borderRadius: 'var(--radius-lg)',
  background: 'transparent',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 'var(--font-weight-medium)',
  lineHeight: 1,
  cursor: 'pointer',
};

// The same presentation the export's ICON_SVG_STYLE carries, as a CSSProperties object.
const iconStyle: CSSProperties = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export interface ToolButtonProps {
  icon: ToolIcon;
  label: string;
}

/** One tool button: the icon, plus the label text when present (an empty label → an icon-only button,
 *  which takes the icon's HUMAN name as its accessible label — TOOL_ICON_LABEL, not the developer key). A
 *  design preview never acts, so the click is a no-op `type="button"`. */
export function ToolButton({ icon, label }: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={label ? undefined : TOOL_ICON_LABEL[icon]}
      style={buttonStyle}
    >
      <svg
        viewBox="0 0 24 24"
        width={16}
        height={16}
        aria-hidden="true"
        style={iconStyle}
        dangerouslySetInnerHTML={{ __html: TOOLBAR_ICON_INNER[icon] }}
      />
      {label ? <span>{label}</span> : null}
    </button>
  );
}

export interface ToolBarProps {
  label: string;
  style?: StyleMap | undefined;
  children?: ReactNode;
}

/** A `<div role="toolbar">` of buttons; `label` is its accessible name. */
export function ToolBar({ label, style, children }: ToolBarProps) {
  return (
    <div role="toolbar" aria-label={label} style={barStyle(style)}>
      {children}
    </div>
  );
}
