// Angular generator: emits ONE standalone Angular component (.ts, inline template)
// whose template mirrors the web HTML markup. α (structure + layout properties)
// comes from the shared walk; β (the leaf CSS vocabulary) from leaf-style; only the
// inline-CSS template syntax + bottom-up indentation + {{ }} escaping live here.
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
function escAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
// Angular treats `{{` / `}}` as interpolation, so neutralize any literal braces.
function escText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{\{/g, '{{ "{{" }}')
    .replace(/\}\}/g, '{{ "}}" }}');
}
function indent(html: string, pad: string): string {
  return html
    .split('\n')
    .map((line) => (line.length ? pad + line : line))
    .join('\n');
}

// Document-unique ids wiring each tab to its panel + the exclusive-Accordion <details name>; reset per
// emit invocation (in emitAngularSource) so the template stays deterministic for a given tree (ADR-0022).
let tabsSeq = 0;
let accSeq = 0;

// C = void: Angular indentation is built bottom-up via indent(), not depth-threaded.
const angularEmitter: Emitter<string, void> = {
  container(node, shape, children) {
    const styleStr = inlineStyle([...structuralDecls(shape), ...containerDecls(node.style)]);
    const inner =
      shape.kind === 'flow' && shape.wrapChildren
        ? children.map((c) => `<div style="flex:1">\n${indent(c, '  ')}\n</div>`).join('\n')
        : children.join('\n');
    return `<div style="${styleStr}">\n${indent(inner, '  ')}\n</div>`;
  },
  component: {
    RadioGroup(node, children) {
      const legend = `<legend style="${inlineStyle(legendDecls())}">${escText(node.props.label)}</legend>`;
      const inner = [legend, ...children].join('\n');
      return `<fieldset style="${inlineStyle(radioGroupDecls(node.style))}">\n${indent(inner, '  ')}\n</fieldset>`;
    },
    AppShell(node, children) {
      const areas = node.children.map((c) => c.props.area);
      const styleStr = inlineStyle(appShellDecls(areas, node.style));
      const cells = children
        .map(
          (rendered, i) =>
            `<div style="${inlineStyle([gridAreaDecl(areas[i] ?? 'main')])}">\n${indent(rendered, '  ')}\n</div>`,
        )
        .join('\n');
      return `<div style="${styleStr}">\n${indent(cells, '  ')}\n</div>`;
    },
    AppBar(node, children) {
      const inner = children.join('\n');
      return `<header style="${inlineStyle(appBarDecls(node.style))}">\n${indent(inner, '  ')}\n</header>`;
    },
    TopNav(node, children) {
      const inner = children.join('\n');
      return `<nav style="${inlineStyle(navDecls('row', node.style))}">\n${indent(inner, '  ')}\n</nav>`;
    },
    SideNav(node, children) {
      const inner = children.join('\n');
      return `<nav style="${inlineStyle(navDecls('column', node.style))}">\n${indent(inner, '  ')}\n</nav>`;
    },
    Breadcrumb(node, children) {
      const items = children
        .map((rendered, i) => {
          const sep =
            i < children.length - 1
              ? `\n<span aria-hidden="true" style="${inlineStyle(breadcrumbSeparatorDecls())}">/</span>`
              : '';
          return `<li style="${inlineStyle(breadcrumbItemDecls())}">\n${indent(`${rendered}${sep}`, '  ')}\n</li>`;
        })
        .join('\n');
      const ol = `<ol style="${inlineStyle(breadcrumbListDecls(node.style))}">\n${indent(items, '  ')}\n</ol>`;
      return `<nav aria-label="Breadcrumb">\n${indent(ol, '  ')}\n</nav>`;
    },
    // A semantic navigation bar (this ADR), NOT role="menubar" — see html.ts MenuBar for why.
    MenuBar(node, children) {
      const items = children
        .map(
          (rendered) =>
            `<li style="${inlineStyle(menuItemDecls())}">\n${indent(rendered, '  ')}\n</li>`,
        )
        .join('\n');
      const ul = `<ul style="${inlineStyle(menuBarListDecls(node.style))}">\n${indent(items, '  ')}\n</ul>`;
      return `<nav aria-label="Menu">\n${indent(ul, '  ')}\n</nav>`;
    },
    // The connector is its OWN aria-hidden <li> so the <ol> holds only <li> children — see html.ts Stepper.
    Stepper(node, children) {
      const last = children.length - 1;
      const items = children
        .map((rendered, i) => {
          const connector =
            i < last
              ? `\n<li aria-hidden="true" style="${inlineStyle(stepperConnectorDecls(node.props.orientation))}"></li>`
              : '';
          return `<li style="${inlineStyle(stepItemDecls())}">\n${indent(rendered, '  ')}\n</li>${connector}`;
        })
        .join('\n');
      return `<ol style="${inlineStyle(stepperListDecls(node.props.orientation, node.style))}">\n${indent(items, '  ')}\n</ol>`;
    },
    ToolBar(node, children) {
      const inner = children.join('\n');
      return `<div role="toolbar" aria-label="${escAttr(node.props.label)}" style="${inlineStyle(toolBarDecls(node.style))}">\n${indent(inner, '  ')}\n</div>`;
    },
    // DataTable → a semantic <table>; rows partition into <thead>/<tbody> by their `header` flag (ADR-0021).
    DataTable(node, children) {
      const header = children.filter((_, i) => node.children[i]?.props.header).join('\n');
      const body = children.filter((_, i) => !node.children[i]?.props.header).join('\n');
      const parts: string[] = [];
      if (node.props.caption) {
        parts.push(
          `<caption style="${inlineStyle(tableCaptionDecls())}">${escText(node.props.caption)}</caption>`,
        );
      }
      if (header) parts.push(`<thead>\n${indent(header, '  ')}\n</thead>`);
      if (body) parts.push(`<tbody>\n${indent(body, '  ')}\n</tbody>`);
      const inner = parts.join('\n');
      return `<table style="${inlineStyle(dataTableDecls(node.style))}">\n${indent(inner, '  ')}\n</table>`;
    },
    // TableRow → a <tr> wrapping each rendered cell in <th scope="col"> (header row) or <td> (body row).
    TableRow(node, children) {
      const cellStyle = inlineStyle(node.props.header ? tableHeaderCellDecls() : tableCellDecls());
      const cells = children
        .map((c) =>
          node.props.header
            ? `<th scope="col" style="${cellStyle}">${c}</th>`
            : `<td style="${cellStyle}">${c}</td>`,
        )
        .join('\n');
      return `<tr>\n${indent(cells, '  ')}\n</tr>`;
    },
    // Pagination → <nav aria-label="Pagination"><ul> of boxed <li> page links (reuses NavLink). See html.ts.
    Pagination(node, children) {
      const items = children
        .map(
          (rendered) =>
            `<li style="${inlineStyle(paginationItemDecls())}">\n${indent(rendered, '  ')}\n</li>`,
        )
        .join('\n');
      const ul = `<ul style="${inlineStyle(paginationListDecls(node.style))}">\n${indent(items, '  ')}\n</ul>`;
      return `<nav aria-label="Pagination">\n${indent(ul, '  ')}\n</nav>`;
    },
    // Tabs → the static accessible snapshot (ADR-0022): a <div role="tablist"> of <button role="tab">
    // (from each panel's `label`) + one <div role="tabpanel"> per rendered panel body; first tab selected,
    // the rest `hidden`. See html.ts Tabs.
    Tabs(node, children) {
      const { orientation } = node.props;
      const base = `tabs-${String(tabsSeq++)}`;
      const tabs = node.children
        .map((panel, i) => {
          const selected = i === 0;
          const roving = selected ? '' : ' tabindex="-1"';
          return `<button type="button" role="tab" id="${base}-tab-${String(i)}" aria-selected="${selected ? 'true' : 'false'}" aria-controls="${base}-panel-${String(i)}"${roving} style="${inlineStyle(tabButtonDecls(selected, orientation))}">${escText(panel.props.label)}</button>`;
        })
        .join('\n');
      const ariaOrient = orientation === 'vertical' ? ' aria-orientation="vertical"' : '';
      const tablist = `<div role="tablist"${ariaOrient} style="${inlineStyle(tabListDecls(orientation))}">\n${indent(tabs, '  ')}\n</div>`;
      const panels = children
        .map((body, i) => {
          const hidden = i === 0 ? '' : ' hidden';
          return `<div role="tabpanel" id="${base}-panel-${String(i)}" aria-labelledby="${base}-tab-${String(i)}"${hidden} style="${inlineStyle(tabPanelDecls(node.children[i]?.style))}">\n${indent(body, '  ')}\n</div>`;
        })
        .join('\n');
      const inner = `${tablist}\n${panels}`;
      return `<div style="${inlineStyle(tabsDecls(orientation, node.style))}">\n${indent(inner, '  ')}\n</div>`;
    },
    // TabPanel → just its rendered body; the parent Tabs wraps it in the <div role="tabpanel">. See html.ts.
    TabPanel(_node, children) {
      return children.join('\n');
    },
    // Accordion → a stack of native <details>/<summary> sections (ADR-0022); each reads its title/open/
    // style from the AccordionItem child, `exclusive` adds a shared <details name>. See html.ts Accordion.
    Accordion(node, children) {
      const group = node.props.exclusive ? `acc-${String(accSeq++)}` : '';
      const items = children
        .map((body, i) => {
          const item = node.children[i];
          const open = item?.props.open ? ' open' : '';
          const name = group ? ` name="${group}"` : '';
          const summary = `<summary style="${inlineStyle(accordionSummaryDecls())}">${escText(item?.props.title ?? '')}</summary>`;
          const panel = `<div style="${inlineStyle(accordionPanelDecls())}">\n${indent(body, '  ')}\n</div>`;
          const detailsInner = `${summary}\n${panel}`;
          return `<details${open}${name} style="${inlineStyle(accordionItemDecls(item?.style))}">\n${indent(detailsInner, '  ')}\n</details>`;
        })
        .join('\n');
      return `<div style="${inlineStyle(accordionDecls(node.style))}">\n${indent(items, '  ')}\n</div>`;
    },
    // AccordionItem → just its rendered body; the parent Accordion wraps it in the <details>. See html.ts.
    AccordionItem(_node, children) {
      return children.join('\n');
    },
  },
  leaf: {
    Text(node) {
      const tag = textTag(node.props.variant);
      return `<${tag} style="${inlineStyle(textDecls(node))}">${escText(node.props.content)}</${tag}>`;
    },
    Button(node) {
      // A bare <a> is not a valid link — match the html/react targets' href="#" (cross-target parity).
      return `<a href="#" style="${inlineStyle(buttonDecls(node))}">${escText(node.props.content)}</a>`;
    },
    Image(node) {
      const { src, alt } = node.props;
      return `<img src="${escAttr(src)}" alt="${escAttr(alt)}" style="${inlineStyle(imageDecls(node))}">`;
    },
    Radio(node) {
      const input = `<input type="radio" value="${escAttr(node.props.value)}">`;
      return `<label style="${inlineStyle(radioDecls())}">${input}${escText(node.props.label)}</label>`;
    },
    NavLink(node) {
      const current = node.props.active ? ' aria-current="page"' : '';
      return `<a href="${escAttr(node.props.href)}"${current} style="${inlineStyle(navLinkDecls(node))}">${escText(node.props.label)}</a>`;
    },
    Step(node) {
      const { status, label } = node.props;
      const current = status === 'current' ? ' aria-current="step"' : '';
      const badge = `<span style="${inlineStyle(stepBadgeDecls(status))}">${status === 'complete' ? '✓' : ''}</span>`;
      const text = `<span style="${inlineStyle(stepLabelDecls(status))}">${escText(label)}</span>`;
      return `<div${current} style="${inlineStyle(stepDecls())}">${badge}${text}</div>`;
    },
    ToolButton(node) {
      const { icon, label } = node.props;
      const svg = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="${inlineStyle(ICON_SVG_STYLE)}">${TOOLBAR_ICON_INNER[icon]}</svg>`;
      const text = label ? `<span>${escText(label)}</span>` : '';
      const name = label ? '' : ` aria-label="${escAttr(TOOL_ICON_LABEL[icon])}"`;
      return `<button type="button"${name} style="${inlineStyle(toolButtonDecls())}">${svg}${text}</button>`;
    },
    Divider() {
      return `<hr style="${inlineStyle(dividerDecls())}">`;
    },
    Spacer() {
      return `<div aria-hidden="true" style="${inlineStyle(spacerDecls())}"></div>`;
    },
    // TableCell → just its escaped text; the parent TableRow wraps it in <th>/<td> (ADR-0021).
    TableCell(node) {
      return escText(node.props.content);
    },
  },
  descend() {
    /* void context: indentation is bottom-up */
  },
};

/** Emit ONE standalone Angular component source as a string. */
export function emitAngularSource(frame: Frame): string {
  tabsSeq = 0;
  accSeq = 0;
  const indentedTemplate = indent(
    walkNode<string, void>(frame.root, undefined, angularEmitter),
    '    ',
  );
  return `// AUTO-GENERATED by EasyDesign — do not edit by hand.
// One standalone Angular component mirroring the web markup.
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ed-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
${indentedTemplate}
  \`,
})
export class CardComponent {}
`;
}
