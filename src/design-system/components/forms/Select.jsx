import React from 'react';

const CSS = `
.eds-select-wrap{position:relative;display:flex;align-items:center;}
.eds-select{
  width:100%;height:var(--control-h);appearance:none;-webkit-appearance:none;
  font-family:var(--font-sans);font-size:var(--fs-base);color:var(--text-ink);
  background:var(--surface);border:var(--border-w) solid var(--border);
  border-radius:var(--radius-md);padding:0 32px 0 12px;cursor:pointer;
  transition:border-color var(--dur) var(--ease-out),box-shadow var(--dur) var(--ease-out);
}
.eds-select:hover{border-color:var(--border-strong);}
.eds-select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);}
.eds-select:disabled{background:var(--surface-sunken);color:var(--text-faint);cursor:not-allowed;}
.eds-select--sm{height:var(--control-h-sm);font-size:var(--fs-sm);}
.eds-select-wrap__chev{position:absolute;right:11px;color:var(--text-faint);pointer-events:none;display:flex;}
.eds-select-wrap__chev svg{width:16px;height:16px;display:block;}
.eds-select__label{display:block;font-size:var(--fs-caption);font-weight:var(--fw-medium);color:var(--text-body);margin-bottom:6px;}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'select');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Select — native dropdown styled to match the chrome (Inspector variant/rounding). */
export function Select({ label, options = [], size = 'md', id, className = '', children, ...rest }) {
  useStyles();
  const selId = id || (label ? `eds-select-${Math.random().toString(36).slice(2, 8)}` : undefined);
  const cls = ['eds-select', size === 'sm' ? 'eds-select--sm' : '', className].filter(Boolean).join(' ');
  return (
    <div>
      {label && <label className="eds-select__label" htmlFor={selId}>{label}</label>}
      <div className="eds-select-wrap">
        <select id={selId} className={cls} {...rest}>
          {children || options.map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
        <span className="eds-select-wrap__chev">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </div>
    </div>
  );
}
