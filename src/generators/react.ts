// React generator. Walks the IR (src/ir/walk) and emits .tsx component SOURCE
// (a string): a default-exported function component, inline style objects
// (camelCase keys), token-bound values as "var(--…)", className-free markup.
// α (structure + layout properties) comes from the walk; β (leaf CSS vocabulary)
// from leaf-style; only the JSX-source syntax + indentation live here. C = depth.
import { type Frame } from '../ir/types';
import { type Emitter, walkNode } from '../ir/walk';

import {
  appBarDecls,
  appShellDecls,
  breadcrumbItemDecls,
  breadcrumbListDecls,
  breadcrumbSeparatorDecls,
  buttonDecls,
  containerDecls,
  type Decl,
  gridAreaDecl,
  imageDecls,
  legendDecls,
  navDecls,
  navLinkDecls,
  radioDecls,
  radioGroupDecls,
  structuralDecls,
  textDecls,
  textTag,
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
  },
  descend(depth) {
    return depth + 1;
  },
};

/** Emit the full .tsx component source for a Frame. */
export function emitReactSource(frame: Frame): string {
  const body = walkNode<string, number>(frame.root, 2, reactEmitter);
  return (
    `// AUTO-GENERATED by EasyDesign — do not edit by hand.\n` +
    `import * as React from 'react';\n\n` +
    `export default function Card(): React.ReactElement {\n` +
    `  return (\n${body}\n  );\n}\n`
  );
}
