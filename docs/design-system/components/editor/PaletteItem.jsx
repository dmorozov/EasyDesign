import React from 'react';

const CSS = `
.eds-pal{
  position:relative;display:flex;align-items:center;gap:11px;width:100%;
  border:var(--border-w) solid var(--border);border-radius:var(--radius-lg);
  background:var(--surface);color:var(--text-body);cursor:grab;text-align:left;
  font-family:var(--font-sans);
  transition:border-color var(--dur) var(--ease-out),box-shadow var(--dur) var(--ease-out),
             transform var(--dur-fast) var(--ease-out),background var(--dur) var(--ease-out);
}
.eds-pal:active{cursor:grabbing;}
.eds-pal__icon{flex:none;display:flex;align-items:center;justify-content:center;color:var(--icon-strong);}
.eds-pal__icon svg{width:20px;height:20px;display:block;}
.eds-pal__label{font-size:var(--fs-base);font-weight:var(--fw-medium);color:var(--text-ink);}
.eds-pal__grip{margin-left:auto;display:flex;color:var(--text-faint);opacity:0;transition:opacity var(--dur) var(--ease-out);}
.eds-pal__grip svg{width:16px;height:16px;display:block;}

.eds-pal:hover{border-color:var(--accent);box-shadow:var(--shadow-lift);transform:translateY(-1px);}
.eds-pal:hover .eds-pal__grip{opacity:1;}
.eds-pal:hover .eds-pal__icon{color:var(--accent-press);}
.eds-pal:focus-visible{outline:none;box-shadow:var(--ring-focus);}

/* row layout (Heading, Text, Button rows) */
.eds-pal--row{padding:12px 14px;}
/* card layout (Stack, Row, Column, Grid tiles) */
.eds-pal--card{flex-direction:column;gap:8px;justify-content:center;padding:16px 12px;text-align:center;min-height:76px;}
.eds-pal--card .eds-pal__icon svg{width:22px;height:22px;}
.eds-pal--card .eds-pal__label{font-size:var(--fs-sm);}
.eds-pal--card .eds-pal__grip{position:absolute;top:8px;right:8px;margin:0;}

/* dragging ghost */
.eds-pal--dragging{opacity:.55;border-style:dashed;box-shadow:none;transform:none;cursor:grabbing;}

/* disabled / not available in current medium */
.eds-pal--disabled{cursor:not-allowed;background:var(--surface-sunken);border-style:dashed;border-color:var(--border);}
.eds-pal--disabled .eds-pal__icon,.eds-pal--disabled .eds-pal__label{color:var(--text-faint);}
.eds-pal--disabled:hover{transform:none;box-shadow:none;border-color:var(--border);}
.eds-pal__lock{margin-left:auto;display:flex;color:var(--text-faint);}
.eds-pal__lock svg{width:14px;height:14px;}
.eds-pal--card .eds-pal__lock{position:absolute;top:8px;right:8px;margin:0;}
.eds-pal__note{font-size:var(--fs-micro);color:var(--text-faint);font-weight:var(--fw-medium);}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'paletteitem');
  el.textContent = CSS;
  document.head.appendChild(el);
}

const Grip = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>
);
const Lock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
);

/**
 * PaletteItem — a draggable component tile/row in the left Component Palette.
 * Drag onto the board to add. Greyed when not available in the current frame medium.
 */
export function PaletteItem({
  icon,
  label,
  layout = 'row',
  dragging = false,
  disabled = false,
  disabledNote,
  draggable = true,
  className = '',
  ...rest
}) {
  useStyles();
  const cls = [
    'eds-pal',
    `eds-pal--${layout}`,
    dragging ? 'eds-pal--dragging' : '',
    disabled ? 'eds-pal--disabled' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      className={cls}
      draggable={draggable && !disabled}
      aria-disabled={disabled || undefined}
      title={disabled && disabledNote ? disabledNote : undefined}
      {...rest}
    >
      <span className="eds-pal__icon">{icon}</span>
      <span className="eds-pal__label">{label}</span>
      {disabled
        ? <span className="eds-pal__lock"><Lock /></span>
        : <span className="eds-pal__grip"><Grip /></span>}
    </button>
  );
}
