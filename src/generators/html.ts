// Static HTML generator. Walks the IR (src/ir/walk) emitting semantic HTML with
// inline styles that reference CSS vars. α (structure + layout properties) comes
// from the shared walk; β (the leaf CSS vocabulary) from leaf-style; only the
// inline-CSS syntax (dash-case + ';'-join) lives here.
import { type Frame } from '../ir/types';
import { type Emitter, walkNode } from '../ir/walk';

import {
  buttonDecls,
  containerDecls,
  type Decl,
  imageDecls,
  legendDecls,
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
  },
  descend() {
    /* void context: nothing to thread */
  },
};

/** Walk a Frame's root node and return the rendered HTML fragment. */
export function emitHTML(frame: Frame): string {
  return walkNode<string, void>(frame.root, undefined, htmlEmitter);
}
