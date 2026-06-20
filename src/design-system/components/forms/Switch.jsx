import React from 'react';

const CSS = `
.eds-switch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;user-select:none;font-size:var(--fs-base);color:var(--text-body);}
.eds-switch--disabled{cursor:not-allowed;opacity:.5;}
.eds-switch__track{
  position:relative;flex:none;width:38px;height:22px;border-radius:var(--radius-pill);
  background:var(--slate-300);transition:background var(--dur) var(--ease-out);
}
.eds-switch input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:inherit;}
.eds-switch__thumb{
  position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;
  background:var(--surface);box-shadow:var(--shadow-sm);
  transition:transform var(--dur) var(--ease-out);
}
.eds-switch input:checked ~ .eds-switch__track{background:var(--accent);}
.eds-switch input:checked ~ .eds-switch__track .eds-switch__thumb{transform:translateX(16px);}
.eds-switch input:focus-visible ~ .eds-switch__track{box-shadow:var(--ring-focus);}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'switch');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Switch — an on/off toggle for binary settings (e.g. clip content, live preview). */
export function Switch({ label, disabled = false, className = '', ...rest }) {
  useStyles();
  const cls = ['eds-switch', disabled ? 'eds-switch--disabled' : '', className].filter(Boolean).join(' ');
  return (
    <label className={cls}>
      <input type="checkbox" role="switch" disabled={disabled} {...rest} />
      <span className="eds-switch__track"><span className="eds-switch__thumb" /></span>
      {label && <span>{label}</span>}
    </label>
  );
}
