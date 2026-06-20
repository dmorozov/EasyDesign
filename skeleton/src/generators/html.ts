// Static HTML generator for the EasyDesign walking skeleton.
// Walks the IR (src/ir.ts) per CONTRACT.md's "Node -> web output" table,
// emitting semantic HTML with inline styles that reference CSS vars (var(--...)).

import type { Frame, Node, StyleMap } from '../ir.js';

// Token ref "color.surface" -> CSS var(--color-surface). Dot-path -> kebab, "--"-prefixed.
function tokenToVar(ref: string): string {
  return `var(--${ref.replace(/\./g, '-')})`;
}

// Map a Node's optional style map (token refs) onto concrete CSS declarations.
// The CONTRACT only binds these style keys for the layout containers.
const STYLE_PROP_TO_CSS: Record<string, string> = {
  background: 'background',
  padding: 'padding',
  borderRadius: 'border-radius',
  gap: 'gap',
};

function styleMapToDecls(style: StyleMap | undefined): string[] {
  if (!style) return [];
  const decls: string[] = [];
  for (const [key, ref] of Object.entries(style)) {
    const cssProp = STYLE_PROP_TO_CSS[key];
    if (!cssProp) continue; // ignore keys with no defined web mapping
    decls.push(`${cssProp}:${tokenToVar(ref)}`);
  }
  return decls;
}

// Minimal HTML-attribute escaping so token/literal values stay valid markup.
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Escape text content for HTML body.
function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function emitNode(node: Node): string {
  switch (node.type) {
    case 'Stack': {
      const decls = ['display:flex', 'flex-direction:column', ...styleMapToDecls(node.style)];
      const inner = node.children.map(emitNode).join('');
      return `<div style="${decls.join('; ')}">${inner}</div>`;
    }
    case 'Column': {
      const decls = ['display:flex', 'flex-direction:column', ...styleMapToDecls(node.style)];
      const inner = node.children.map(emitNode).join('');
      return `<div style="${decls.join('; ')}">${inner}</div>`;
    }
    case 'Row': {
      const decls = ['display:flex', 'flex-direction:row', ...styleMapToDecls(node.style)];
      // Each direct child wrapped so it sits side-by-side with flex:1.
      const inner = node.children
        .map((child) => `<div style="flex:1">${emitNode(child)}</div>`)
        .join('');
      return `<div style="${decls.join('; ')}">${inner}</div>`;
    }
    case 'Text': {
      const content = escapeText(node.props.content);
      if (node.props.variant === 'h2') {
        return `<h2 style="margin:0; font-family:var(--font-family); font-size:var(--font-h2); line-height:1.25; color:var(--color-text); font-weight:700">${content}</h2>`;
      }
      return `<p style="margin:0; font-family:var(--font-family); font-size:var(--font-body); line-height:var(--font-line); color:var(--color-text)">${content}</p>`;
    }
    case 'Button': {
      const content = escapeText(node.props.content);
      const base =
        'display:inline-block; text-align:center; text-decoration:none; padding:var(--space-sm) var(--space-md); border-radius:var(--radius-lg); font-family:var(--font-family); font-size:var(--font-body); font-weight:600';
      if (node.props.variant === 'primary') {
        const style = `${base}; background:var(--color-brand); color:var(--color-on-brand)`;
        return `<a href="#" style="${style}">${content}</a>`;
      }
      const style = `${base}; background:transparent; color:var(--color-brand); border:1px solid var(--color-brand)`;
      return `<a href="#" style="${style}">${content}</a>`;
    }
    case 'Image': {
      const { src, alt, width } = node.props;
      const maxWidth = width !== undefined ? `; max-width:${width}px` : '';
      const style = `display:block; width:100%${maxWidth}; height:auto; border-radius:var(--radius-lg)`;
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="${style}">`;
    }
  }
}

// Walk a Frame's root node and return the rendered HTML fragment.
export function emitHTML(frame: Frame): string {
  return emitNode(frame.root);
}
