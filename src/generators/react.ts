// React generator. Walks the IR (src/ir/walk) and emits .tsx component SOURCE
// (a string): a default-exported function component, inline style objects
// (camelCase keys), token-bound values as "var(--…)", className-free markup.
// α (structure + layout properties) comes from the walk; β (leaf CSS vocabulary)
// from leaf-style; only the JSX-source syntax + indentation live here. C = depth.
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

const INDENT = '  ';
function pad(depth: number): string {
  return INDENT.repeat(depth);
}
function reindent(src: string, levels: number): string {
  const prefix = INDENT.repeat(levels);
  return src
    .split('\n')
    .map((line) => (line.length ? prefix + line : line))
    .join('\n');
}
function escapeSingle(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
// Our decls are camelCase identifiers with string values, so this renders a
// React inline-style object literal: { display: 'flex', flexDirection: 'column' }.
// A value that itself contains single quotes (grid-template-areas: 'header' 'main') is wrapped in
// double quotes instead, so it stays clean rather than a backslash-escaped soup.
function styleLiteral(decls: Decl[]): string {
  const entries = decls.map((d) => {
    const v = d.value.includes("'")
      ? `"${d.value.replace(/"/g, '\\"')}"`
      : `'${escapeSingle(d.value)}'`;
    return `${d.prop}: ${v}`;
  });
  return `{ ${entries.join(', ')} }`;
}
function jsxText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
}
function jsxAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// Document-unique ids wiring each tab to its panel (aria-controls/aria-labelledby) + the exclusive-
// Accordion <details name> group; reset per emit invocation (in emitReactSource) for determinism (ADR-0022).
let tabsSeq = 0;
let accSeq = 0;

const reactEmitter: Emitter<string, number> = {
  container(node, shape, children, depth) {
    const p = pad(depth);
    const decls = [...structuralDecls(shape), ...containerDecls(node.style)];
    if (shape.kind === 'flow' && shape.wrapChildren) {
      const cp = pad(depth + 1);
      // Each direct child sits side-by-side with flex:1 (rendered one level deeper).
      const inner = children
        .map((c) => `${cp}<div style={{ flex: 1 }}>\n${reindent(c, 1)}\n${cp}</div>`)
        .join('\n');
      return `${p}<div style={${styleLiteral(decls)}}>\n${inner}\n${p}</div>`;
    }
    return `${p}<div style={${styleLiteral(decls)}}>\n${children.join('\n')}\n${p}</div>`;
  },
  component: {
    RadioGroup(node, children, depth) {
      const p = pad(depth);
      const legend = `${pad(depth + 1)}<legend style={${styleLiteral(legendDecls())}}>${jsxText(node.props.label)}</legend>`;
      return `${p}<fieldset style={${styleLiteral(radioGroupDecls(node.style))}}>\n${legend}\n${children.join('\n')}\n${p}</fieldset>`;
    },
    AppShell(node, children, depth) {
      const p = pad(depth);
      const cp = pad(depth + 1);
      const areas = node.children.map((c) => c.props.area);
      const decls = appShellDecls(areas, node.style);
      // Each child is placed by wrapping it in a grid-area cell div (one level deeper).
      const inner = children
        .map(
          (rendered, i) =>
            `${cp}<div style={${styleLiteral([gridAreaDecl(areas[i] ?? 'main')])}}>\n${reindent(rendered, 1)}\n${cp}</div>`,
        )
        .join('\n');
      return `${p}<div style={${styleLiteral(decls)}}>\n${inner}\n${p}</div>`;
    },
    AppBar(node, children, depth) {
      const p = pad(depth);
      return `${p}<header style={${styleLiteral(appBarDecls(node.style))}}>\n${children.join('\n')}\n${p}</header>`;
    },
    TopNav(node, children, depth) {
      const p = pad(depth);
      return `${p}<nav style={${styleLiteral(navDecls('row', node.style))}}>\n${children.join('\n')}\n${p}</nav>`;
    },
    SideNav(node, children, depth) {
      const p = pad(depth);
      return `${p}<nav style={${styleLiteral(navDecls('column', node.style))}}>\n${children.join('\n')}\n${p}</nav>`;
    },
    Breadcrumb(node, children, depth) {
      const p = pad(depth);
      const ip = pad(depth + 1);
      const items = children
        .map((rendered, i) => {
          const sep =
            i < children.length - 1
              ? `\n${pad(depth + 2)}<span aria-hidden="true" style={${styleLiteral(breadcrumbSeparatorDecls())}}>/</span>`
              : '';
          return `${ip}<li style={${styleLiteral(breadcrumbItemDecls())}}>\n${reindent(rendered, 2)}${sep}\n${ip}</li>`;
        })
        .join('\n');
      return `${p}<nav aria-label="Breadcrumb">\n${ip}<ol style={${styleLiteral(breadcrumbListDecls(node.style))}}>\n${items}\n${ip}</ol>\n${p}</nav>`;
    },
    // A semantic navigation bar (this ADR), NOT role="menubar" — see html.ts MenuBar for why.
    MenuBar(node, children, depth) {
      const p = pad(depth);
      const ip = pad(depth + 1);
      const items = children
        .map(
          (rendered) =>
            `${ip}<li style={${styleLiteral(menuItemDecls())}}>\n${reindent(rendered, 2)}\n${ip}</li>`,
        )
        .join('\n');
      return `${p}<nav aria-label="Menu">\n${ip}<ul style={${styleLiteral(menuBarListDecls(node.style))}}>\n${items}\n${ip}</ul>\n${p}</nav>`;
    },
    // The connector is its OWN aria-hidden <li> so the <ol> holds only <li> children — see html.ts Stepper.
    Stepper(node, children, depth) {
      const p = pad(depth);
      const ip = pad(depth + 1);
      const last = children.length - 1;
      const items = children
        .map((rendered, i) => {
          const connector =
            i < last
              ? `\n${ip}<li aria-hidden="true" style={${styleLiteral(stepperConnectorDecls(node.props.orientation))}} />`
              : '';
          return `${ip}<li style={${styleLiteral(stepItemDecls())}}>\n${reindent(rendered, 2)}\n${ip}</li>${connector}`;
        })
        .join('\n');
      return `${p}<ol style={${styleLiteral(stepperListDecls(node.props.orientation, node.style))}}>\n${items}\n${p}</ol>`;
    },
    ToolBar(node, children, depth) {
      const p = pad(depth);
      return `${p}<div role="toolbar" aria-label="${jsxAttr(node.props.label)}" style={${styleLiteral(toolBarDecls(node.style))}}>\n${children.join('\n')}\n${p}</div>`;
    },
    // DataTable → a semantic <table>; rendered rows partition into <thead>/<tbody> by their `header` flag,
    // nested one level deeper inside the grouping element (ADR-0021). See html.ts DataTable.
    DataTable(node, children, depth) {
      const p = pad(depth);
      const ip = pad(depth + 1);
      const header = children
        .filter((_, i) => node.children[i]?.props.header)
        .map((r) => reindent(r, 1))
        .join('\n');
      const body = children
        .filter((_, i) => !node.children[i]?.props.header)
        .map((r) => reindent(r, 1))
        .join('\n');
      const caption = node.props.caption
        ? `${ip}<caption style={${styleLiteral(tableCaptionDecls())}}>${jsxText(node.props.caption)}</caption>\n`
        : '';
      const thead = header ? `${ip}<thead>\n${header}\n${ip}</thead>\n` : '';
      const tbody = body ? `${ip}<tbody>\n${body}\n${ip}</tbody>\n` : '';
      return `${p}<table style={${styleLiteral(dataTableDecls(node.style))}}>\n${caption}${thead}${tbody}${p}</table>`;
    },
    // TableRow → a <tr> wrapping each rendered cell in <th scope="col"> (header row) or <td> (body row).
    TableRow(node, children, depth) {
      const p = pad(depth);
      const cp = pad(depth + 1);
      const cellStyle = styleLiteral(node.props.header ? tableHeaderCellDecls() : tableCellDecls());
      const cells = children
        .map((c) =>
          node.props.header
            ? `${cp}<th scope="col" style={${cellStyle}}>${c}</th>`
            : `${cp}<td style={${cellStyle}}>${c}</td>`,
        )
        .join('\n');
      return `${p}<tr>\n${cells}\n${p}</tr>`;
    },
    // Pagination → <nav aria-label="Pagination"><ul> of boxed <li> page links (reuses NavLink). See html.ts.
    Pagination(node, children, depth) {
      const p = pad(depth);
      const ip = pad(depth + 1);
      const items = children
        .map(
          (rendered) =>
            `${ip}<li style={${styleLiteral(paginationItemDecls())}}>\n${reindent(rendered, 2)}\n${ip}</li>`,
        )
        .join('\n');
      return `${p}<nav aria-label="Pagination">\n${ip}<ul style={${styleLiteral(paginationListDecls(node.style))}}>\n${items}\n${ip}</ul>\n${p}</nav>`;
    },
    // Tabs → the static accessible snapshot (ADR-0022): a <div role="tablist"> of <button role="tab">
    // (from each panel's `label`) + one <div role="tabpanel"> per rendered panel body; first tab selected,
    // the rest `hidden`. See html.ts Tabs. The panel body is already walked one level deeper, so it nests
    // directly under the tabpanel <div>.
    Tabs(node, children, depth) {
      const { orientation } = node.props;
      const p = pad(depth);
      const ip = pad(depth + 1);
      const bp = pad(depth + 2);
      const base = `tabs-${String(tabsSeq++)}`;
      const tabs = node.children
        .map((panel, i) => {
          const selected = i === 0;
          const roving = selected ? '' : ' tabIndex={-1}';
          return `${bp}<button type="button" role="tab" id="${base}-tab-${String(i)}" aria-selected="${selected ? 'true' : 'false'}" aria-controls="${base}-panel-${String(i)}"${roving} style={${styleLiteral(tabButtonDecls(selected, orientation))}}>${jsxText(panel.props.label)}</button>`;
        })
        .join('\n');
      const ariaOrient = orientation === 'vertical' ? ' aria-orientation="vertical"' : '';
      const tablist = `${ip}<div role="tablist"${ariaOrient} style={${styleLiteral(tabListDecls(orientation))}}>\n${tabs}\n${ip}</div>`;
      const panels = children
        .map((body, i) => {
          const hidden = i === 0 ? '' : ' hidden';
          return `${ip}<div role="tabpanel" id="${base}-panel-${String(i)}" aria-labelledby="${base}-tab-${String(i)}"${hidden} style={${styleLiteral(tabPanelDecls(node.children[i]?.style))}}>\n${body}\n${ip}</div>`;
        })
        .join('\n');
      return `${p}<div style={${styleLiteral(tabsDecls(orientation, node.style))}}>\n${tablist}\n${panels}\n${p}</div>`;
    },
    // TabPanel → just its rendered body (already at the right depth); the parent Tabs wraps it. See html.ts.
    TabPanel(_node, children) {
      return children.join('\n');
    },
    // Accordion → a stack of native <details>/<summary> sections (ADR-0022); each reads its title/open/
    // style from the AccordionItem child, `exclusive` adds a shared <details name>. See html.ts Accordion.
    Accordion(node, children, depth) {
      const p = pad(depth);
      const ip = pad(depth + 1);
      const bp = pad(depth + 2);
      const group = node.props.exclusive ? `acc-${String(accSeq++)}` : '';
      const items = children
        .map((body, i) => {
          const item = node.children[i];
          const open = item?.props.open ? ' open' : '';
          const name = group ? ` name="${group}"` : '';
          const summary = `${bp}<summary style={${styleLiteral(accordionSummaryDecls())}}>${jsxText(item?.props.title ?? '')}</summary>`;
          const panel = `${bp}<div style={${styleLiteral(accordionPanelDecls())}}>\n${reindent(body, 1)}\n${bp}</div>`;
          return `${ip}<details${open}${name} style={${styleLiteral(accordionItemDecls(item?.style))}}>\n${summary}\n${panel}\n${ip}</details>`;
        })
        .join('\n');
      return `${p}<div style={${styleLiteral(accordionDecls(node.style))}}>\n${items}\n${p}</div>`;
    },
    // AccordionItem → just its rendered body; the parent Accordion wraps it in the <details>. See html.ts.
    AccordionItem(_node, children) {
      return children.join('\n');
    },
  },
  leaf: {
    Text(node, depth) {
      const tag = textTag(node.props.variant);
      return `${pad(depth)}<${tag} style={${styleLiteral(textDecls(node))}}>${jsxText(node.props.content)}</${tag}>`;
    },
    Button(node, depth) {
      return `${pad(depth)}<a href="#" style={${styleLiteral(buttonDecls(node))}}>${jsxText(node.props.content)}</a>`;
    },
    Image(node, depth) {
      const { src, alt } = node.props;
      return `${pad(depth)}<img src="${jsxAttr(src)}" alt="${jsxAttr(alt)}" style={${styleLiteral(imageDecls(node))}} />`;
    },
    Radio(node, depth) {
      const input = `<input type="radio" value="${jsxAttr(node.props.value)}" />`;
      return `${pad(depth)}<label style={${styleLiteral(radioDecls())}}>${input} ${jsxText(node.props.label)}</label>`;
    },
    NavLink(node, depth) {
      const current = node.props.active ? ' aria-current="page"' : '';
      return `${pad(depth)}<a href="${jsxAttr(node.props.href)}"${current} style={${styleLiteral(navLinkDecls(node))}}>${jsxText(node.props.label)}</a>`;
    },
    Step(node, depth) {
      const { status, label } = node.props;
      const current = status === 'current' ? ' aria-current="step"' : '';
      const badge = `<span style={${styleLiteral(stepBadgeDecls(status))}}>${status === 'complete' ? '✓' : ''}</span>`;
      const text = `<span style={${styleLiteral(stepLabelDecls(status))}}>${jsxText(label)}</span>`;
      return `${pad(depth)}<div${current} style={${styleLiteral(stepDecls())}}>${badge}${text}</div>`;
    },
    ToolButton(node, depth) {
      const { icon, label } = node.props;
      const svg = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style={${styleLiteral(ICON_SVG_STYLE)}}>${TOOLBAR_ICON_INNER[icon]}</svg>`;
      const text = label ? `<span>${jsxText(label)}</span>` : '';
      const name = label ? '' : ` aria-label="${jsxAttr(TOOL_ICON_LABEL[icon])}"`;
      return `${pad(depth)}<button type="button"${name} style={${styleLiteral(toolButtonDecls())}}>${svg}${text}</button>`;
    },
    Divider(_node, depth) {
      return `${pad(depth)}<hr style={${styleLiteral(dividerDecls())}} />`;
    },
    Spacer(_node, depth) {
      return `${pad(depth)}<div aria-hidden="true" style={${styleLiteral(spacerDecls())}} />`;
    },
    // TableCell → just its escaped text; the parent TableRow wraps it in <th>/<td> (ADR-0021).
    TableCell(node) {
      return jsxText(node.props.content);
    },
  },
  descend(depth) {
    return depth + 1;
  },
};

/** Emit the full .tsx component source for a Frame. */
export function emitReactSource(frame: Frame): string {
  tabsSeq = 0;
  accSeq = 0;
  const body = walkNode<string, number>(frame.root, 2, reactEmitter);
  return (
    `// AUTO-GENERATED by EasyDesign — do not edit by hand.\n` +
    `import * as React from 'react';\n\n` +
    `export default function Card(): React.ReactElement {\n` +
    `  return (\n${body}\n  );\n}\n`
  );
}
