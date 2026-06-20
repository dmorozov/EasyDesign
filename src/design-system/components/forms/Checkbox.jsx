import React from 'react';

const CSS = `
.eds-check{display:inline-flex;align-items:flex-start;gap:9px;cursor:pointer;font-size:var(--fs-base);color:var(--text-body);user-select:none;}
.eds-check--disabled{cursor:not-allowed;opacity:.5;}
.eds-check__box{
  position:relative;flex:none;width:18px;height:18px;margin-top:1px;
  border:var(--border-w-2) solid var(--border-strong);border-radius:5px;background:var(--surface);
  transition:background var(--dur) var(--ease-out),border-color var(--dur) var(--ease-out),box-shadow var(--dur) var(--ease-out);
}
.eds-check input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:inherit;}
.eds-check__box svg{position:absolute;inset:0;width:100%;height:100%;color:var(--on-accent);
  stroke-dasharray:24;stroke-dashoffset:24;transition:stroke-dashoffset var(--dur) var(--ease-out);}
.eds-check input:checked ~ .eds-check__box{background:var(--accent);border-color:var(--accent);}
.eds-check input:checked ~ .eds-check__box svg{stroke-dashoffset:0;}
.eds-check input:focus-visible ~ .eds-check__box{box-shadow:var(--ring-focus);}
.eds-check:hover input:not(:checked):not(:disabled) ~ .eds-check__box{border-color:var(--accent);}
.eds-check__txt{line-height:1.3;}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'checkbox');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Checkbox — square multi-select control with an animated check. */
export function Checkbox({ label, disabled = false, className = '', ...rest }) {
  useStyles();
  const cls = ['eds-check', disabled ? 'eds-check--disabled' : '', className].filter(Boolean).join(' ');
  return (
    <label className={cls}>
      <input type="checkbox" disabled={disabled} {...rest} />
      <span className="eds-check__box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L19 7"/></svg>
      </span>
      {label && <span className="eds-check__txt">{label}</span>}
    </label>
  );
}
