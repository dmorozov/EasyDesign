// Angular generator: emits ONE standalone Angular component (.ts, inline template)
// whose template mirrors the web HTML markup defined in CONTRACT.md.
//
// The sample (src/ir.ts `sampleCard`) is fully static, so we render a literal
// inline template string — no @if/@for needed. Modern Angular (v17+) makes
// components standalone by default, so no NgModule and no `standalone: true`.

import type { Frame, Node, StyleMap } from '../ir.js';

// token ref "color.surface" -> CSS var(--color-surface). Dot-path -> kebab.
function cssVar(ref: string): string {
  return `var(--${ref.replace(/\./g, '-')})`;
}

// Render a StyleMap as `prop:var(--token); ...` declarations (token-bound props).
// Keys are camelCase IR names mapped to CSS property names.
const STYLE_PROP_CSS: Record<string, string> = {
  background: 'background',
  padding: 'padding',
  borderRadius: 'border-radius',
  gap: 'gap',
};

function styleMapDecls(style: StyleMap | undefined): string[] {
  if (!style) return [];
  const out: string[] = [];
  for (const [key, ref] of Object.entries(style)) {
    const cssProp = STYLE_PROP_CSS[key] ?? key;
    out.push(`${cssProp}:${cssVar(ref)}`);
  }
  return out;
}

// Join CSS declarations into a single inline style attribute value.
function styleAttr(decls: string[]): string {
  return decls.filter(Boolean).join('; ');
}

// Minimal HTML-attribute escaping for static literal content.
function escAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Escape text content. Angular treats `{{` / `}}` as interpolation, so we must
// neutralize any literal braces in static content to keep the template inert.
function escText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{\{/g, '{{ "{{" }}')
    .replace(/\}\}/g, '{{ "}}" }}');
}

// Indentation helper for readable generated templates.
function indent(html: string, pad: string): string {
  return html
    .split('\n')
    .map((line) => (line.length ? pad + line : line))
    .join('\n');
}

function renderNode(node: Node): string {
  switch (node.type) {
    case 'Stack': {
      const decls = ['display:flex', 'flex-direction:column', ...styleMapDecls(node.style)];
      const inner = node.children.map(renderNode).join('\n');
      return `<div style="${styleAttr(decls)}">\n${indent(inner, '  ')}\n</div>`;
    }
    case 'Column': {
      const decls = ['display:flex', 'flex-direction:column', ...styleMapDecls(node.style)];
      const inner = node.children.map(renderNode).join('\n');
      return `<div style="${styleAttr(decls)}">\n${indent(inner, '  ')}\n</div>`;
    }
    case 'Row': {
      const decls = ['display:flex', 'flex-direction:row', ...styleMapDecls(node.style)];
      // Each direct child is wrapped so it sits side-by-side with flex:1.
      const inner = node.children
        .map((child) => `<div style="flex:1">\n${indent(renderNode(child), '  ')}\n</div>`)
        .join('\n');
      return `<div style="${styleAttr(decls)}">\n${indent(inner, '  ')}\n</div>`;
    }
    case 'Text': {
      if (node.props.variant === 'h2') {
        return (
          `<h2 style="margin:0; font-family:var(--font-family); font-size:var(--font-h2); ` +
          `line-height:1.25; color:var(--color-text); font-weight:700">` +
          `${escText(node.props.content)}</h2>`
        );
      }
      return (
        `<p style="margin:0; font-family:var(--font-family); font-size:var(--font-body); ` +
        `line-height:var(--font-line); color:var(--color-text)">` +
        `${escText(node.props.content)}</p>`
      );
    }
    case 'Button': {
      const base =
        'display:inline-block; text-align:center; text-decoration:none; ' +
        'padding:var(--space-sm) var(--space-md); border-radius:var(--radius-lg); ';
      const variant =
        node.props.variant === 'primary'
          ? 'background:var(--color-brand); color:var(--color-on-brand); '
          : 'background:transparent; color:var(--color-brand); border:1px solid var(--color-brand); ';
      const font = 'font-family:var(--font-family); font-size:var(--font-body); font-weight:600';
      return `<a style="${base}${variant}${font}">${escText(node.props.content)}</a>`;
    }
    case 'Image': {
      const widthDecl = node.props.width != null ? `max-width:${node.props.width}px; ` : '';
      return (
        `<img src="${escAttr(node.props.src)}" alt="${escAttr(node.props.alt)}" ` +
        `style="display:block; width:100%; ${widthDecl}height:auto; border-radius:var(--radius-lg)">`
      );
    }
  }
}

// Emit ONE standalone Angular component source as a string.
export function emitAngularSource(frame: Frame): string {
  const template = renderNode(frame.root);
  // Indent the template body two levels (inside the backtick template literal).
  const indentedTemplate = indent(template, '    ');

  return `// AUTO-GENERATED by src/generators/angular.ts — do not edit by hand.
// One standalone Angular component mirroring the CONTRACT.md web markup.
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
