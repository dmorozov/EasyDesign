// Static HTML generator. Walks the IR (src/ir/walk) emitting semantic HTML with
// inline styles that reference CSS vars. α (structure + layout properties) comes
// from the shared walk; β (the leaf CSS vocabulary) from leaf-style; only the
// inline-CSS syntax (dash-case + ';'-join) lives here.
import { type Frame } from '../ir/types';
import { type Emitter, walkNode } from '../ir/walk';

import {
  accordionDecls,
  accordionItemDecls,
  accordionPanelDecls,
  accordionSummaryDecls,
  appBarDecls,
  appShellDecls,
  breadcrumbItemDecls,
  breadcrumbListDecls,
  breadcrumbSeparatorDecls,
  buttonDecls,
  containerDecls,
  dataTableDecls,
  type Decl,
  dividerDecls,
  gridAreaDecl,
  ICON_SVG_STYLE,
  imageDecls,
  legendDecls,
  menuBarListDecls,
  menuItemDecls,
  navDecls,
  navLinkDecls,
  paginationItemDecls,
  paginationListDecls,
  radioDecls,
  radioGroupDecls,
  spacerDecls,
  stepBadgeDecls,
  stepDecls,
  stepItemDecls,
  stepLabelDecls,
  stepperConnectorDecls,
  stepperListDecls,
  structuralDecls,
  tabButtonDecls,
  tableCaptionDecls,
  tableCellDecls,
  tableHeaderCellDecls,
  tabListDecls,
  tabPanelDecls,
  tabsDecls,
  textDecls,
  textTag,
  TOOL_ICON_LABEL,
  TOOLBAR_ICON_INNER,
  toolBarDecls,
  toolButtonDecls,
} from './leaf-style';

function dash(prop: string): string {
  return prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
function inlineStyle(decls: Decl[]): string {
  return decls.map((d) => `${dash(d.prop)}:${d.value}`).join('; ');
}
function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Tabs need document-unique DOM ids to wire each tab to its panel (aria-controls/aria-labelledby), and an
// exclusive Accordion needs a shared <details name>. These counters mint those ids; they are reset per
// emit invocation (in emitHTML) so the output stays deterministic for a given tree (ADR-0022).
let tabsSeq = 0;
let accSeq = 0;

// C = void: html has no pretty-printing, so there is no context to thread.
const htmlEmitter: Emitter<string, void> = {
  container(node, shape, children) {
    const decls = [...structuralDecls(shape), ...containerDecls(node.style)];
    const inner =
      shape.kind === 'flow' && shape.wrapChildren
        ? children.map((c) => `<div style="flex:1">${c}</div>`).join('')
        : children.join('');
    return `<div style="${inlineStyle(decls)}">${inner}</div>`;
  },
  component: {
    // RadioGroup → a semantic <fieldset>/<legend> wrapping the rendered radios (RP-10). The canvas uses
    // a real React-Aria RadioGroup; the exports emit plain semantic markup (consistent with the leaves).
    RadioGroup(node, children) {
      const legend = `<legend style="${inlineStyle(legendDecls())}">${escapeText(node.props.label)}</legend>`;
      return `<fieldset style="${inlineStyle(radioGroupDecls(node.style))}">${legend}${children.join('')}</fieldset>`;
    },
    // AppShell → a CSS-grid <div> whose template is computed from its regions; each Region child is
    // placed by wrapping it in a `grid-area` cell div (ADR-0017).
    AppShell(node, children) {
      const areas = node.children.map((c) => c.props.area);
      const decls = appShellDecls(areas, node.style);
      const cells = children
        .map(
          (rendered, i) =>
            `<div style="${inlineStyle([gridAreaDecl(areas[i] ?? 'main')])}">${rendered}</div>`,
        )
        .join('');
      return `<div style="${inlineStyle(decls)}">${cells}</div>`;
    },
    // AppBar → a semantic <header> bar (flex row, brand left / actions right). Open children (ADR-0019).
    AppBar(node, children) {
      return `<header style="${inlineStyle(appBarDecls(node.style))}">${children.join('')}</header>`;
    },
    // TopNav → a semantic horizontal <nav> (ADR-0019). The NavLink children are already rendered <a>s.
    TopNav(node, children) {
      return `<nav style="${inlineStyle(navDecls('row', node.style))}">${children.join('')}</nav>`;
    },
    // SideNav → a vertical <nav> (same slot rule, stacked).
    SideNav(node, children) {
      return `<nav style="${inlineStyle(navDecls('column', node.style))}">${children.join('')}</nav>`;
    },
    // Breadcrumb → <nav aria-label="Breadcrumb"><ol> of crumbs, a muted "/" between each (ADR-0019).
    Breadcrumb(node, children) {
      const items = children
        .map((rendered, i) => {
          const sep =
            i < children.length - 1
              ? `<span aria-hidden="true" style="${inlineStyle(breadcrumbSeparatorDecls())}">/</span>`
              : '';
          return `<li style="${inlineStyle(breadcrumbItemDecls())}">${rendered}${sep}</li>`;
        })
        .join('');
      return `<nav aria-label="Breadcrumb"><ol style="${inlineStyle(breadcrumbListDecls(node.style))}">${items}</ol></nav>`;
    },
    // MenuBar → a semantic navigation bar: <nav aria-label><ul> of <li> links styled as a full bar (this
    // ADR), distinct from TopNav's bare inline links. NOT role="menubar": that ARIA widget pattern is for
    // application command menus (it requires role="menuitem" children + roving-tabindex/arrow-key handling),
    // wrong for real <a href> navigation links — these stay links, the current one carrying aria-current.
    MenuBar(node, children) {
      const items = children
        .map((rendered) => `<li style="${inlineStyle(menuItemDecls())}">${rendered}</li>`)
        .join('');
      return `<nav aria-label="Menu"><ul style="${inlineStyle(menuBarListDecls(node.style))}">${items}</ul></nav>`;
    },
    // Stepper → a semantic <ol> of steps with a connector line between each (this ADR). Each Step child is
    // already rendered (badge + label); wrap it in <li>. The connector is its OWN aria-hidden <li> (not a
    // <span>) so the <ol> contains only <li> children — valid list markup — while staying an <ol>-level
    // flex sibling that grows to fill the gap.
    Stepper(node, children) {
      const last = children.length - 1;
      const items = children
        .map((rendered, i) => {
          const connector =
            i < last
              ? `<li aria-hidden="true" style="${inlineStyle(stepperConnectorDecls(node.props.orientation))}"></li>`
              : '';
          return `<li style="${inlineStyle(stepItemDecls())}">${rendered}</li>${connector}`;
        })
        .join('');
      return `<ol style="${inlineStyle(stepperListDecls(node.props.orientation, node.style))}">${items}</ol>`;
    },
    // ToolBar → a <div role="toolbar"> of icon/label buttons (this ADR); `label` is its accessible name.
    ToolBar(node, children) {
      return `<div role="toolbar" aria-label="${escapeAttr(node.props.label)}" style="${inlineStyle(toolBarDecls(node.style))}">${children.join('')}</div>`;
    },
    // DataTable → a semantic <table> (ADR-0021). The rendered TableRow children are partitioned into
    // <thead>/<tbody> by their own `header` flag (the single source of truth); a non-empty caption gives
    // the table its accessible name. Email reaches the same structure through MJML's <mj-table>.
    DataTable(node, children) {
      const headerRows = children.filter((_, i) => node.children[i]?.props.header).join('');
      const bodyRows = children.filter((_, i) => !node.children[i]?.props.header).join('');
      const caption = node.props.caption
        ? `<caption style="${inlineStyle(tableCaptionDecls())}">${escapeText(node.props.caption)}</caption>`
        : '';
      const thead = headerRows ? `<thead>${headerRows}</thead>` : '';
      const tbody = bodyRows ? `<tbody>${bodyRows}</tbody>` : '';
      return `<table style="${inlineStyle(dataTableDecls(node.style))}">${caption}${thead}${tbody}</table>`;
    },
    // TableRow → a <tr> that WRAPS each already-rendered cell in <th scope="col"> (header row) or <td>
    // (body row) — the same wrap-the-children pattern Stepper uses for <li>. The cell leaf only renders
    // its text, so the th/td decision lives in exactly one place.
    TableRow(node, children) {
      const cellStyle = inlineStyle(node.props.header ? tableHeaderCellDecls() : tableCellDecls());
      const cells = children
        .map((c) =>
          node.props.header
            ? `<th scope="col" style="${cellStyle}">${c}</th>`
            : `<td style="${cellStyle}">${c}</td>`,
        )
        .join('');
      return `<tr>${cells}</tr>`;
    },
    // Pagination → a semantic <nav aria-label="Pagination"><ul> of boxed page links (ADR-0021). Reuses the
    // NavLink leaf (already rendered <a aria-current>); this only adds the bar + the boxed <li> per page.
    Pagination(node, children) {
      const items = children
        .map((rendered) => `<li style="${inlineStyle(paginationItemDecls())}">${rendered}</li>`)
        .join('');
      return `<nav aria-label="Pagination"><ul style="${inlineStyle(paginationListDecls(node.style))}">${items}</ul></nav>`;
    },
    // Tabs → a static accessible snapshot (ADR-0022): a <div role="tablist"> of <button role="tab"> built
    // from each panel's `label` (the DataTable "read your children's props" pattern) + one <div
    // role="tabpanel"> per rendered panel body. The FIRST tab is selected; the rest carry `hidden` and
    // tabindex="-1" (roving). Ids wire each tab↔panel. The canvas is interactive (React Aria); switching
    // in this static export is a deferred enhancement.
    Tabs(node, children) {
      const { orientation } = node.props;
      const base = `tabs-${String(tabsSeq++)}`;
      const tabs = node.children
        .map((panel, i) => {
          const selected = i === 0;
          const roving = selected ? '' : ' tabindex="-1"';
          return `<button type="button" role="tab" id="${base}-tab-${String(i)}" aria-selected="${selected ? 'true' : 'false'}" aria-controls="${base}-panel-${String(i)}"${roving} style="${inlineStyle(tabButtonDecls(selected, orientation))}">${escapeText(panel.props.label)}</button>`;
        })
        .join('');
      const ariaOrient = orientation === 'vertical' ? ' aria-orientation="vertical"' : '';
      const tablist = `<div role="tablist"${ariaOrient} style="${inlineStyle(tabListDecls(orientation))}">${tabs}</div>`;
      const panels = children
        .map((body, i) => {
          const hidden = i === 0 ? '' : ' hidden';
          return `<div role="tabpanel" id="${base}-panel-${String(i)}" aria-labelledby="${base}-tab-${String(i)}"${hidden} style="${inlineStyle(tabPanelDecls(node.children[i]?.style))}">${body}</div>`;
        })
        .join('');
      return `<div style="${inlineStyle(tabsDecls(orientation, node.style))}">${tablist}${panels}</div>`;
    },
    // TabPanel → just its rendered body content; the parent Tabs wraps it in the <div role="tabpanel">
    // (which owns the id/aria/hidden), exactly as TableRow's cells are wrapped by their DataTable.
    TabPanel(_node, children) {
      return children.join('');
    },
    // Accordion → a stack of native <details>/<summary> sections (ADR-0022) — interactive with zero JS,
    // identical on the canvas and in all three web targets. Each section reads its title/open/style from
    // the AccordionItem child; `exclusive` adds a shared <details name> so opening one closes the others.
    Accordion(node, children) {
      const group = node.props.exclusive ? `acc-${String(accSeq++)}` : '';
      const items = children
        .map((body, i) => {
          const item = node.children[i];
          const open = item?.props.open ? ' open' : '';
          const name = group ? ` name="${group}"` : '';
          const summary = `<summary style="${inlineStyle(accordionSummaryDecls())}">${escapeText(item?.props.title ?? '')}</summary>`;
          const panel = `<div style="${inlineStyle(accordionPanelDecls())}">${body}</div>`;
          return `<details${open}${name} style="${inlineStyle(accordionItemDecls(item?.style))}">${summary}${panel}</details>`;
        })
        .join('');
      return `<div style="${inlineStyle(accordionDecls(node.style))}">${items}</div>`;
    },
    // AccordionItem → just its rendered body content; the parent Accordion wraps it in the <details>.
    AccordionItem(_node, children) {
      return children.join('');
    },
  },
  leaf: {
    Text(node) {
      const tag = textTag(node.props.variant);
      return `<${tag} style="${inlineStyle(textDecls(node))}">${escapeText(node.props.content)}</${tag}>`;
    },
    Button(node) {
      return `<a href="#" style="${inlineStyle(buttonDecls(node))}">${escapeText(node.props.content)}</a>`;
    },
    Image(node) {
      const { src, alt } = node.props;
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="${inlineStyle(imageDecls(node))}">`;
    },
    Radio(node) {
      const input = `<input type="radio" value="${escapeAttr(node.props.value)}">`;
      return `<label style="${inlineStyle(radioDecls())}">${input}${escapeText(node.props.label)}</label>`;
    },
    // NavLink → a semantic <a href>; the current page carries aria-current (ADR-0019).
    NavLink(node) {
      const current = node.props.active ? ' aria-current="page"' : '';
      return `<a href="${escapeAttr(node.props.href)}"${current} style="${inlineStyle(navLinkDecls(node))}">${escapeText(node.props.label)}</a>`;
    },
    // Step → a status badge (a check when complete, else a ring) + the label; aria-current marks current.
    Step(node) {
      const { status, label } = node.props;
      const current = status === 'current' ? ' aria-current="step"' : '';
      const badge = `<span style="${inlineStyle(stepBadgeDecls(status))}">${status === 'complete' ? '✓' : ''}</span>`;
      const text = `<span style="${inlineStyle(stepLabelDecls(status))}">${escapeText(label)}</span>`;
      return `<div${current} style="${inlineStyle(stepDecls())}">${badge}${text}</div>`;
    },
    // ToolButton → an icon, plus the label text when present (an empty label → an icon-only button, which
    // takes the icon's HUMAN name as its accessible label — TOOL_ICON_LABEL, not the developer key). The
    // SVG presentation is a style so it serializes here and as a JSX object in the React target from one
    // inner-markup source (toolbar-icons.ts).
    ToolButton(node) {
      const { icon, label } = node.props;
      const svg = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="${inlineStyle(ICON_SVG_STYLE)}">${TOOLBAR_ICON_INNER[icon]}</svg>`;
      const text = label ? `<span>${escapeText(label)}</span>` : '';
      const name = label ? '' : ` aria-label="${escapeAttr(TOOL_ICON_LABEL[icon])}"`;
      return `<button type="button"${name} style="${inlineStyle(toolButtonDecls())}">${svg}${text}</button>`;
    },
    // Divider → a semantic horizontal rule; Spacer → a flexible, presentational gap (this ADR).
    Divider() {
      return `<hr style="${inlineStyle(dividerDecls())}">`;
    },
    Spacer() {
      return `<div aria-hidden="true" style="${inlineStyle(spacerDecls())}"></div>`;
    },
    // TableCell → just its escaped text; the parent TableRow wraps it in <th>/<td> (ADR-0021).
    TableCell(node) {
      return escapeText(node.props.content);
    },
  },
  descend() {
    /* void context: nothing to thread */
  },
};

/** Walk a Frame's root node and return the rendered HTML fragment. */
export function emitHTML(frame: Frame): string {
  tabsSeq = 0;
  accSeq = 0;
  return walkNode<string, void>(frame.root, undefined, htmlEmitter);
}
