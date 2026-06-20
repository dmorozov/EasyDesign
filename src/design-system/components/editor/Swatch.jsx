import React from 'react';

const CSS = `
.eds-swatch{
  display:flex;align-items:center;gap:11px;width:100%;
  padding:8px 10px;border:var(--border-w) solid transparent;border-radius:var(--radius-md);
  background:transparent;cursor:pointer;text-align:left;font-family:var(--font-sans);
  transition:background var(--dur) var(--ease-out),border-color var(--dur) var(--ease-out);
}
.eds-swatch:hover{background:var(--surface-hover);}
.eds-swatch:focus-visible{outline:none;box-shadow:var(--ring-focus);}
.eds-swatch--selected{border-color:var(--accent);background:var(--accent-soft);}
.eds-swatch__chip{
  position:relative;flex:none;width:26px;height:26px;border-radius:var(--radius-sm);
  box-shadow:inset 0 0 0 1px rgba(22,27,39,.12);overflow:hidden;
}
.eds-swatch__chip input{position:absolute;inset:0;opacity:0;width:100%;height:100%;border:none;padding:0;cursor:pointer;}
.eds-swatch__txt{flex:1;min-width:0;}
.eds-swatch__name{font-size:var(--fs-sm);font-weight:var(--fw-medium);color:var(--text-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.eds-swatch__val{font-family:var(--font-mono);font-size:var(--fs-caption);color:var(--text-muted);text-transform:uppercase;}
.eds-swatch__role{font-size:var(--fs-micro);font-weight:var(--fw-semibold);letter-spacing:var(--ls-caps);text-transform:uppercase;color:var(--text-faint);}

/* compact square grid swatch (palette) */
.eds-swatch-chip{
  position:relative;width:32px;height:32px;border-radius:var(--radius-sm);cursor:pointer;
  box-shadow:inset 0 0 0 1px rgba(22,27,39,.12);
  transition:transform var(--dur-fast) var(--ease-out),box-shadow var(--dur) var(--ease-out);
}
.eds-swatch-chip:hover{transform:translateY(-1px);box-shadow:inset 0 0 0 1px rgba(22,27,39,.12),var(--shadow-md);}
.eds-swatch-chip--selected{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--accent);}
.eds-swatch-chip input{position:absolute;inset:0;opacity:0;width:100%;height:100%;border:none;padding:0;cursor:pointer;}
`;

let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'swatch');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/**
 * Swatch — a Design-Palette color row: a live color chip (opens the native picker),
 * the swatch role name, and its hex value. Editing re-themes the board.
 */
export function Swatch({ name, value = '#5b5bd6', onChange, selected = false, showValue = true, className = '', ...rest }) {
  useStyles();
  const cls = ['eds-swatch', selected ? 'eds-swatch--selected' : '', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      <span className="eds-swatch__chip" style={{ background: value }}>
        <input type="color" value={value} onChange={(e) => onChange && onChange(e.target.value)} aria-label={`${name} color`} onClick={(e) => e.stopPropagation()} />
      </span>
      <span className="eds-swatch__txt">
        <span className="eds-swatch__name">{name}</span>
      </span>
      {showValue && <span className="eds-swatch__val">{value}</span>}
    </button>
  );
}

/** SwatchChip — compact square color chip for tight palette grids. */
export function SwatchChip({ value = '#5b5bd6', onChange, selected = false, title, className = '' }) {
  useStyles();
  const cls = ['eds-swatch-chip', selected ? 'eds-swatch-chip--selected' : '', className].filter(Boolean).join(' ');
  return (
    <span className={cls} style={{ background: value }} title={title}>
      <input type="color" value={value} onChange={(e) => onChange && onChange(e.target.value)} aria-label={title || 'color'} />
    </span>
  );
}
