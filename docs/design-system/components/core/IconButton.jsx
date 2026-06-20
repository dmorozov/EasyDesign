import React from 'react';

const CSS = `
.eds-iconbtn{
  display:inline-flex;align-items:center;justify-content:center;
  border:var(--border-w) solid transparent;border-radius:var(--radius-md);
  color:var(--icon);background:transparent;cursor:pointer;padding:0;
  transition:background var(--dur) var(--ease-out),color var(--dur) var(--ease-out),
             border-color var(--dur) var(--ease-out),box-shadow var(--dur) var(--ease-out);
}
.eds-iconbtn svg{display:block;width:1em;height:1em;}
.eds-iconbtn:hover{background:var(--surface-hover);color:var(--icon-strong);}
.eds-iconbtn:active{background:var(--slate-150);}
.eds-iconbtn:focus-visible{outline:none;box-shadow:var(--ring-focus);}
.eds-iconbtn:disabled{opacity:.45;cursor:not-allowed;pointer-events:none;}
.eds-iconbtn--sm{width:28px;height:28px;font-size:16px;}
.eds-iconbtn--md{width:34px;height:34px;font-size:18px;}
.eds-iconbtn--lg{width:40px;height:40px;font-size:20px;}
.eds-iconbtn--bordered{border-color:var(--border);background:var(--surface);box-shadow:var(--shadow-xs);}
.eds-iconbtn--bordered:hover{border-color:var(--border-strong);}
.eds-iconbtn--active{background:var(--accent-soft);color:var(--accent-press);}
.eds-iconbtn--active:hover{background:var(--accent-soft-2);color:var(--accent-press);}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'iconbutton');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** IconButton — a square, label-less control for toolbar actions (undo, zoom, settings). */
export function IconButton({
  children,
  size = 'md',
  bordered = false,
  active = false,
  className = '',
  'aria-label': ariaLabel,
  ...rest
}) {
  useStyles();
  const cls = [
    'eds-iconbtn',
    `eds-iconbtn--${size}`,
    bordered ? 'eds-iconbtn--bordered' : '',
    active ? 'eds-iconbtn--active' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} aria-label={ariaLabel} aria-pressed={active || undefined} {...rest}>
      {children}
    </button>
  );
}
