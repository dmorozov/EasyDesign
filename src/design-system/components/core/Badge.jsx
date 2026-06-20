import React from 'react';

const CSS = `
.eds-badge{
  display:inline-flex;align-items:center;gap:5px;
  font-family:var(--font-sans);font-weight:var(--fw-semibold);
  font-size:var(--fs-micro);line-height:1;letter-spacing:.01em;
  padding:4px 8px;border-radius:var(--radius-pill);
  border:var(--border-w) solid transparent;white-space:nowrap;
}
.eds-badge__dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex:none;}
.eds-badge--neutral{background:var(--slate-100);color:var(--slate-600);}
.eds-badge--accent{background:var(--accent-soft);color:var(--accent-press);}
.eds-badge--success{background:var(--success-soft);color:var(--success);}
.eds-badge--warning{background:var(--warning-soft);color:var(--warning);}
.eds-badge--danger{background:var(--danger-soft);color:var(--danger);}
.eds-badge--outline{background:var(--surface);color:var(--text-muted);border-color:var(--border);}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'badge');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Badge — a small status pill (save state, mode, counts, "Pro" markers). */
export function Badge({ children, tone = 'neutral', dot = false, className = '', ...rest }) {
  useStyles();
  const cls = ['eds-badge', `eds-badge--${tone}`, className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {dot && <span className="eds-badge__dot" />}
      {children}
    </span>
  );
}
