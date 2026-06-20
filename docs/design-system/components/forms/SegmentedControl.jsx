import React from 'react';

const CSS = `
.eds-seg{display:inline-flex;align-items:center;gap:2px;padding:3px;background:var(--surface-sunken);
  border:var(--border-w) solid var(--border);border-radius:var(--radius-md);}
.eds-seg__btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  height:26px;padding:0 12px;border:none;background:transparent;border-radius:var(--radius-sm);
  font-family:var(--font-sans);font-size:var(--fs-sm);font-weight:var(--fw-medium);
  color:var(--text-muted);cursor:pointer;white-space:nowrap;
  transition:background var(--dur) var(--ease-out),color var(--dur) var(--ease-out),box-shadow var(--dur) var(--ease-out);
}
.eds-seg__btn svg{width:15px;height:15px;display:block;}
.eds-seg__btn:hover{color:var(--text-body);}
.eds-seg__btn[aria-pressed="true"]{background:var(--surface);color:var(--accent-press);box-shadow:var(--shadow-xs);}
.eds-seg__btn:focus-visible{outline:none;box-shadow:var(--ring-focus);}
.eds-seg__btn:disabled{opacity:.4;cursor:not-allowed;}
.eds-seg--icon .eds-seg__btn{width:32px;padding:0;}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'segmented');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** SegmentedControl — a compact pill of mutually-exclusive options (Web↔Email, alignment). */
export function SegmentedControl({ options = [], value, onChange, iconOnly = false, className = '' }) {
  useStyles();
  const cls = ['eds-seg', iconOnly ? 'eds-seg--icon' : '', className].filter(Boolean).join(' ');
  return (
    <div className={cls} role="group">
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            className="eds-seg__btn"
            aria-pressed={active}
            aria-label={opt.ariaLabel || (typeof opt.label === 'string' ? opt.label : opt.value)}
            disabled={opt.disabled}
            onClick={() => onChange && onChange(opt.value)}
          >
            {opt.icon}
            {!iconOnly && opt.label}
          </button>
        );
      })}
    </div>
  );
}
