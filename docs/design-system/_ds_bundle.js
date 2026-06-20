/* @ds-bundle: {"format":3,"namespace":"EasyDesignDesignSystem_95eb6c","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"PaletteItem","sourcePath":"components/editor/PaletteItem.jsx"},{"name":"PanelSection","sourcePath":"components/editor/PanelSection.jsx"},{"name":"PanelHeader","sourcePath":"components/editor/PanelSection.jsx"},{"name":"Swatch","sourcePath":"components/editor/Swatch.jsx"},{"name":"SwatchChip","sourcePath":"components/editor/Swatch.jsx"},{"name":"Tabs","sourcePath":"components/editor/Tabs.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"5d755e317eb9","components/core/Button.jsx":"636cfb5d0b0b","components/core/Card.jsx":"a42bb287ea7a","components/core/IconButton.jsx":"85e7ae444d4b","components/editor/PaletteItem.jsx":"20defd12263c","components/editor/PanelSection.jsx":"63c8efdb4828","components/editor/Swatch.jsx":"ac232aea4585","components/editor/Tabs.jsx":"ef13d159d760","components/forms/Checkbox.jsx":"7d11980e4e7c","components/forms/Input.jsx":"75c6c4c97e78","components/forms/SegmentedControl.jsx":"60e48a0892ba","components/forms/Select.jsx":"47f8f405c465","components/forms/Switch.jsx":"9eb97422c3d0","ui_kits/easydesign-editor/App.jsx":"d5a8599dfb58","ui_kits/easydesign-editor/Board.jsx":"56a264c3a264","ui_kits/easydesign-editor/Palette.jsx":"685a2e351910","ui_kits/easydesign-editor/RightRail.jsx":"a7fd5257c0ed","ui_kits/easydesign-editor/Toolbar.jsx":"d95664a7b801","ui_kits/easydesign-editor/codegen.jsx":"c05ad9e69b6c","ui_kits/easydesign-editor/data.jsx":"cda2ca9ddfed","ui_kits/easydesign-editor/icons.jsx":"c9ce0db50664"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.EasyDesignDesignSystem_95eb6c = window.EasyDesignDesignSystem_95eb6c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className = '',
  ...rest
}) {
  useStyles();
  const cls = ['eds-badge', `eds-badge--${tone}`, className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "eds-badge__dot"
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Inject component styles once. Self-contained; relies only on DS custom properties. */
const CSS = `
.eds-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  font-family:var(--font-sans);font-weight:var(--fw-semibold);
  border:var(--border-w) solid transparent;border-radius:var(--radius-md);
  cursor:pointer;white-space:nowrap;user-select:none;
  transition:background var(--dur) var(--ease-out),border-color var(--dur) var(--ease-out),
             box-shadow var(--dur) var(--ease-out),transform var(--dur-fast) var(--ease-out),color var(--dur) var(--ease-out);
}
.eds-btn:focus-visible{outline:none;box-shadow:var(--ring-focus);}
.eds-btn:disabled{opacity:.5;cursor:not-allowed;pointer-events:none;}
.eds-btn--sm{height:var(--control-h-sm);padding:0 12px;font-size:var(--fs-sm);}
.eds-btn--md{height:var(--control-h);padding:0 16px;font-size:var(--fs-base);}
.eds-btn--lg{height:var(--control-h-lg);padding:0 22px;font-size:var(--fs-md);}
.eds-btn--block{width:100%;}

.eds-btn--primary{background:var(--accent);color:var(--on-accent);box-shadow:var(--shadow-xs);}
.eds-btn--primary:hover{background:var(--accent-hover);box-shadow:var(--shadow-sm);}
.eds-btn--primary:active{background:var(--accent-press);transform:translateY(.5px);box-shadow:none;}

.eds-btn--secondary{background:var(--surface);color:var(--text-body);border-color:var(--border);box-shadow:var(--shadow-xs);}
.eds-btn--secondary:hover{background:var(--surface-hover);border-color:var(--border-strong);}
.eds-btn--secondary:active{background:var(--slate-150);transform:translateY(.5px);}

.eds-btn--ghost{background:transparent;color:var(--text-body);}
.eds-btn--ghost:hover{background:var(--surface-hover);}
.eds-btn--ghost:active{background:var(--slate-150);}

.eds-btn--soft{background:var(--accent-soft);color:var(--accent-press);}
.eds-btn--soft:hover{background:var(--accent-soft-2);}
.eds-btn--soft:active{transform:translateY(.5px);}

.eds-btn--danger{background:transparent;color:var(--danger);}
.eds-btn--danger:hover{background:var(--danger-soft);color:var(--danger-hover);}

.eds-btn__icon{display:inline-flex;align-items:center;justify-content:center;}
.eds-btn__icon svg{display:block;width:1em;height:1em;}
`;
let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'button');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/**
 * Button — the primary clickable action in EasyDesign chrome.
 * One accent-filled primary per region; everything else secondary / ghost / soft.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  icon = null,
  iconRight = null,
  type = 'button',
  className = '',
  ...rest
}) {
  useStyles();
  const cls = ['eds-btn', `eds-btn--${variant}`, `eds-btn--${size}`, block ? 'eds-btn--block' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: cls
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    className: "eds-btn__icon"
  }, icon), children && /*#__PURE__*/React.createElement("span", null, children), iconRight && /*#__PURE__*/React.createElement("span", {
    className: "eds-btn__icon"
  }, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Card({
  children,
  pad = 'md',
  variant = 'default',
  interactive = false,
  selected = false,
  className = '',
  ...rest
}) {
  useStyles();
  const cls = ['eds-card', variant !== 'default' ? `eds-card--${variant}` : '', pad ? `eds-card--pad-${pad}` : '', interactive ? 'eds-card--interactive' : '', selected ? 'eds-card--selected' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.eds-iconbtn{
  display:inline-flex;align-items:center;justify-content:center;
  border:var(--border-w) solid transparent;border-radius:var(--radius-md);
  color:var(--icon);background:transparent;cursor:pointer;padding:0;
  transition:background var(--dur) var(--ease-out),color var(--dur) var(--ease-out),
             border-color var(--dur) var(--ease-out),box-shadow var(--dur) var(--ease-out);
}
.eds-iconbtn svg{display:block;width:1em;height:1em;}
.eds-iconbtn:hover{background:var(--surface-hover);color:var(--icon-strong);}
.eds-iconbtn:active{background:var(--slate-150);}
.eds-iconbtn:focus-visible{outline:none;box-shadow:var(--ring-focus);}
.eds-iconbtn:disabled{opacity:.45;cursor:not-allowed;pointer-events:none;}
.eds-iconbtn--sm{width:28px;height:28px;font-size:16px;}
.eds-iconbtn--md{width:34px;height:34px;font-size:18px;}
.eds-iconbtn--lg{width:40px;height:40px;font-size:20px;}
.eds-iconbtn--bordered{border-color:var(--border);background:var(--surface);box-shadow:var(--shadow-xs);}
.eds-iconbtn--bordered:hover{border-color:var(--border-strong);}
.eds-iconbtn--active{background:var(--accent-soft);color:var(--accent-press);}
.eds-iconbtn--active:hover{background:var(--accent-soft-2);color:var(--accent-press);}
`;
let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'iconbutton');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** IconButton — a square, label-less control for toolbar actions (undo, zoom, settings). */
function IconButton({
  children,
  size = 'md',
  bordered = false,
  active = false,
  className = '',
  'aria-label': ariaLabel,
  ...rest
}) {
  useStyles();
  const cls = ['eds-iconbtn', `eds-iconbtn--${size}`, bordered ? 'eds-iconbtn--bordered' : '', active ? 'eds-iconbtn--active' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    "aria-label": ariaLabel,
    "aria-pressed": active || undefined
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/editor/PaletteItem.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.eds-pal{
  position:relative;display:flex;align-items:center;gap:11px;width:100%;
  border:var(--border-w) solid var(--border);border-radius:var(--radius-lg);
  background:var(--surface);color:var(--text-body);cursor:grab;text-align:left;
  font-family:var(--font-sans);
  transition:border-color var(--dur) var(--ease-out),box-shadow var(--dur) var(--ease-out),
             transform var(--dur-fast) var(--ease-out),background var(--dur) var(--ease-out);
}
.eds-pal:active{cursor:grabbing;}
.eds-pal__icon{flex:none;display:flex;align-items:center;justify-content:center;color:var(--icon-strong);}
.eds-pal__icon svg{width:20px;height:20px;display:block;}
.eds-pal__label{font-size:var(--fs-base);font-weight:var(--fw-medium);color:var(--text-ink);}
.eds-pal__grip{margin-left:auto;display:flex;color:var(--text-faint);opacity:0;transition:opacity var(--dur) var(--ease-out);}
.eds-pal__grip svg{width:16px;height:16px;display:block;}

.eds-pal:hover{border-color:var(--accent);box-shadow:var(--shadow-lift);transform:translateY(-1px);}
.eds-pal:hover .eds-pal__grip{opacity:1;}
.eds-pal:hover .eds-pal__icon{color:var(--accent-press);}
.eds-pal:focus-visible{outline:none;box-shadow:var(--ring-focus);}

/* row layout (Heading, Text, Button rows) */
.eds-pal--row{padding:12px 14px;}
/* card layout (Stack, Row, Column, Grid tiles) */
.eds-pal--card{flex-direction:column;gap:8px;justify-content:center;padding:16px 12px;text-align:center;min-height:76px;}
.eds-pal--card .eds-pal__icon svg{width:22px;height:22px;}
.eds-pal--card .eds-pal__label{font-size:var(--fs-sm);}
.eds-pal--card .eds-pal__grip{position:absolute;top:8px;right:8px;margin:0;}

/* dragging ghost */
.eds-pal--dragging{opacity:.55;border-style:dashed;box-shadow:none;transform:none;cursor:grabbing;}

/* disabled / not available in current medium */
.eds-pal--disabled{cursor:not-allowed;background:var(--surface-sunken);border-style:dashed;border-color:var(--border);}
.eds-pal--disabled .eds-pal__icon,.eds-pal--disabled .eds-pal__label{color:var(--text-faint);}
.eds-pal--disabled:hover{transform:none;box-shadow:none;border-color:var(--border);}
.eds-pal__lock{margin-left:auto;display:flex;color:var(--text-faint);}
.eds-pal__lock svg{width:14px;height:14px;}
.eds-pal--card .eds-pal__lock{position:absolute;top:8px;right:8px;margin:0;}
.eds-pal__note{font-size:var(--fs-micro);color:var(--text-faint);font-weight:var(--fw-medium);}
`;
let injected = false;
function useStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-eds', 'paletteitem');
  el.textContent = CSS;
  document.head.appendChild(el);
}
const Grip = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "currentColor"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "9",
  cy: "6",
  r: "1.6"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "15",
  cy: "6",
  r: "1.6"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "9",
  cy: "12",
  r: "1.6"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "15",
  cy: "12",
  r: "1.6"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "9",
  cy: "18",
  r: "1.6"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "15",
  cy: "18",
  r: "1.6"
}));
const Lock = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("rect", {
  x: "5",
  y: "11",
  width: "14",
  height: "9",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M8 11V8a4 4 0 0 1 8 0v3"
}));

/**
 * PaletteItem — a draggable component tile/row in the left Component Palette.
 * Drag onto the board to add. Greyed when not available in the current frame medium.
 */
function PaletteItem({
  icon,
  label,
  layout = 'row',
  dragging = false,
  disabled = false,
  disabledNote,
  draggable = true,
  className = '',
  ...rest
}) {
  useStyles();
  const cls = ['eds-pal', `eds-pal--${layout}`, dragging ? 'eds-pal--dragging' : '', disabled ? 'eds-pal--disabled' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    draggable: draggable && !disabled,
    "aria-disabled": disabled || undefined,
    title: disabled && disabledNote ? disabledNote : undefined
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "eds-pal__icon"
  }, icon), /*#__PURE__*/React.createElement("span", {
    className: "eds-pal__label"
  }, label), disabled ? /*#__PURE__*/React.createElement("span", {
    className: "eds-pal__lock"
  }, /*#__PURE__*/React.createElement(Lock, null)) : /*#__PURE__*/React.createElement("span", {
    className: "eds-pal__grip"
  }, /*#__PURE__*/React.createElement(Grip, null)));
}
Object.assign(__ds_scope, { PaletteItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editor/PaletteItem.jsx", error: String((e && e.message) || e) }); }

// components/editor/PanelSection.jsx
try { (() => {
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
const Chevron = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m9 6 6 6-6 6"
}));

/**
 * PanelSection — a collapsible right-rail section with an ALL-CAPS micro-label header.
 * Controlled (pass `open` + `onToggle`) or uncontrolled (`defaultOpen`).
 */
function PanelSection({
  title,
  action = null,
  children,
  open: openProp,
  defaultOpen = true,
  onToggle,
  collapsible = true,
  className = ''
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
  return /*#__PURE__*/React.createElement("section", {
    className: cls
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "eds-panel__head",
    onClick: toggle,
    "aria-expanded": open
  }, collapsible && /*#__PURE__*/React.createElement("span", {
    className: "eds-panel__chev"
  }, /*#__PURE__*/React.createElement(Chevron, null)), /*#__PURE__*/React.createElement("span", {
    className: "eds-panel__title"
  }, title), action && /*#__PURE__*/React.createElement("span", {
    className: "eds-panel__action",
    onClick: e => e.stopPropagation()
  }, action)), open && /*#__PURE__*/React.createElement("div", {
    className: "eds-panel__body"
  }, children));
}

/** PanelHeader — a non-collapsible panel title block (e.g. "Properties / No selection"). */
function PanelHeader({
  title,
  subtitle,
  action = null,
  className = ''
}) {
  useStyles();
  return /*#__PURE__*/React.createElement("div", {
    className: ['eds-panel-header', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eds-panel-header__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    className: "eds-panel-header__sub"
  }, subtitle)), action);
}
Object.assign(__ds_scope, { PanelSection, PanelHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editor/PanelSection.jsx", error: String((e && e.message) || e) }); }

// components/editor/Swatch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Swatch({
  name,
  value = '#5b5bd6',
  onChange,
  selected = false,
  showValue = true,
  className = '',
  ...rest
}) {
  useStyles();
  const cls = ['eds-swatch', selected ? 'eds-swatch--selected' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "eds-swatch__chip",
    style: {
      background: value
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: value,
    onChange: e => onChange && onChange(e.target.value),
    "aria-label": `${name} color`,
    onClick: e => e.stopPropagation()
  })), /*#__PURE__*/React.createElement("span", {
    className: "eds-swatch__txt"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eds-swatch__name"
  }, name)), showValue && /*#__PURE__*/React.createElement("span", {
    className: "eds-swatch__val"
  }, value));
}

/** SwatchChip — compact square color chip for tight palette grids. */
function SwatchChip({
  value = '#5b5bd6',
  onChange,
  selected = false,
  title,
  className = ''
}) {
  useStyles();
  const cls = ['eds-swatch-chip', selected ? 'eds-swatch-chip--selected' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", {
    className: cls,
    style: {
      background: value
    },
    title: title
  }, /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: value,
    onChange: e => onChange && onChange(e.target.value),
    "aria-label": title || 'color'
  }));
}
Object.assign(__ds_scope, { Swatch, SwatchChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editor/Swatch.jsx", error: String((e && e.message) || e) }); }

// components/editor/Tabs.jsx
try { (() => {
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
function Tabs({
  tabs = [],
  value,
  onChange,
  variant = 'underline',
  className = ''
}) {
  useStyles();
  const cls = ['eds-tabs', variant === 'pill' ? 'eds-tabs--pill' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", {
    className: cls,
    role: "tablist"
  }, tabs.map(t => {
    const tab = typeof t === 'string' ? {
      value: t,
      label: t
    } : t;
    const active = tab.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: tab.value,
      type: "button",
      role: "tab",
      "aria-selected": active,
      className: "eds-tab",
      onClick: () => onChange && onChange(tab.value)
    }, tab.icon, tab.label, tab.count != null && /*#__PURE__*/React.createElement("span", {
      className: "eds-tab__count"
    }, tab.count), /*#__PURE__*/React.createElement("span", {
      className: "eds-tab__underline"
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editor/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Checkbox({
  label,
  disabled = false,
  className = '',
  ...rest
}) {
  useStyles();
  const cls = ['eds-check', disabled ? 'eds-check--disabled' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("label", {
    className: cls
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "eds-check__box"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m5 12 5 5L19 7"
  }))), label && /*#__PURE__*/React.createElement("span", {
    className: "eds-check__txt"
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Input({
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
  const cls = ['eds-input', size === 'sm' ? 'eds-input--sm' : '', lead ? 'eds-input--has-lead' : '', trail ? 'eds-input--has-trail' : '', invalid ? 'eds-input--invalid' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", {
    className: "eds-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "eds-field__label",
    htmlFor: inputId
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "eds-input-wrap"
  }, lead && /*#__PURE__*/React.createElement("span", {
    className: "eds-input-wrap__lead"
  }, lead), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    className: cls,
    "aria-invalid": invalid || undefined
  }, rest)), trail && /*#__PURE__*/React.createElement("span", {
    className: "eds-input-wrap__trail"
  }, trail)), hint && /*#__PURE__*/React.createElement("span", {
    className: "eds-field__hint"
  }, hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
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
function SegmentedControl({
  options = [],
  value,
  onChange,
  iconOnly = false,
  className = ''
}) {
  useStyles();
  const cls = ['eds-seg', iconOnly ? 'eds-seg--icon' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", {
    className: cls,
    role: "group"
  }, options.map(o => {
    const opt = typeof o === 'string' ? {
      value: o,
      label: o
    } : o;
    const active = opt.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: opt.value,
      type: "button",
      className: "eds-seg__btn",
      "aria-pressed": active,
      "aria-label": opt.ariaLabel || (typeof opt.label === 'string' ? opt.label : opt.value),
      disabled: opt.disabled,
      onClick: () => onChange && onChange(opt.value)
    }, opt.icon, !iconOnly && opt.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Select({
  label,
  options = [],
  size = 'md',
  id,
  className = '',
  children,
  ...rest
}) {
  useStyles();
  const selId = id || (label ? `eds-select-${Math.random().toString(36).slice(2, 8)}` : undefined);
  const cls = ['eds-select', size === 'sm' ? 'eds-select--sm' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", null, label && /*#__PURE__*/React.createElement("label", {
    className: "eds-select__label",
    htmlFor: selId
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "eds-select-wrap"
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: selId,
    className: cls
  }, rest), children || options.map(o => {
    const opt = typeof o === 'string' ? {
      value: o,
      label: o
    } : o;
    return /*#__PURE__*/React.createElement("option", {
      key: opt.value,
      value: opt.value
    }, opt.label);
  })), /*#__PURE__*/React.createElement("span", {
    className: "eds-select-wrap__chev"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  })))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Switch({
  label,
  disabled = false,
  className = '',
  ...rest
}) {
  useStyles();
  const cls = ['eds-switch', disabled ? 'eds-switch--disabled' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("label", {
    className: cls
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "eds-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eds-switch__thumb"
  })), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// ui_kits/easydesign-editor/App.jsx
try { (() => {
/* EasyDesign editor — App: state, tree ops, drag-and-drop, undo/redo, zoom. */
const NS = window.EasyDesignDesignSystem_95eb6c;
const {
  IconButton,
  Badge,
  Button
} = NS;
const {
  Icon,
  EDS_DATA,
  EDS_Toolbar,
  EDS_Palette,
  EDS_Frame,
  EDS_Inspector,
  EDS_DesignPalette,
  EDS_ExportPanel
} = window;
const {
  makeNode,
  isContainer,
  sampleFrame,
  DEFAULT_THEME,
  uid
} = EDS_DATA;
const clone = o => JSON.parse(JSON.stringify(o));

/* ---- immutable-ish tree ops on a frame ---- */
function nodeAtPath(children, path) {
  let list = children,
    node = null;
  for (const i of path) {
    node = list[i];
    if (!node) return null;
    list = node.children || [];
  }
  return node;
}
function updateById(children, id, patch) {
  return children.map(n => {
    if (n.id === id) return {
      ...n,
      ...patch
    };
    if (n.children) return {
      ...n,
      children: updateById(n.children, id, patch)
    };
    return n;
  });
}
function removeById(children, id) {
  return children.filter(n => n.id !== id).map(n => n.children ? {
    ...n,
    children: removeById(n.children, id)
  } : n);
}
function insertAt(frame, path, position, newNode) {
  const f = clone(frame);
  if (position === 'inside') {
    const target = nodeAtPath(f.children, path);
    if (target && isContainer(target.type)) {
      target.children = target.children || [];
      target.children.push(newNode);
    } else {
      f.children.push(newNode);
    }
    return f;
  }
  // before / after relative to node at path
  const parentPath = path.slice(0, -1);
  let list = f.children;
  for (const i of parentPath) list = list[i].children;
  const idx = path[path.length - 1];
  list.splice(position === 'before' ? idx : idx + 1, 0, newNode);
  return f;
}
function App() {
  const [frames, setFrames] = React.useState([sampleFrame()]);
  const [theme, setTheme] = React.useState(DEFAULT_THEME);
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedFrameId, setSelectedFrameId] = React.useState(null);
  const [dark, setDark] = React.useState(false);
  const [tab, setTab] = React.useState('inspector');
  const [target, setTarget] = React.useState('react');
  const [query, setQuery] = React.useState('');
  const [group, setGroup] = React.useState('all');
  const [zoom, setZoom] = React.useState(100);
  const [tool, setTool] = React.useState('cursor');
  const [save, setSave] = React.useState('saved');
  const [dragType, setDragType] = React.useState(null);
  const [drop, setDrop] = React.useState(null); // {frameId, key, position}
  const hist = React.useRef({
    past: [],
    future: []
  });
  const saveTimer = React.useRef(null);
  const activeFrame = frames[0];
  const medium = activeFrame ? activeFrame.medium : 'web';
  const selectedFrame = React.useMemo(() => frames.find(f => f.id === selectedFrameId) || null, [frames, selectedFrameId]);
  const selectElement = id => {
    setSelectedId(id);
    if (id) setSelectedFrameId(null);
  };
  const selectFrame = id => {
    setSelectedFrameId(id);
    setSelectedId(null);
    setTab('inspector');
  };
  const toggleDark = () => {
    const v = !dark;
    setDark(v);
    document.documentElement.dataset.theme = v ? 'dark' : '';
  };
  const selectedNode = React.useMemo(() => {
    if (!selectedId) return null;
    const find = list => {
      for (const n of list) {
        if (n.id === selectedId) return n;
        if (n.children) {
          const r = find(n.children);
          if (r) return r;
        }
      }
      return null;
    };
    return activeFrame ? find(activeFrame.children) : null;
  }, [selectedId, frames]);
  function commit(nextFrames, nextTheme) {
    hist.current.past.push({
      frames: clone(frames),
      theme: clone(theme)
    });
    if (hist.current.past.length > 50) hist.current.past.shift();
    hist.current.future = [];
    if (nextFrames) setFrames(nextFrames);
    if (nextTheme) setTheme(nextTheme);
    flashSave();
  }
  function flashSave() {
    setSave('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSave('saved'), 900);
  }
  function undo() {
    const p = hist.current.past.pop();
    if (!p) return;
    hist.current.future.push({
      frames: clone(frames),
      theme: clone(theme)
    });
    setFrames(p.frames);
    setTheme(p.theme);
    flashSave();
  }
  function redo() {
    const n = hist.current.future.pop();
    if (!n) return;
    hist.current.past.push({
      frames: clone(frames),
      theme: clone(theme)
    });
    setFrames(n.frames);
    setTheme(n.theme);
    flashSave();
  }

  /* ---- mutations ---- */
  const updateFrame0 = fn => commit(frames.map((f, i) => i === 0 ? fn(f) : f));
  const updateNode = patch => updateFrame0(f => ({
    ...f,
    children: updateById(f.children, selectedId, patch)
  }));
  const deleteNode = () => {
    updateFrame0(f => ({
      ...f,
      children: removeById(f.children, selectedId)
    }));
    setSelectedId(null);
  };
  const renameFrame = (id, name) => commit(frames.map(f => f.id === id ? {
    ...f,
    name
  } : f));
  const setFrameMedium = (id, m) => commit(frames.map(f => f.id === id ? {
    ...f,
    medium: m
  } : f));
  const setThemeCommit = t => commit(null, t);
  const addNew = type => {
    const node = makeNode(type);
    updateFrame0(f => ({
      ...f,
      children: [...f.children, node]
    }));
    setSelectedId(node.id);
    setTab('inspector');
  };
  const newFrame = () => {
    const f = {
      id: uid(),
      name: `Frame ${frames.length + 1}`,
      medium: 'web',
      children: []
    };
    commit([...frames, f]);
  };
  const reset = () => {
    if (!window.confirm('Start over with an empty canvas? This clears all frames.')) return;
    commit([{
      id: uid(),
      name: 'Untitled Frame',
      medium: 'web',
      children: []
    }]);
    setSelectedId(null);
  };

  /* ---- drag handlers factory (per frame) ---- */
  const keyOf = path => path.join('-');
  function makeHandlers(frame) {
    const overNode = (node, path) => e => {
      if (!dragType) return;
      e.preventDefault();
      e.stopPropagation();
      const r = e.currentTarget.getBoundingClientRect();
      const pos = e.clientY - r.top < r.height / 2 ? 'before' : 'after';
      setDrop({
        frameId: frame.id,
        key: keyOf(path),
        position: pos
      });
    };
    const overContainer = (node, path) => e => {
      if (!dragType || !isContainer(node.type)) return;
      e.preventDefault();
      e.stopPropagation();
      setDrop({
        frameId: frame.id,
        key: keyOf(path),
        position: 'inside'
      });
    };
    const doDrop = e => {
      if (!dragType || !drop || drop.frameId !== frame.id) {
        setDrop(null);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const path = drop.key === '' ? [0] : drop.key.split('-').map(Number);
      const node = makeNode(dragType);
      const blocked = frame.medium === 'email' && node.type === 'grid';
      if (!blocked) {
        const nf = insertAt(frame, frame.children.length ? path : [0], frame.children.length ? drop.position : 'inside', node);
        commit(frames.map(f => f.id === frame.id ? nf : f));
        setSelectedId(node.id);
      }
      setDrop(null);
      setDragType(null);
    };
    return {
      node: (node, path) => ({
        onDragOver: overNode(node, path),
        onDrop: doDrop
      }),
      container: (node, path) => ({
        onDragOver: overContainer(node, path),
        onDrop: doDrop
      }),
      frameBody: () => ({
        onDragOver: e => {
          if (dragType && frame.children.length === 0) {
            e.preventDefault();
            setDrop({
              frameId: frame.id,
              key: '',
              position: 'inside'
            });
          }
        },
        onDrop: doDrop
      }),
      indicatorFor: path => drop && drop.frameId === frame.id && drop.key === keyOf(path) ? drop.position : drop && drop.frameId === frame.id && drop.key === '' && keyOf(path) === '0' && frame.children.length === 0 ? 'inside' : null
    };
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--app-bg)'
    }
  }, /*#__PURE__*/React.createElement(EDS_Toolbar, {
    saveState: save,
    canUndo: hist.current.past.length > 0,
    canRedo: hist.current.future.length > 0,
    onUndo: undo,
    onRedo: redo,
    onExport: () => setTab('export'),
    onImport: () => {},
    onReset: reset,
    dark: dark,
    onToggleDark: toggleDark
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(EDS_Palette, {
    medium: medium,
    query: query,
    onQuery: setQuery,
    group: group,
    onGroup: setGroup,
    onDragStart: setDragType,
    onDragEnd: () => {
      setDragType(null);
      setDrop(null);
    },
    onAdd: addNew
  }), /*#__PURE__*/React.createElement("main", {
    className: "eds-dotgrid",
    style: {
      flex: 1,
      position: 'relative',
      overflow: 'auto'
    },
    onDragOver: e => {
      if (dragType) e.preventDefault();
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 'max-content',
      minHeight: '100%',
      padding: '56px 64px 120px',
      display: 'flex',
      gap: 44,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 44,
      transform: `scale(${zoom / 100})`,
      transformOrigin: 'top left',
      transition: 'transform 150ms var(--ease-out)'
    }
  }, frames.map(f => /*#__PURE__*/React.createElement(EDS_Frame, {
    key: f.id,
    frame: f,
    theme: theme,
    selectedId: selectedId,
    selectedFrameId: selectedFrameId,
    onSelect: selectElement,
    onSelectFrame: selectFrame,
    onRename: renameFrame,
    onMedium: setFrameMedium,
    dragHandlers: makeHandlers(f)
  })), /*#__PURE__*/React.createElement("button", {
    onClick: newFrame,
    style: {
      alignSelf: 'flex-start',
      marginTop: 4,
      width: 200,
      minHeight: 160,
      border: '1.5px dashed var(--border-strong)',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--surface-sunken)',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      fontSize: 13.5,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: '50%',
      background: 'var(--accent-soft)',
      color: 'var(--accent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon.plus, {
    size: 20
  })), "New Frame"))), dragType && /*#__PURE__*/React.createElement(DragGhost, {
    type: dragType
  }), /*#__PURE__*/React.createElement(ZoomBar, {
    zoom: zoom,
    setZoom: setZoom,
    tool: tool,
    setTool: setTool
  })), /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 'var(--rail-right-w)',
      flex: 'none',
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--text-ink)'
    }
  }, tab === 'inspector' ? 'Properties' : tab === 'design' ? 'Design Palette' : 'Export'), /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "Panel options",
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon.dots, {
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 16px 0'
    }
  }, /*#__PURE__*/React.createElement(NS.Tabs, {
    value: tab,
    onChange: setTab,
    tabs: [{
      value: 'inspector',
      label: 'Inspector'
    }, {
      value: 'design',
      label: 'Design'
    }, {
      value: 'export',
      label: 'Export'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: tab === 'export' ? 'hidden' : 'auto',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, tab === 'inspector' && /*#__PURE__*/React.createElement(EDS_Inspector, {
    node: selectedNode,
    frame: selectedFrame,
    onUpdate: updateNode,
    onDelete: deleteNode,
    onRenameFrame: renameFrame,
    onFrameMedium: setFrameMedium
  }), tab === 'design' && /*#__PURE__*/React.createElement(EDS_DesignPalette, {
    theme: theme,
    onTheme: setThemeCommit
  }), tab === 'export' && /*#__PURE__*/React.createElement(EDS_ExportPanel, {
    frame: activeFrame,
    theme: theme,
    target: target,
    onTarget: setTarget
  })))));
}
function DragGhost({
  type
}) {
  const [pos, setPos] = React.useState({
    x: -999,
    y: -999
  });
  React.useEffect(() => {
    const m = e => setPos({
      x: e.clientX,
      y: e.clientY
    });
    window.addEventListener('dragover', m);
    return () => window.removeEventListener('dragover', m);
  }, []);
  const label = {
    stack: 'Stack',
    row: 'Row',
    column: 'Column',
    grid: 'Grid',
    heading: 'Heading',
    text: 'Text',
    button: 'Primary Button',
    button2: 'Secondary Button',
    image: 'Image'
  }[type] || type;
  const icon = {
    button2: 'button'
  }[type] || type;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      left: pos.x + 14,
      top: pos.y + 12,
      pointerEvents: 'none',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      background: 'var(--surface)',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lift)',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-ink)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent-press)',
      display: 'flex'
    }
  }, React.createElement(Icon[icon] || Icon.stack, {
    size: 16
  })), label);
}
function ZoomBar({
  zoom,
  setZoom,
  tool,
  setTool
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 22,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: 5,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-pill)',
      boxShadow: 'var(--shadow-lg)'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "Cursor",
    active: tool === 'cursor',
    onClick: () => setTool('cursor')
  }, /*#__PURE__*/React.createElement(Icon.cursor, {
    size: 16
  })), /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "Pan",
    active: tool === 'pan',
    onClick: () => setTool('pan')
  }, /*#__PURE__*/React.createElement(Icon.hand, {
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 20,
      background: 'var(--border)',
      margin: '0 2px'
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "Zoom out",
    onClick: () => setZoom(Math.max(25, zoom - 10))
  }, /*#__PURE__*/React.createElement(Icon.zoomOut, {
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 46,
      textAlign: 'center',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-body)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, zoom, "%"), /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "Zoom in",
    onClick: () => setZoom(Math.min(200, zoom + 10))
  }, /*#__PURE__*/React.createElement(Icon.zoomIn, {
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 20,
      background: 'var(--border)',
      margin: '0 2px'
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "Fit to screen",
    onClick: () => setZoom(100)
  }, /*#__PURE__*/React.createElement(Icon.fit, {
    size: 16
  })));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/easydesign-editor/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/easydesign-editor/Board.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* EasyDesign editor — the Board: dot-grid canvas, frames, theme-driven node renderer,
   selection outline + drag handle, drop indicators, empty states. */
const {
  Badge,
  SegmentedControl
} = window.EasyDesignDesignSystem_95eb6c;
const {
  Icon
} = window;

/* ---- Render one design node using the USER theme (not chrome tokens) ---- */
function NodeView({
  node,
  theme,
  selectedId,
  onSelect,
  dragHandlers,
  path
}) {
  const sel = node.id === selectedId;
  const t = theme;
  const stop = e => {
    e.stopPropagation();
    onSelect(node.id);
  };
  let inner = null;
  if (node.type === 'heading') {
    inner = /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: 0,
        color: t.text,
        fontFamily: `${t.headingFont}, sans-serif`,
        fontSize: t.headingSize,
        fontWeight: 700,
        lineHeight: 1.1,
        textAlign: node.align,
        letterSpacing: '-0.02em'
      }
    }, node.text);
  } else if (node.type === 'text') {
    inner = /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        color: t.muted,
        fontFamily: `${t.bodyFont}, sans-serif`,
        fontSize: t.bodySize,
        lineHeight: 1.6,
        textAlign: node.align
      }
    }, node.text);
  } else if (node.type === 'button') {
    const primary = node.variant === 'primary';
    inner = /*#__PURE__*/React.createElement("button", {
      style: {
        background: primary ? t.primary : 'transparent',
        color: primary ? '#fff' : t.text,
        border: primary ? 'none' : `1px solid ${t.text}22`,
        borderRadius: t.radius,
        padding: '12px 22px',
        fontWeight: 600,
        fontSize: 15,
        fontFamily: `${t.bodyFont}, sans-serif`,
        cursor: 'pointer'
      }
    }, node.text);
  } else if (node.type === 'image') {
    inner = /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        aspectRatio: '16/7',
        borderRadius: t.radius,
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${t.primary}22, ${t.primary}0d)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px dashed ${t.primary}40`
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: t.primary,
        opacity: 0.7,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        fontWeight: 500
      }
    }, /*#__PURE__*/React.createElement(Icon.image, {
      size: 26
    }), " ", node.alt || 'Image'));
  } else if (window.EDS_DATA.isContainer(node.type)) {
    const dir = node.type === 'row' ? 'row' : 'column';
    const isGrid = node.type === 'grid';
    const empty = !node.children || node.children.length === 0;
    inner = /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: isGrid ? 'grid' : 'flex',
        gridTemplateColumns: isGrid ? `repeat(${node.columns || 2}, 1fr)` : undefined,
        flexDirection: dir,
        gap: t.gap,
        width: '100%',
        minHeight: empty ? 64 : undefined,
        ...(empty ? {
          border: `1.5px dashed ${t.text}22`,
          borderRadius: t.radius,
          alignItems: 'center',
          justifyContent: 'center'
        } : {})
      }
    }, dragHandlers.container(node, path)), empty ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: t.muted,
        fontSize: 13,
        opacity: 0.7
      }
    }, "Drop components inside this ", node.type) : node.children.map((c, i) => /*#__PURE__*/React.createElement(NodeView, {
      key: c.id,
      node: c,
      theme: theme,
      selectedId: selectedId,
      onSelect: onSelect,
      dragHandlers: dragHandlers,
      path: [...path, i]
    })));
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "eds-node",
    onClick: stop,
    style: {
      position: 'relative',
      outline: sel ? '2px solid var(--selection)' : '2px solid transparent',
      outlineOffset: 2,
      borderRadius: 3,
      transition: 'outline-color 120ms'
    }
  }, dragHandlers.node(node, path)), inner, sel && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -11,
      left: -2,
      height: 20,
      padding: '0 7px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'var(--selection)',
      color: '#fff',
      borderRadius: 'var(--radius-sm)',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '.02em',
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      cursor: 'grab'
    }
  }, /*#__PURE__*/React.createElement(Icon.dots, {
    size: 12
  })), labelFor(node)), /*#__PURE__*/React.createElement(DropLine, {
    show: dragHandlers.indicatorFor(path)
  }));
}
function labelFor(n) {
  return {
    heading: 'Heading',
    text: 'Text',
    button: n.variant === 'primary' ? 'Primary Button' : 'Secondary Button',
    image: 'Image',
    row: 'Row',
    column: 'Column',
    stack: 'Stack',
    grid: 'Grid'
  }[n.type] || n.type;
}
function DropLine({
  show
}) {
  if (!show) return null;
  const horizontal = show === 'before' || show === 'after';
  if (!horizontal) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      [show === 'before' ? 'top' : 'bottom']: -7,
      height: 3,
      background: 'var(--drop-indicator)',
      borderRadius: 3,
      pointerEvents: 'none',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: -4,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: 'var(--drop-indicator)'
    }
  }));
}

/* ---- One frame (card on the canvas) ---- */
function Frame({
  frame,
  theme,
  selectedId,
  selectedFrameId,
  onSelect,
  onSelectFrame,
  onRename,
  onMedium,
  dragHandlers
}) {
  const empty = frame.children.length === 0;
  const isSel = frame.id === selectedFrameId;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flex: 'none'
    }
  }, isSel && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -26,
      left: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 20,
      padding: '0 8px',
      background: 'var(--selection)',
      color: '#fff',
      borderRadius: 'var(--radius-sm)',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '.01em',
      boxShadow: 'var(--shadow-sm)',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon.web, {
    size: 12
  })), frame.name), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 520,
      background: 'var(--surface)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: isSel ? 'var(--shadow-frame), 0 0 0 2px var(--selection)' : 'var(--shadow-frame)',
      border: '1px solid var(--border-faint)',
      overflow: 'hidden',
      transition: 'box-shadow 150ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("header", {
    onClick: e => {
      e.stopPropagation();
      onSelectFrame(frame.id);
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      borderBottom: '1px solid var(--border-faint)',
      background: isSel ? 'var(--accent-soft)' : 'var(--surface)',
      cursor: 'pointer',
      transition: 'background 150ms'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: isSel ? 'var(--accent-press)' : 'var(--text-faint)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon.web, {
    size: 16
  })), /*#__PURE__*/React.createElement("input", {
    value: frame.name,
    onClick: e => e.stopPropagation(),
    onChange: e => onRename(frame.id, e.target.value),
    style: {
      flex: 1,
      border: 'none',
      background: 'transparent',
      font: 'inherit',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-ink)',
      outline: 'none',
      padding: '2px 4px',
      borderRadius: 4
    }
  }), /*#__PURE__*/React.createElement("span", {
    onClick: e => e.stopPropagation(),
    style: {
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    value: frame.medium,
    onChange: v => onMedium(frame.id, v),
    options: [{
      value: 'web',
      label: 'Web',
      icon: /*#__PURE__*/React.createElement(Icon.web, {
        size: 14
      })
    }, {
      value: 'email',
      label: 'Email',
      icon: /*#__PURE__*/React.createElement(Icon.mail, {
        size: 14
      })
    }]
  }))), /*#__PURE__*/React.createElement("div", _extends({
    onClick: () => onSelect(null)
  }, dragHandlers.frameBody(frame), {
    style: {
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.gap,
      minHeight: 160,
      background: theme.background
    }
  }), empty ? /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 150,
      border: '1.5px dashed var(--border-strong)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      color: 'var(--text-muted)',
      background: dragHandlers.indicatorFor([0]) === 'inside' ? 'var(--drop-inside)' : 'transparent',
      borderColor: dragHandlers.indicatorFor([0]) === 'inside' ? 'var(--drop-indicator)' : 'var(--border-strong)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)',
      opacity: 0.7
    }
  }, /*#__PURE__*/React.createElement(Icon.plus, {
    size: 26
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, "Drag a component here to start"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5
    }
  }, "Anything from the left panel works.")) : frame.children.map((c, i) => /*#__PURE__*/React.createElement(NodeView, {
    key: c.id,
    node: c,
    theme: theme,
    selectedId: selectedId,
    onSelect: onSelect,
    dragHandlers: dragHandlers,
    path: [i]
  })))));
}
Object.assign(window, {
  EDS_Frame: Frame,
  EDS_NodeView: NodeView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/easydesign-editor/Board.jsx", error: String((e && e.message) || e) }); }

// ui_kits/easydesign-editor/Palette.jsx
try { (() => {
/* EasyDesign editor — left rail Component Palette (searchable, grouped, draggable). */
const {
  Input,
  Tabs,
  PaletteItem
} = window.EasyDesignDesignSystem_95eb6c;
const {
  Icon
} = window;
function Palette({
  medium,
  query,
  onQuery,
  group,
  onGroup,
  onDragStart,
  onDragEnd,
  onAdd
}) {
  const {
    CATALOG
  } = window.EDS_DATA;
  const match = item => item.label.toLowerCase().includes(query.trim().toLowerCase());
  const renderItem = (item, layout) => {
    const blocked = medium === 'email' && !item.email;
    return /*#__PURE__*/React.createElement(PaletteItem, {
      key: item.type,
      layout: layout,
      icon: React.createElement(Icon[item.icon], {
        size: layout === 'card' ? 22 : 20
      }),
      label: item.label,
      disabled: blocked,
      disabledNote: blocked ? 'Not available in email' : undefined,
      onDragStart: e => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/eds', item.type);
        onDragStart(item.type);
      },
      onDragEnd: onDragEnd,
      onClick: () => !blocked && onAdd(item.type),
      title: blocked ? 'Not available in email' : 'Drag onto the board, or click to add'
    });
  };
  const layoutItems = CATALOG.layout.filter(match);
  const contentItems = CATALOG.content.filter(match);
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 'var(--rail-left-w)',
      flex: 'none',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 14px 10px'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    lead: /*#__PURE__*/React.createElement(Icon.search, {
      size: 16
    }),
    placeholder: "Search components\u2026",
    value: query,
    onChange: e => onQuery(e.target.value),
    size: "md"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 14px 12px'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    variant: "pill",
    value: group,
    onChange: onGroup,
    tabs: [{
      value: 'all',
      label: 'All'
    }, {
      value: 'layout',
      label: 'Layout'
    }, {
      value: 'content',
      label: 'Content'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '0 14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, (group === 'all' || group === 'layout') && layoutItems.length > 0 && /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    className: "eds-label",
    style: {
      marginBottom: 9
    }
  }, "Layout"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, layoutItems.map(i => renderItem(i, 'card')))), (group === 'all' || group === 'content') && contentItems.length > 0 && /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    className: "eds-label",
    style: {
      marginBottom: 9
    }
  }, "Content"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, contentItems.map(i => renderItem(i, 'row')))), layoutItems.length === 0 && contentItems.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '28px 8px',
      color: 'var(--text-muted)',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-faint)',
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Icon.search, {
    size: 22
  })), "No components match \u201C", query, "\u201D."), medium === 'email' && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--warning-soft)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 12px',
      fontSize: 12,
      color: 'var(--text-body)',
      lineHeight: 1.45
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--warning)'
    }
  }, "Email mode."), " Some layout components are hidden because they aren\u2019t email-safe.")));
}
Object.assign(window, {
  EDS_Palette: Palette
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/easydesign-editor/Palette.jsx", error: String((e && e.message) || e) }); }

// ui_kits/easydesign-editor/RightRail.jsx
try { (() => {
/* EasyDesign editor — right rail: Inspector · Design Palette (Theme) · Export. */
const NS = window.EasyDesignDesignSystem_95eb6c;
const {
  Tabs,
  PanelHeader,
  PanelSection,
  Input,
  Select,
  SegmentedControl,
  Swatch,
  Button,
  IconButton,
  Checkbox
} = NS;
const {
  Icon
} = window;

/* ---------------- Inspector ---------------- */
function Inspector({
  node,
  frame,
  onUpdate,
  onDelete,
  onRenameFrame,
  onFrameMedium
}) {
  if (!node && frame) {
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '14px 16px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 38,
        height: 38,
        borderRadius: 'var(--radius-md)',
        background: 'var(--accent-soft)',
        color: 'var(--accent-press)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement(Icon.web, {
      size: 19
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-ink)'
      }
    }, frame.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)'
      }
    }, "frame \xB7 ", frame.children.length, " element", frame.children.length === 1 ? '' : 's'))), /*#__PURE__*/React.createElement(PanelSection, {
      title: "Frame",
      defaultOpen: true
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Name",
      value: frame.name,
      onChange: e => onRenameFrame(frame.id, e.target.value)
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 14
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "eds-label",
      style: {
        marginBottom: 8
      }
    }, "Medium"), /*#__PURE__*/React.createElement(SegmentedControl, {
      value: frame.medium,
      onChange: v => onFrameMedium(frame.id, v),
      options: [{
        value: 'web',
        label: 'Web',
        icon: /*#__PURE__*/React.createElement(Icon.web, {
          size: 14
        })
      }, {
        value: 'email',
        label: 'Email',
        icon: /*#__PURE__*/React.createElement(Icon.mail, {
          size: 14
        })
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        fontSize: 12.5,
        color: 'var(--text-muted)',
        lineHeight: 1.5
      }
    }, frame.medium === 'email' ? 'Only email-safe components are allowed in this frame.' : 'All components are available on web frames.')), /*#__PURE__*/React.createElement(PanelSection, {
      title: "Size & Position",
      defaultOpen: true
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Width",
      defaultValue: "520",
      size: "sm",
      trail: /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: 'var(--text-muted)'
        }
      }, "px")
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Height",
      defaultValue: "Auto",
      size: "sm"
    }))));
  }
  if (!node) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '40px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 46,
        height: 46,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-sunken)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 14px',
        color: 'var(--text-faint)'
      }
    }, /*#__PURE__*/React.createElement(Icon.sliders, {
      size: 22
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-body)',
        marginBottom: 4
      }
    }, "Nothing selected"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        lineHeight: 1.5
      }
    }, "Click any element to edit it here, or click a frame\u2019s header to edit the whole frame."));
  }
  const align = node.align || 'left';
  const isText = node.type === 'heading' || node.type === 'text';
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 'var(--radius-md)',
      background: 'var(--accent-soft)',
      color: 'var(--accent-press)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, React.createElement(Icon[iconFor(node.type)] || Icon.stack, {
    size: 19
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-ink)'
    }
  }, titleFor(node)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)'
    }
  }, "element.", node.type))), isText && /*#__PURE__*/React.createElement(PanelSection, {
    title: "Content",
    defaultOpen: true
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Text value",
    value: node.text,
    onChange: e => onUpdate({
      text: e.target.value
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 14
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "eds-label",
    style: {
      marginBottom: 8
    }
  }, "Alignment"), /*#__PURE__*/React.createElement(SegmentedControl, {
    iconOnly: true,
    value: align,
    onChange: v => onUpdate({
      align: v
    }),
    options: [{
      value: 'left',
      ariaLabel: 'Align left',
      icon: /*#__PURE__*/React.createElement(Icon.alignL, {
        size: 15
      })
    }, {
      value: 'center',
      ariaLabel: 'Align center',
      icon: /*#__PURE__*/React.createElement(Icon.alignC, {
        size: 15
      })
    }, {
      value: 'right',
      ariaLabel: 'Align right',
      icon: /*#__PURE__*/React.createElement(Icon.alignR, {
        size: 15
      })
    }, {
      value: 'justify',
      ariaLabel: 'Justify',
      icon: /*#__PURE__*/React.createElement(Icon.alignJ, {
        size: 15
      })
    }]
  })), node.type === 'button' && /*#__PURE__*/React.createElement(PanelSection, {
    title: "Content",
    defaultOpen: true
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Label",
    value: node.text,
    onChange: e => onUpdate({
      text: e.target.value
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 12
    }
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Variant",
    value: node.variant,
    onChange: e => onUpdate({
      variant: e.target.value
    }),
    options: [{
      value: 'primary',
      label: 'Primary (filled)'
    }, {
      value: 'secondary',
      label: 'Secondary (outline)'
    }]
  })), node.type === 'image' && /*#__PURE__*/React.createElement(PanelSection, {
    title: "Content",
    defaultOpen: true
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Alt text",
    value: node.alt,
    onChange: e => onUpdate({
      alt: e.target.value
    }),
    hint: "Describe the image for accessibility & email."
  })), window.EDS_DATA.isContainer(node.type) && /*#__PURE__*/React.createElement(PanelSection, {
    title: "Layout",
    defaultOpen: true
  }, node.type === 'grid' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Select, {
    label: "Columns",
    value: String(node.columns || 2),
    onChange: e => onUpdate({
      columns: Number(e.target.value)
    }),
    options: [{
      value: '2',
      label: '2 columns'
    }, {
      value: '3',
      label: '3 columns'
    }, {
      value: '4',
      label: '4 columns'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 12
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, "Gap between children is controlled by the shared ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--text-body)'
    }
  }, "Theme spacing"), ". Edit it in the Design tab.")), /*#__PURE__*/React.createElement(PanelSection, {
    title: "Size & Position",
    defaultOpen: true
  }, /*#__PURE__*/React.createElement("div", {
    className: "eds-label",
    style: {
      marginBottom: 8
    }
  }, "Alignment"), /*#__PURE__*/React.createElement(SegmentedControl, {
    iconOnly: true,
    value: align,
    onChange: v => onUpdate({
      align: v
    }),
    options: [{
      value: 'left',
      ariaLabel: 'Left',
      icon: /*#__PURE__*/React.createElement(Icon.alignL, {
        size: 15
      })
    }, {
      value: 'center',
      ariaLabel: 'Center',
      icon: /*#__PURE__*/React.createElement(Icon.alignC, {
        size: 15
      })
    }, {
      value: 'right',
      ariaLabel: 'Right',
      icon: /*#__PURE__*/React.createElement(Icon.alignR, {
        size: 15
      })
    }, {
      value: 'justify',
      ariaLabel: 'Fill',
      icon: /*#__PURE__*/React.createElement(Icon.alignJ, {
        size: 15
      })
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Width",
    defaultValue: "Fill",
    size: "sm",
    trail: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)'
      }
    }, "px")
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Height",
    defaultValue: "Auto",
    size: "sm"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px 20px'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm",
    block: true,
    icon: /*#__PURE__*/React.createElement(Icon.trash, {
      size: 15
    }),
    onClick: onDelete
  }, "Delete element")));
}

/* ---------------- Design Palette (Theme) ---------------- */
function DesignPalette({
  theme,
  onTheme
}) {
  const set = k => v => onTheme({
    ...theme,
    [k]: v
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 16px 4px',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon.palette, {
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--text-ink)'
    }
  }, "Your style guide")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px 6px',
      fontSize: 12.5,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, "Edit a value and the whole board re-themes instantly."), /*#__PURE__*/React.createElement(PanelSection, {
    title: "Brand colors",
    defaultOpen: true
  }, /*#__PURE__*/React.createElement(Swatch, {
    name: "Primary",
    value: theme.primary,
    onChange: set('primary')
  }), /*#__PURE__*/React.createElement(Swatch, {
    name: "Background",
    value: theme.background,
    onChange: set('background')
  }), /*#__PURE__*/React.createElement(Swatch, {
    name: "Text",
    value: theme.text,
    onChange: set('text')
  }), /*#__PURE__*/React.createElement(Swatch, {
    name: "Muted text",
    value: theme.muted,
    onChange: set('muted')
  })), /*#__PURE__*/React.createElement(PanelSection, {
    title: "Type scale",
    defaultOpen: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Heading",
    type: "number",
    value: theme.headingSize,
    onChange: e => onTheme({
      ...theme,
      headingSize: Number(e.target.value)
    }),
    size: "sm",
    trail: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)'
      }
    }, "px")
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Body",
    type: "number",
    value: theme.bodySize,
    onChange: e => onTheme({
      ...theme,
      bodySize: Number(e.target.value)
    }),
    size: "sm",
    trail: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)'
      }
    }, "px")
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 12
    }
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Font",
    value: theme.headingFont,
    onChange: e => onTheme({
      ...theme,
      headingFont: e.target.value,
      bodyFont: e.target.value
    }),
    options: ['Inter', 'Georgia', 'system-ui']
  })), /*#__PURE__*/React.createElement(PanelSection, {
    title: "Spacing & radius",
    defaultOpen: true
  }, /*#__PURE__*/React.createElement(ThemeSlider, {
    label: "Corner radius",
    value: theme.radius,
    min: 0,
    max: 24,
    suffix: "px",
    onChange: v => onTheme({
      ...theme,
      radius: v
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 14
    }
  }), /*#__PURE__*/React.createElement(ThemeSlider, {
    label: "Gap",
    value: theme.gap,
    min: 4,
    max: 48,
    suffix: "px",
    onChange: v => onTheme({
      ...theme,
      gap: v
    })
  })));
}
function ThemeSlider({
  label,
  value,
  min,
  max,
  suffix,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: 'var(--text-body)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, value, suffix)), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: min,
    max: max,
    value: value,
    onChange: e => onChange(Number(e.target.value)),
    style: {
      width: '100%',
      accentColor: 'var(--accent)'
    }
  }));
}

/* ---------------- Export ---------------- */
const TARGETS = [{
  value: 'react',
  label: 'React',
  icon: 'react'
}, {
  value: 'angular',
  label: 'Angular',
  icon: 'code'
}, {
  value: 'html',
  label: 'HTML',
  icon: 'web'
}, {
  value: 'mjml',
  label: 'Email',
  icon: 'mail'
}];
function ExportPanel({
  frame,
  theme,
  target,
  onTarget
}) {
  const [copied, setCopied] = React.useState(false);
  const code = React.useMemo(() => window.EDS_CODE.generate(target, frame, theme), [target, frame, theme]);
  const lines = React.useMemo(() => window.EDS_CODE.highlight(code, target), [code, target]);
  const copy = () => {
    try {
      navigator.clipboard.writeText(code);
    } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 4px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--text-ink)'
    }
  }, "Your design, as real code"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      marginTop: 3
    }
  }, "Production-ready. Pick a target and copy.")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px 10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gap: 6
    }
  }, TARGETS.map(t => {
    const active = t.value === target;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      type: "button",
      onClick: () => onTarget(t.value),
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        padding: '10px 4px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent-soft)' : 'var(--surface)',
        color: active ? 'var(--accent-press)' : 'var(--text-muted)',
        fontWeight: 600,
        fontSize: 12,
        transition: 'all 120ms'
      }
    }, React.createElement(Icon[t.icon], {
      size: 17
    }), t.label);
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      margin: '4px 16px 0',
      borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      overflow: 'hidden',
      background: 'var(--code-bg)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '9px 12px',
      borderBottom: '1px solid rgba(255,255,255,.06)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: '#ff5f57'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: '#febc2e'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: '#28c840'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11.5,
      color: 'var(--code-dim)',
      marginLeft: 4
    }
  }, fileName(target, frame))), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      flex: 1,
      overflow: 'auto',
      padding: '12px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      lineHeight: 1.65,
      color: 'var(--code-fg)'
    }
  }, /*#__PURE__*/React.createElement("code", null, lines.map((toks, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      flex: 'none',
      textAlign: 'right',
      marginRight: 14,
      color: 'var(--code-dim)',
      userSelect: 'none',
      opacity: 0.6
    }
  }, i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'pre'
    }
  }, toks.map((t, j) => /*#__PURE__*/React.createElement("span", {
    key: j,
    style: {
      color: codeColor(t.cls)
    }
  }, t.text)))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      padding: '12px 16px'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "md",
    block: true,
    icon: copied ? /*#__PURE__*/React.createElement(Icon.check, {
      size: 16
    }) : /*#__PURE__*/React.createElement(Icon.copy, {
      size: 16
    }),
    onClick: copy
  }, copied ? 'Copied!' : 'Copy code'), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "md",
    block: true,
    icon: /*#__PURE__*/React.createElement(Icon.download, {
      size: 16
    }),
    onClick: copy
  }, "Download")));
}
function codeColor(cls) {
  return {
    cmt: 'var(--code-dim)',
    str: 'var(--code-str)',
    tag: 'var(--code-tag)',
    key: 'var(--code-key)',
    num: 'var(--code-num)',
    fg: 'var(--code-fg)'
  }[cls] || 'var(--code-fg)';
}
function fileName(target, frame) {
  const base = (frame ? frame.name : 'frame').replace(/[^a-z0-9]+/gi, '').replace(/^./, c => c.toUpperCase()) || 'Frame';
  return {
    react: base + '.jsx',
    angular: dash(frame) + '.component.ts',
    html: dash(frame) + '.html',
    mjml: dash(frame) + '.mjml'
  }[target];
}
function dash(frame) {
  return (frame ? frame.name : 'frame').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'frame';
}
function iconFor(t) {
  return {
    heading: 'heading',
    text: 'text',
    button: 'button',
    image: 'image',
    row: 'row',
    column: 'column',
    stack: 'stack',
    grid: 'grid'
  }[t] || 'stack';
}
function titleFor(n) {
  return {
    heading: 'Heading',
    text: 'Text block',
    button: n.variant === 'primary' ? 'Primary Button' : 'Secondary Button',
    image: 'Image',
    row: 'Row',
    column: 'Column',
    stack: 'Stack',
    grid: 'Grid'
  }[n.type] || n.type;
}
Object.assign(window, {
  EDS_Inspector: Inspector,
  EDS_DesignPalette: DesignPalette,
  EDS_ExportPanel: ExportPanel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/easydesign-editor/RightRail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/easydesign-editor/Toolbar.jsx
try { (() => {
/* EasyDesign editor — slim top toolbar. */
const {
  Button,
  IconButton,
  Badge
} = window.EasyDesignDesignSystem_95eb6c;
const {
  Icon
} = window;
function Toolbar({
  saveState,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  onImport,
  onReset,
  dark,
  onToggleDark
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 'var(--toolbar-h)',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '0 14px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      flex: 'none',
      zIndex: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-glyph.svg",
    width: "26",
    height: "26",
    alt: "",
    style: {
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 19,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: 'var(--text-ink)'
    }
  }, "Easy", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, "Design"))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 24,
      background: 'var(--border)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "Undo",
    onClick: onUndo,
    disabled: !canUndo
  }, /*#__PURE__*/React.createElement(Icon.undo, {
    size: 17
  })), /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "Redo",
    onClick: onRedo,
    disabled: !canRedo
  }, /*#__PURE__*/React.createElement(Icon.redo, {
    size: 17
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginLeft: 4,
      fontSize: 13,
      color: 'var(--text-muted)',
      minWidth: 130
    }
  }, saveState === 'saving' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Spinner, null), " ", /*#__PURE__*/React.createElement("span", null, "Saving\u2026")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--success)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon.check, {
    size: 15
  })), " ", /*#__PURE__*/React.createElement("span", null, "All changes saved"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    icon: /*#__PURE__*/React.createElement(Icon.upload, {
      size: 15
    }),
    onClick: onImport
  }, "Import"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    icon: /*#__PURE__*/React.createElement(Icon.share, {
      size: 15
    })
  }, "Share"), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm",
    onClick: onReset
  }, "Reset"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 24,
      background: 'var(--border)'
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": dark ? 'Switch to light mode' : 'Switch to dark mode',
    onClick: onToggleDark
  }, dark ? /*#__PURE__*/React.createElement(Icon.sun, {
    size: 17
  }) : /*#__PURE__*/React.createElement(Icon.moon, {
    size: 17
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "md",
    icon: /*#__PURE__*/React.createElement(Icon.code, {
      size: 16
    }),
    onClick: onExport
  }, "Export Code"));
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 14,
      display: 'inline-block',
      border: '2px solid var(--accent-soft-2)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'eds-spin .7s linear infinite'
    }
  });
}
Object.assign(window, {
  EDS_Toolbar: Toolbar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/easydesign-editor/Toolbar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/easydesign-editor/codegen.jsx
try { (() => {
/* EasyDesign editor — code generators (React / Angular / HTML / MJML) + tiny syntax highlighter. */

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
const pad = n => '  '.repeat(n);

/* ---------- React (JSX + inline theme) ---------- */
function genReact(frame, theme) {
  const t = theme;
  const node = (n, d) => {
    const p = pad(d);
    switch (n.type) {
      case 'heading':
        return `${p}<h1 style={s.heading}>${esc(n.text)}</h1>`;
      case 'text':
        return `${p}<p style={s.text}>${esc(n.text)}</p>`;
      case 'button':
        return `${p}<button style={s.${n.variant === 'primary' ? 'btnPrimary' : 'btnSecondary'}}>${esc(n.text)}</button>`;
      case 'image':
        return `${p}<img src="/placeholder.jpg" alt="${esc(n.alt)}" style={s.image} />`;
      case 'row':
        return `${p}<div style={s.row}>\n${(n.children || []).map(c => node(c, d + 1)).join('\n')}\n${p}</div>`;
      case 'column':
      case 'stack':
        return `${p}<div style={s.stack}>\n${(n.children || []).map(c => node(c, d + 1)).join('\n')}\n${p}</div>`;
      case 'grid':
        return `${p}<div style={s.grid}>\n${(n.children || []).map(c => node(c, d + 1)).join('\n')}\n${p}</div>`;
      default:
        return '';
    }
  };
  const body = frame.children.map(c => node(c, 3)).join('\n');
  return `export function ${cn(frame.name)}() {
  return (
    <section style={s.frame}>
${body}
    </section>
  );
}

const s = {
  frame: { background: '${t.background}', display: 'flex', flexDirection: 'column', gap: ${t.gap}, padding: 32, fontFamily: '${t.bodyFont}, sans-serif' },
  heading: { color: '${t.text}', fontSize: ${t.headingSize}, fontWeight: 700, lineHeight: 1.1, margin: 0 },
  text: { color: '${t.muted}', fontSize: ${t.bodySize}, lineHeight: 1.6, margin: 0 },
  btnPrimary: { background: '${t.primary}', color: '#fff', border: 'none', borderRadius: ${t.radius}, padding: '12px 20px', fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { background: 'transparent', color: '${t.text}', border: '1px solid ${t.text}22', borderRadius: ${t.radius}, padding: '12px 20px', fontWeight: 600, cursor: 'pointer' },
  image: { width: '100%', borderRadius: ${t.radius}, display: 'block' },
  row: { display: 'flex', gap: ${t.gap} },
  stack: { display: 'flex', flexDirection: 'column', gap: ${t.gap} },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: ${t.gap} },
};`;
}

/* ---------- Angular (component template) ---------- */
function genAngular(frame, theme) {
  const t = theme;
  const node = (n, d) => {
    const p = pad(d);
    switch (n.type) {
      case 'heading':
        return `${p}<h1 class="heading">${esc(n.text)}</h1>`;
      case 'text':
        return `${p}<p class="text">${esc(n.text)}</p>`;
      case 'button':
        return `${p}<button class="btn ${n.variant}">${esc(n.text)}</button>`;
      case 'image':
        return `${p}<img src="/placeholder.jpg" alt="${esc(n.alt)}" class="image" />`;
      case 'row':
        return `${p}<div class="row">\n${(n.children || []).map(c => node(c, d + 1)).join('\n')}\n${p}</div>`;
      case 'column':
      case 'stack':
        return `${p}<div class="stack">\n${(n.children || []).map(c => node(c, d + 1)).join('\n')}\n${p}</div>`;
      case 'grid':
        return `${p}<div class="grid">\n${(n.children || []).map(c => node(c, d + 1)).join('\n')}\n${p}</div>`;
      default:
        return '';
    }
  };
  return `import { Component } from '@angular/core';

@Component({
  selector: 'app-${slug(frame.name)}',
  template: \`
    <section class="frame">
${frame.children.map(c => node(c, 3)).join('\n')}
    </section>\`,
  styles: [\`
    .frame { background: ${t.background}; display:flex; flex-direction:column; gap:${t.gap}px; padding:32px; }
    .heading { color:${t.text}; font-size:${t.headingSize}px; font-weight:700; margin:0; }
    .text { color:${t.muted}; font-size:${t.bodySize}px; line-height:1.6; margin:0; }
    .btn { border-radius:${t.radius}px; padding:12px 20px; font-weight:600; cursor:pointer; }
    .btn.primary { background:${t.primary}; color:#fff; border:none; }
    .btn.secondary { background:transparent; color:${t.text}; border:1px solid ${t.text}22; }
    .row { display:flex; gap:${t.gap}px; } .stack { display:flex; flex-direction:column; gap:${t.gap}px; }
    .grid { display:grid; grid-template-columns:repeat(2,1fr); gap:${t.gap}px; }\`]
})
export class ${cn(frame.name)}Component {}`;
}

/* ---------- Static HTML ---------- */
function genHTML(frame, theme) {
  const t = theme;
  const node = (n, d) => {
    const p = pad(d);
    switch (n.type) {
      case 'heading':
        return `${p}<h1 class="heading">${esc(n.text)}</h1>`;
      case 'text':
        return `${p}<p class="text">${esc(n.text)}</p>`;
      case 'button':
        return `${p}<a class="btn ${n.variant}">${esc(n.text)}</a>`;
      case 'image':
        return `${p}<img src="placeholder.jpg" alt="${esc(n.alt)}" class="image">`;
      case 'row':
        return `${p}<div class="row">\n${(n.children || []).map(c => node(c, d + 1)).join('\n')}\n${p}</div>`;
      case 'column':
      case 'stack':
        return `${p}<div class="stack">\n${(n.children || []).map(c => node(c, d + 1)).join('\n')}\n${p}</div>`;
      case 'grid':
        return `${p}<div class="grid">\n${(n.children || []).map(c => node(c, d + 1)).join('\n')}\n${p}</div>`;
      default:
        return '';
    }
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    .frame { background:${t.background}; display:flex; flex-direction:column; gap:${t.gap}px; padding:32px; font-family:${t.bodyFont},sans-serif; }
    .heading { color:${t.text}; font-size:${t.headingSize}px; font-weight:700; margin:0; }
    .text { color:${t.muted}; font-size:${t.bodySize}px; line-height:1.6; margin:0; }
    .btn { border-radius:${t.radius}px; padding:12px 20px; font-weight:600; text-decoration:none; display:inline-block; }
    .btn.primary { background:${t.primary}; color:#fff; }
    .btn.secondary { background:transparent; color:${t.text}; border:1px solid ${t.text}22; }
    .row { display:flex; gap:${t.gap}px; } .stack { display:flex; flex-direction:column; gap:${t.gap}px; }
    .image { width:100%; border-radius:${t.radius}px; }
  </style>
</head>
<body>
  <section class="frame">
${frame.children.map(c => node(c, 2)).join('\n')}
  </section>
</body>
</html>`;
}

/* ---------- MJML (email) ---------- */
function genMJML(frame, theme) {
  const t = theme;
  const node = n => {
    switch (n.type) {
      case 'heading':
        return `        <mj-text font-size="${t.headingSize}px" font-weight="700" color="${t.text}">${esc(n.text)}</mj-text>`;
      case 'text':
        return `        <mj-text font-size="${t.bodySize}px" line-height="1.6" color="${t.muted}">${esc(n.text)}</mj-text>`;
      case 'button':
        return `        <mj-button background-color="${n.variant === 'primary' ? t.primary : '#ffffff'}" color="${n.variant === 'primary' ? '#ffffff' : t.text}" border-radius="${t.radius}px">${esc(n.text)}</mj-button>`;
      case 'image':
        return `        <mj-image src="placeholder.jpg" alt="${esc(n.alt)}" border-radius="${t.radius}px" />`;
      case 'row':
      case 'column':
      case 'stack':
        return (n.children || []).map(node).join('\n');
      default:
        return '';
    }
  };
  return `<mjml>
  <mj-body background-color="${t.background}">
    <mj-section padding="32px">
      <mj-column>
${frame.children.map(node).join('\n')}
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}
function cn(name) {
  return name.replace(/[^a-z0-9]+/gi, ' ').split(' ').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('') || 'Frame';
}
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'frame';
}
function generate(target, frame, theme) {
  if (!frame) return '';
  if (target === 'react') return genReact(frame, theme);
  if (target === 'angular') return genAngular(frame, theme);
  if (target === 'html') return genHTML(frame, theme);
  if (target === 'mjml') return genMJML(frame, theme);
  return '';
}

/* ---------- Tiny syntax highlighter -> array of React nodes per line ---------- */
function highlight(code, lang) {
  const lines = code.split('\n');
  const tokenize = line => {
    // Split on tokens we care about; very lightweight.
    const out = [];
    let rest = line;
    const patterns = [{
      cls: 'cmt',
      re: /^(\/\/[^\n]*|\/\*[^]*?\*\/|<!--[^]*?-->)/
    }, {
      cls: 'str',
      re: /^("[^"]*"|'[^']*'|`[^`]*`)/
    }, {
      cls: 'tag',
      re: /^(<\/?[A-Za-z][\w-]*|\/?>|<\/)/
    }, {
      cls: 'key',
      re: /^\b(export|function|return|const|let|import|from|class|selector|template|styles|background|color|new)\b/
    }, {
      cls: 'num',
      re: /^\b(\d+(\.\d+)?(px|%)?)\b/
    }];
    let guard = 0;
    while (rest.length && guard++ < 4000) {
      let matched = false;
      for (const p of patterns) {
        const m = rest.match(p.re);
        if (m) {
          out.push({
            cls: p.cls,
            text: m[0]
          });
          rest = rest.slice(m[0].length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        out.push({
          cls: 'fg',
          text: rest[0]
        });
        rest = rest.slice(1);
      }
    }
    // merge adjacent fg chars
    const merged = [];
    for (const tk of out) {
      const last = merged[merged.length - 1];
      if (last && last.cls === tk.cls) last.text += tk.text;else merged.push({
        ...tk
      });
    }
    return merged;
  };
  return lines.map(tokenize);
}
Object.assign(window, {
  EDS_CODE: {
    generate,
    highlight
  }
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/easydesign-editor/codegen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/easydesign-editor/data.jsx
try { (() => {
/* EasyDesign editor — document model, palette catalog, sample content, default theme. */

const uid = () => Math.random().toString(36).slice(2, 9);

// The user's design Theme — independent of the editor chrome palette.
const DEFAULT_THEME = {
  primary: '#4648D4',
  secondary: '#EEF0FF',
  background: '#FFFFFF',
  text: '#161B27',
  muted: '#5B6475',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  headingSize: 40,
  bodySize: 16,
  radius: 8,
  gap: 16
};

// Palette catalog. `email:false` => greyed in Email frames.
const CATALOG = {
  layout: [{
    type: 'stack',
    label: 'Stack',
    icon: 'stack',
    email: true
  }, {
    type: 'row',
    label: 'Row',
    icon: 'row',
    email: true
  }, {
    type: 'column',
    label: 'Column',
    icon: 'column',
    email: true
  }, {
    type: 'grid',
    label: 'Grid',
    icon: 'grid',
    email: false
  }],
  content: [{
    type: 'heading',
    label: 'Heading',
    icon: 'heading',
    email: true
  }, {
    type: 'text',
    label: 'Text',
    icon: 'text',
    email: true
  }, {
    type: 'button',
    label: 'Primary Button',
    icon: 'button',
    email: true,
    variant: 'primary'
  }, {
    type: 'button2',
    label: 'Secondary Button',
    icon: 'button',
    email: true,
    variant: 'secondary'
  }, {
    type: 'image',
    label: 'Image',
    icon: 'image',
    email: true
  }]
};

// Default props for a freshly-dropped node.
function makeNode(type) {
  const base = {
    id: uid(),
    type
  };
  switch (type) {
    case 'heading':
      return {
        ...base,
        type: 'heading',
        text: 'Your headline here',
        align: 'left'
      };
    case 'text':
      return {
        ...base,
        type: 'text',
        text: 'A short paragraph describing what this section is about.',
        align: 'left'
      };
    case 'button':
      return {
        ...base,
        type: 'button',
        text: 'Get Started',
        variant: 'primary'
      };
    case 'button2':
      return {
        ...base,
        type: 'button',
        text: 'Learn More',
        variant: 'secondary'
      };
    case 'image':
      return {
        ...base,
        type: 'image',
        alt: 'Placeholder image',
        src: ''
      };
    case 'row':
      return {
        ...base,
        type: 'row',
        children: []
      };
    case 'column':
      return {
        ...base,
        type: 'column',
        children: []
      };
    case 'stack':
      return {
        ...base,
        type: 'stack',
        children: []
      };
    case 'grid':
      return {
        ...base,
        type: 'grid',
        columns: 2,
        children: []
      };
    default:
      return base;
  }
}
const isContainer = t => ['row', 'column', 'stack', 'grid'].includes(t);

// Sample populated frame matching the reference (Landing Page Header).
function sampleFrame() {
  return {
    id: uid(),
    name: 'Landing Page Header',
    medium: 'web',
    children: [{
      id: uid(),
      type: 'heading',
      text: 'Design the future of your next big project.',
      align: 'left'
    }, {
      id: uid(),
      type: 'text',
      text: 'Experience the ultimate workspace for modern teams. Build beautiful interfaces with precision and ease — no code required.',
      align: 'left'
    }, {
      id: uid(),
      type: 'row',
      children: [{
        id: uid(),
        type: 'button',
        text: 'Get Started',
        variant: 'primary'
      }, {
        id: uid(),
        type: 'button',
        text: 'Learn More',
        variant: 'secondary'
      }]
    }, {
      id: uid(),
      type: 'image',
      alt: 'Product preview',
      src: ''
    }]
  };
}
Object.assign(window, {
  EDS_DATA: {
    uid,
    DEFAULT_THEME,
    CATALOG,
    makeNode,
    isContainer,
    sampleFrame
  }
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/easydesign-editor/data.jsx", error: String((e && e.message) || e) }); }

// ui_kits/easydesign-editor/icons.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* EasyDesign editor — Lucide-style icon set (2px rounded stroke). Shared across kit files. */
const _s = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};
function Svg({
  children,
  size = 18,
  fill,
  ...p
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: size,
    height: size
  }, fill ? {
    fill,
    stroke: 'none'
  } : _s, p), children);
}
const Icon = {
  diamond: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 3l8 8-8 8-8-8 8-8Z"
  })),
  undo: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M9 14L4 9l5-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 9h11a5 5 0 0 1 0 10h-1"
  })),
  redo: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M15 14l5-5-5-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M20 9H9a5 5 0 0 0 0 10h1"
  })),
  search: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m20 20-3.5-3.5"
  })),
  stack: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M4 6h16M4 12h16M4 18h16"
  })),
  row: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "6",
    width: "5",
    height: "12",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "10",
    y: "6",
    width: "5",
    height: "12",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "17",
    y: "6",
    width: "4",
    height: "12",
    rx: "1"
  })),
  column: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "3",
    width: "12",
    height: "5",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "10",
    width: "12",
    height: "5",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "17",
    width: "12",
    height: "4",
    rx: "1"
  })),
  grid: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "4",
    width: "7",
    height: "7",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "13",
    y: "4",
    width: "7",
    height: "7",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "13",
    width: "7",
    height: "7",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "13",
    y: "13",
    width: "7",
    height: "7",
    rx: "1"
  })),
  heading: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M6 4v16M18 4v16M6 12h12"
  })),
  text: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M4 6h16M4 12h16M4 18h10"
  })),
  button: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "8",
    width: "18",
    height: "8",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 12h6"
  })),
  image: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "16",
    rx: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "9.5",
    r: "1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 16-5-5L5 20"
  })),
  code: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "m16 18 6-6-6-6M8 6l-6 6 6 6"
  })),
  layers: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "m12 2 9 5-9 5-9-5 9-5Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3 12 9 5 9-5"
  })),
  settings: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"
  })),
  help: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01"
  })),
  folder: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M4 5h5l2 2h9v11H4z"
  })),
  puzzle: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M9 4a2 2 0 0 1 4 0c0 .7-.3 1 .5 1H17v3.5c0 .8.3.5 1 .5a2 2 0 0 1 0 4c-.7 0-1-.3-1 .5V18h-3.5c-.8 0-.5.3-.5 1a2 2 0 0 1-4 0c0-.7.3-1-.5-1H5v-3.5c0-.8-.3-.5-1-.5a2 2 0 0 1 0-4c.7 0 1 .3 1-.5V5h3.5c.8 0 .5-.3.5-1Z"
  })),
  copy: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
    x: "9",
    y: "9",
    width: "11",
    height: "11",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 15V5a2 2 0 0 1 2-2h8"
  })),
  download: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 3v12M7 11l5 5 5-5M5 21h14"
  })),
  upload: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 21V9M7 13l5-5 5 5M5 3h14"
  })),
  plus: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })),
  trash: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"
  })),
  check: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M5 12l5 5L20 7"
  })),
  hand: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M9 11V5a1.5 1.5 0 0 1 3 0v6M12 11V4a1.5 1.5 0 0 1 3 0v7M15 11V6a1.5 1.5 0 0 1 3 0v9a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.6L9 13"
  })),
  cursor: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M5 3l7 17 2.5-7L21 11 5 3Z"
  })),
  zoomIn: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m20 20-3.5-3.5M11 8v6M8 11h6"
  })),
  zoomOut: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m20 20-3.5-3.5M8 11h6"
  })),
  fit: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"
  })),
  play: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M7 4v16l13-8L7 4Z"
  })),
  web: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "5",
    width: "18",
    height: "12",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 21h8M12 17v4"
  })),
  mail: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "5",
    width: "18",
    height: "14",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3 7 9 6 9-6"
  })),
  alignL: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18M3 12h12M3 18h15"
  })),
  alignC: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18M6 12h12M5 18h14"
  })),
  alignR: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18M9 12h12M6 18h15"
  })),
  alignJ: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18M3 12h18M3 18h18"
  })),
  dots: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "5",
    cy: "12",
    r: "1.6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1.6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "12",
    r: "1.6"
  })),
  sliders: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "15",
    cy: "6",
    r: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "12",
    r: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17",
    cy: "18",
    r: "2"
  })),
  palette: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-.4-.2-.7-.4-1-.2-.2-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7.5",
    cy: "11",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "7.5",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "15.5",
    cy: "8.5",
    r: "1"
  })),
  react: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "2"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "12",
    cy: "12",
    rx: "10",
    ry: "4"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "12",
    cy: "12",
    rx: "10",
    ry: "4",
    transform: "rotate(60 12 12)"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "12",
    cy: "12",
    rx: "10",
    ry: "4",
    transform: "rotate(120 12 12)"
  })),
  share: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "5",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "19",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"
  })),
  sun: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"
  })),
  moon: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z"
  }))
};
Object.assign(window, {
  Icon
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/easydesign-editor/icons.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.PaletteItem = __ds_scope.PaletteItem;

__ds_ns.PanelSection = __ds_scope.PanelSection;

__ds_ns.PanelHeader = __ds_scope.PanelHeader;

__ds_ns.Swatch = __ds_scope.Swatch;

__ds_ns.SwatchChip = __ds_scope.SwatchChip;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

})();
