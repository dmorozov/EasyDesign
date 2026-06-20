import React from 'react';

/* Inject component styles once. Self-contained; relies only on DS custom properties. */
const CSS = `
.eds-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  font-family:var(--font-sans);font-weight:var(--fw-semibold);
  border:var(--border-w) solid transparent;border-radius:var(--radius-md);
  cursor:pointer;white-space:nowrap;user-select:none;
  transition:background var(--dur) var(--ease-out),border-color var(--dur) var(--ease-out),
             box-shadow var(--dur) var(--ease-out),transform var(--dur-fast) var(--ease-out),color var(--dur) var(--ease-out);
}
.eds-btn:focus-visible{outline:none;box-shadow:var(--ring-focus);}
.eds-btn:disabled{opacity:.5;cursor:not-allowed;pointer-events:none;}
.eds-btn--sm{height:var(--control-h-sm);padding:0 12px;font-size:var(--fs-sm);}
.eds-btn--md{height:var(--control-h);padding:0 16px;font-size:var(--fs-base);}
.eds-btn--lg{height:var(--control-h-lg);padding:0 22px;font-size:var(--fs-md);}
.eds-btn--block{width:100%;}

.eds-btn--primary{background:var(--accent);color:var(--on-accent);box-shadow:var(--shadow-xs);}
.eds-btn--primary:hover{background:var(--accent-hover);box-shadow:var(--shadow-sm);}
.eds-btn--primary:active{background:var(--accent-press);transform:translateY(.5px);box-shadow:none;}

.eds-btn--secondary{background:var(--surface);color:var(--text-body);border-color:var(--border);box-shadow:var(--shadow-xs);}
.eds-btn--secondary:hover{background:var(--surface-hover);border-color:var(--border-strong);}
.eds-btn--secondary:active{background:var(--slate-150);transform:translateY(.5px);}

.eds-btn--ghost{background:transparent;color:var(--text-body);}
.eds-btn--ghost:hover{background:var(--surface-hover);}
.eds-btn--ghost:active{background:var(--slate-150);}

.eds-btn--soft{background:var(--accent-soft);color:var(--accent-press);}
.eds-btn--soft:hover{background:var(--accent-soft-2);}
.eds-btn--soft:active{transform:translateY(.5px);}

.eds-btn--danger{background:transparent;color:var(--danger);}
.eds-btn--danger:hover{background:var(--danger-soft);color:var(--danger-hover);}

.eds-btn__icon{display:inline-flex;align-items:center;justify-content:center;}
.eds-btn__icon svg{display:block;width:1em;height:1em;}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'button');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/**
 * Button — the primary clickable action in EasyDesign chrome.
 * One accent-filled primary per region; everything else secondary / ghost / soft.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  icon = null,
  iconRight = null,
  type = 'button',
  className = '',
  ...rest
}) {
  useStyles();
  const cls = [
    'eds-btn',
    `eds-btn--${variant}`,
    `eds-btn--${size}`,
    block ? 'eds-btn--block' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={cls} {...rest}>
      {icon && <span className="eds-btn__icon">{icon}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span className="eds-btn__icon">{iconRight}</span>}
    </button>
  );
}
