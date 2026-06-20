import React from 'react';

const CSS = `
.eds-field{display:flex;flex-direction:column;gap:6px;}
.eds-field__label{font-size:var(--fs-caption);font-weight:var(--fw-medium);color:var(--text-body);}
.eds-field__hint{font-size:var(--fs-caption);color:var(--text-muted);}
.eds-input-wrap{position:relative;display:flex;align-items:center;}
.eds-input-wrap__lead,.eds-input-wrap__trail{position:absolute;display:flex;align-items:center;color:var(--text-faint);pointer-events:none;font-size:16px;}
.eds-input-wrap__lead{left:11px;}
.eds-input-wrap__trail{right:11px;}
.eds-input-wrap__lead svg,.eds-input-wrap__trail svg{width:1em;height:1em;display:block;}
.eds-input{
  width:100%;height:var(--control-h);
  font-family:var(--font-sans);font-size:var(--fs-base);color:var(--text-ink);
  background:var(--surface);border:var(--border-w) solid var(--border);
  border-radius:var(--radius-md);padding:0 12px;
  transition:border-color var(--dur) var(--ease-out),box-shadow var(--dur) var(--ease-out),background var(--dur) var(--ease-out);
}
.eds-input::placeholder{color:var(--text-faint);}
.eds-input:hover{border-color:var(--border-strong);}
.eds-input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);}
.eds-input:disabled{background:var(--surface-sunken);color:var(--text-faint);cursor:not-allowed;}
.eds-input--has-lead{padding-left:34px;}
.eds-input--has-trail{padding-right:34px;}
.eds-input--sm{height:var(--control-h-sm);font-size:var(--fs-sm);}
.eds-input--invalid{border-color:var(--danger);}
.eds-input--invalid:focus{box-shadow:0 0 0 3px var(--danger-soft);}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'input');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Input — labeled single-line text field used throughout the Inspector. */
export function Input({
  label,
  hint,
  lead = null,
  trail = null,
  size = 'md',
  invalid = false,
  id,
  className = '',
  ...rest
}) {
  useStyles();
  const inputId = id || (label ? `eds-input-${Math.random().toString(36).slice(2, 8)}` : undefined);
  const cls = [
    'eds-input',
    size === 'sm' ? 'eds-input--sm' : '',
    lead ? 'eds-input--has-lead' : '',
    trail ? 'eds-input--has-trail' : '',
    invalid ? 'eds-input--invalid' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <div className="eds-field">
      {label && <label className="eds-field__label" htmlFor={inputId}>{label}</label>}
      <div className="eds-input-wrap">
        {lead && <span className="eds-input-wrap__lead">{lead}</span>}
        <input id={inputId} className={cls} aria-invalid={invalid || undefined} {...rest} />
        {trail && <span className="eds-input-wrap__trail">{trail}</span>}
      </div>
      {hint && <span className="eds-field__hint">{hint}</span>}
    </div>
  );
}
