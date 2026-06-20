import React from 'react';

const CSS = `
.eds-panel{border-bottom:var(--border-w) solid var(--border-faint);}
.eds-panel:last-child{border-bottom:none;}
.eds-panel__head{
  display:flex;align-items:center;gap:8px;width:100%;
  padding:14px 16px;border:none;background:transparent;cursor:pointer;text-align:left;
  font-family:var(--font-sans);
}
.eds-panel__head:hover .eds-panel__title{color:var(--text-ink);}
.eds-panel__head:focus-visible{outline:none;box-shadow:var(--ring-focus);border-radius:var(--radius-sm);}
.eds-panel__chev{flex:none;color:var(--text-faint);display:flex;transition:transform var(--dur) var(--ease-out);}
.eds-panel__chev svg{width:15px;height:15px;display:block;}
.eds-panel--open .eds-panel__chev{transform:rotate(90deg);}
.eds-panel__title{flex:1;font-size:var(--fs-micro);font-weight:var(--fw-semibold);
  letter-spacing:var(--ls-caps);text-transform:uppercase;color:var(--text-muted);transition:color var(--dur) var(--ease-out);}
.eds-panel__action{flex:none;display:flex;color:var(--text-faint);}
.eds-panel__body{padding:0 16px 16px;}
.eds-panel--static .eds-panel__head{cursor:default;}

/* non-collapsible plain header (title + optional action), no chevron */
.eds-panel-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:16px 16px 10px;}
.eds-panel-header__title{font-size:var(--fs-lg);font-weight:var(--fw-bold);color:var(--text-ink);letter-spacing:var(--ls-tight);}
.eds-panel-header__sub{font-size:var(--fs-caption);color:var(--text-muted);margin-top:2px;}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'panelheader');
  el.textContent = CSS;
  document.head.appendChild(el);
}

const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
);

/**
 * PanelSection — a collapsible right-rail section with an ALL-CAPS micro-label header.
 * Controlled (pass `open` + `onToggle`) or uncontrolled (`defaultOpen`).
 */
export function PanelSection({
  title,
  action = null,
  children,
  open: openProp,
  defaultOpen = true,
  onToggle,
  collapsible = true,
  className = '',
}) {
  useStyles();
  const [openState, setOpenState] = React.useState(defaultOpen);
  const open = openProp != null ? openProp : openState;
  const toggle = () => {
    if (!collapsible) return;
    if (onToggle) onToggle(!open);
    if (openProp == null) setOpenState(!open);
  };
  const cls = ['eds-panel', open ? 'eds-panel--open' : '', collapsible ? '' : 'eds-panel--static', className].filter(Boolean).join(' ');
  return (
    <section className={cls}>
      <button type="button" className="eds-panel__head" onClick={toggle} aria-expanded={open}>
        {collapsible && <span className="eds-panel__chev"><Chevron /></span>}
        <span className="eds-panel__title">{title}</span>
        {action && <span className="eds-panel__action" onClick={(e) => e.stopPropagation()}>{action}</span>}
      </button>
      {open && <div className="eds-panel__body">{children}</div>}
    </section>
  );
}

/** PanelHeader — a non-collapsible panel title block (e.g. "Properties / No selection"). */
export function PanelHeader({ title, subtitle, action = null, className = '' }) {
  useStyles();
  return (
    <div className={['eds-panel-header', className].filter(Boolean).join(' ')}>
      <div>
        <div className="eds-panel-header__title">{title}</div>
        {subtitle && <div className="eds-panel-header__sub">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
