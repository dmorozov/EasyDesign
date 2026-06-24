// Static HTML generator. Walks the IR (src/ir/walk) emitting semantic HTML with
// inline styles that reference CSS vars. α (structure + layout properties) comes
// from the shared walk; β (the leaf CSS vocabulary) from leaf-style; only the
// inline-CSS syntax (dash-case + ';'-join) lives here.
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
  },
  descend() {
    /* void context: nothing to thread */
  },
};

/** Walk a Frame's root node and return the rendered HTML fragment. */
export function emitHTML(frame: Frame): string {
  return walkNode<string, void>(frame.root, undefined, htmlEmitter);
}
