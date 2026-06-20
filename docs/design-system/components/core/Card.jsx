import React from 'react';

const CSS = `
.eds-card{
  background:var(--surface);border:var(--border-w) solid var(--border);
  border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);
  transition:box-shadow var(--dur) var(--ease-out),border-color var(--dur) var(--ease-out),transform var(--dur-fast) var(--ease-out);
}
.eds-card--sunken{background:var(--surface-sunken);box-shadow:none;}
.eds-card--flat{box-shadow:none;}
.eds-card--pad-sm{padding:12px;}
.eds-card--pad-md{padding:16px;}
.eds-card--pad-lg{padding:24px;}
.eds-card--interactive{cursor:pointer;}
.eds-card--interactive:hover{box-shadow:var(--shadow-md);border-color:var(--border-strong);transform:translateY(-1px);}
.eds-card--interactive:active{transform:translateY(0);box-shadow:var(--shadow-sm);}
.eds-card--selected{border-color:var(--accent);box-shadow:var(--ring-select);}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'card');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Card — a neutral surface container with a soft border and gentle shadow. */
export function Card({
  children,
  pad = 'md',
  variant = 'default',
  interactive = false,
  selected = false,
  className = '',
  ...rest
}) {
  useStyles();
  const cls = [
    'eds-card',
    variant !== 'default' ? `eds-card--${variant}` : '',
    pad ? `eds-card--pad-${pad}` : '',
    interactive ? 'eds-card--interactive' : '',
    selected ? 'eds-card--selected' : '',
    className,
  ].filter(Boolean).join(' ');
  return <div className={cls} {...rest}>{children}</div>;
}
