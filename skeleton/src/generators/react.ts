// React generator for the EasyDesign walking skeleton.
// Consumes the IR (src/ir.ts) and emits .tsx component source per CONTRACT.md:
//   - a default-exported function component
//   - inline style OBJECTS with camelCase keys (e.g. flexDirection)
//   - token-bound values as "var(--…)"; literal CSS for fixed bits
//   - className (not class)
//
// Token ref -> name rule: a style value "color.surface" -> var(--color-surface).
// Dot-path -> kebab, prefixed --, wrapped in var(...).

import type { Frame, Node, StyleMap } from '../ir.js';

// "color.surface" -> "var(--color-surface)"
function tokenVar(ref: string): string {
  const kebab = ref.replace(/\./g, '-');
  return `var(--${kebab})`;
}

// Map a node's StyleMap (token refs) to a record of CSS property -> "var(--…)".
// Keys in the IR (background, padding, borderRadius, gap, …) are already valid
// camelCase React style keys, so we pass them through unchanged.
function styleFromMap(style: StyleMap | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!style) return out;
  for (const [key, ref] of Object.entries(style)) {
    out[key] = tokenVar(ref);
  }
  return out;
}

// Serialize a style object to a JSX style-object literal, e.g.
//   { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }
// -> "{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }"
function styleLiteral(obj: Record<string, string | number>): string {
  const entries = Object.entries(obj).map(([k, v]) => {
    const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
    const value = typeof v === 'number' ? String(v) : `'${escapeSingle(v)}'`;
    return `${key}: ${value}`;
  });
  return `{ ${entries.join(', ')} }`;
}

function escapeSingle(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Escape text that lands in JSX text positions / attribute values.
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

const INDENT = '  ';
function pad(depth: number): string {
  return INDENT.repeat(depth);
}

// Render a single node to JSX source. `depth` controls indentation.
function emitNode(node: Node, depth: number): string {
  const p = pad(depth);
  switch (node.type) {
    case 'Stack': {
      const style = {
        display: 'flex',
        flexDirection: 'column',
        ...styleFromMap(node.style),
      };
      const childSrc = node.children
        .map((c) => emitNode(c, depth + 1))
        .join('\n');
      return (
        `${p}<div style={${styleLiteral(style)}}>\n` +
        `${childSrc}\n` +
        `${p}</div>`
      );
    }
    case 'Column': {
      const style = {
        display: 'flex',
        flexDirection: 'column',
        ...styleFromMap(node.style),
      };
      const childSrc = node.children
        .map((c) => emitNode(c, depth + 1))
        .join('\n');
      return (
        `${p}<div style={${styleLiteral(style)}}>\n` +
        `${childSrc}\n` +
        `${p}</div>`
      );
    }
    case 'Row': {
      const style = {
        display: 'flex',
        flexDirection: 'row',
        ...styleFromMap(node.style),
      };
      // Each direct child is wrapped so it sits side-by-side with flex:1.
      const childSrc = node.children
        .map((c) => {
          const cp = pad(depth + 1);
          const inner = emitNode(c, depth + 2);
          return (
            `${cp}<div style={${styleLiteral({ flex: 1 })}}>\n` +
            `${inner}\n` +
            `${cp}</div>`
          );
        })
        .join('\n');
      return (
        `${p}<div style={${styleLiteral(style)}}>\n` +
        `${childSrc}\n` +
        `${p}</div>`
      );
    }
    case 'Text': {
      const { content, variant } = node.props;
      if (variant === 'h2') {
        const style = {
          margin: '0',
          fontFamily: 'var(--font-family)',
          fontSize: 'var(--font-h2)',
          lineHeight: '1.25',
          color: 'var(--color-text)',
          fontWeight: '700',
        };
        return `${p}<h2 style={${styleLiteral(style)}}>${jsxText(content)}</h2>`;
      }
      const style = {
        margin: '0',
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-body)',
        lineHeight: 'var(--font-line)',
        color: 'var(--color-text)',
      };
      return `${p}<p style={${styleLiteral(style)}}>${jsxText(content)}</p>`;
    }
    case 'Button': {
      const { content, variant } = node.props;
      const base: Record<string, string> = {
        display: 'inline-block',
        textAlign: 'center',
        textDecoration: 'none',
        padding: 'var(--space-sm) var(--space-md)',
        borderRadius: 'var(--radius-lg)',
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-body)',
        fontWeight: '600',
      };
      let style: Record<string, string>;
      if (variant === 'primary') {
        style = {
          ...base,
          background: 'var(--color-brand)',
          color: 'var(--color-on-brand)',
        };
      } else {
        style = {
          ...base,
          background: 'transparent',
          color: 'var(--color-brand)',
          border: '1px solid var(--color-brand)',
        };
      }
      return `${p}<a href="#" style={${styleLiteral(style)}}>${jsxText(content)}</a>`;
    }
    case 'Image': {
      const { src, alt, width } = node.props;
      const style: Record<string, string> = {
        display: 'block',
        width: '100%',
        maxWidth: width != null ? `${width}px` : '100%',
        height: 'auto',
        borderRadius: 'var(--radius-lg)',
      };
      return `${p}<img src="${jsxAttr(src)}" alt="${jsxAttr(alt)}" style={${styleLiteral(style)}} />`;
    }
  }
}

// Emit the full .tsx component source for a Frame.
export function emitReactSource(frame: Frame): string {
  const body = emitNode(frame.root, 2);
  return (
    `// AUTO-GENERATED by src/generators/react.ts — do not edit by hand.\n` +
    `import * as React from 'react';\n\n` +
    `export default function Card(): React.ReactElement {\n` +
    `  return (\n` +
    `${body}\n` +
    `  );\n` +
    `}\n`
  );
}
