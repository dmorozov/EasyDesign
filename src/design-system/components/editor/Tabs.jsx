import React from 'react';

const CSS = `
.eds-tabs{display:flex;align-items:stretch;gap:2px;border-bottom:var(--border-w) solid var(--border);}
.eds-tab{
  position:relative;display:inline-flex;align-items:center;gap:7px;
  padding:10px 4px;margin:0 10px -1px 0;border:none;background:transparent;
  font-family:var(--font-sans);font-size:var(--fs-base);font-weight:var(--fw-medium);
  color:var(--text-muted);cursor:pointer;
  transition:color var(--dur) var(--ease-out);
}
.eds-tab:first-child{margin-left:2px;}
.eds-tab:hover{color:var(--text-body);}
.eds-tab[aria-selected="true"]{color:var(--accent-press);font-weight:var(--fw-semibold);}
.eds-tab__underline{position:absolute;left:0;right:0;bottom:-1px;height:2px;border-radius:2px;background:var(--accent);
  transform:scaleX(0);transition:transform var(--dur) var(--ease-out);}
.eds-tab[aria-selected="true"] .eds-tab__underline{transform:scaleX(1);}
.eds-tab:focus-visible{outline:none;box-shadow:var(--ring-focus);border-radius:var(--radius-xs);}
.eds-tab__count{font-size:var(--fs-micro);font-weight:var(--fw-semibold);color:var(--text-faint);
  background:var(--surface-sunken);border-radius:var(--radius-pill);padding:1px 6px;}

.eds-tabs--pill{border:none;gap:4px;background:var(--surface-sunken);padding:3px;border-radius:var(--radius-md);}
.eds-tabs--pill .eds-tab{margin:0;padding:6px 14px;border-radius:var(--radius-sm);font-size:var(--fs-sm);}
.eds-tabs--pill .eds-tab[aria-selected="true"]{background:var(--surface);box-shadow:var(--shadow-xs);}
.eds-tabs--pill .eds-tab__underline{display:none;}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'tabs');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Tabs — horizontal view switcher (right-rail Inspector/Design/Export, palette groups, export targets). */
export function Tabs({ tabs = [], value, onChange, variant = 'underline', className = '' }) {
  useStyles();
  const cls = ['eds-tabs', variant === 'pill' ? 'eds-tabs--pill' : '', className].filter(Boolean).join(' ');
  return (
    <div className={cls} role="tablist">
      {tabs.map((t) => {
        const tab = typeof t === 'string' ? { value: t, label: t } : t;
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            className="eds-tab"
            onClick={() => onChange && onChange(tab.value)}
          >
            {tab.icon}
            {tab.label}
            {tab.count != null && <span className="eds-tab__count">{tab.count}</span>}
            <span className="eds-tab__underline" />
          </button>
        );
      })}
    </div>
  );
}
