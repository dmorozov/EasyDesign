// EasyDesign — MJML / EMAIL generator.
// Walks the IR (src/ir.ts) per CONTRACT.md (email section), resolving token refs
// to LITERALS via build/tokens.literals.json, producing valid MJML v5.
//
// Key mapping (frozen contract): MJML cannot nest <mj-section> inside an
// <mj-column>, so the tree FLATTENS into a sequence of sibling sections. A
// nested Row becomes its OWN <mj-section> with one <mj-column> per child (the
// Row -> two-column mapping), carrying the surface background so the card reads
// as one continuous block. See mappingNotes in the emit report for the lossy
// edges (flattening, nesting limits, data-URI image caveat).

import type { Frame, Node, StyleMap, TokenRef } from '../ir.js';
import literals from '../../build/tokens.literals.json' with { type: 'json' };

type Literals = Record<string, string | number>;
const TOKENS = literals as Literals;

// Token ref "color.surface" -> kebab key "color-surface" -> literal value.
function lit(ref: TokenRef): string {
  const key = ref.replace(/\./g, '-');
  const value = TOKENS[key];
  if (value === undefined) {
    throw new Error(`Unknown token ref "${ref}" (looked up "${key}")`);
  }
  return String(value);
}

// Resolve a style entry to a literal, falling back to undefined when absent.
function styleLit(style: StyleMap | undefined, key: string): string | undefined {
  const ref = style?.[key];
  return ref === undefined ? undefined : lit(ref);
}

// Minimal XML attribute / text escaping (MJML content is XML).
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const indent = (depth: number) => '  '.repeat(depth);

// --- Leaf renderers -------------------------------------------------------

function renderText(node: Extract<Node, { type: 'Text' }>, depth: number): string {
  const isH2 = node.props.variant === 'h2';
  const fontSize = isH2 ? lit('font.h2') : lit('font.body');
  const lineHeight = isH2 ? '1.25' : lit('font.line');
  const fontWeight = isH2 ? '700' : '400';
  const attrs = [
    `font-family="${escapeAttr(lit('font.family'))}"`,
    `font-size="${fontSize}"`,
    `line-height="${lineHeight}"`,
    `font-weight="${fontWeight}"`,
    `color="${lit('color.text')}"`,
    `padding="0"`,
  ].join(' ');
  return `${indent(depth)}<mj-text ${attrs}>${escapeText(node.props.content)}</mj-text>`;
}

function renderButton(node: Extract<Node, { type: 'Button' }>, depth: number): string {
  const isPrimary = node.props.variant === 'primary';
  const common = [
    `href="#"`,
    `font-family="${escapeAttr(lit('font.family'))}"`,
    `font-size="${lit('font.body')}"`,
    `font-weight="600"`,
    `border-radius="${lit('radius.lg')}"`,
    `inner-padding="${lit('space.sm')} ${lit('space.md')}"`,
    `align="left"`,
  ];
  if (isPrimary) {
    common.push(`background-color="${lit('color.brand')}"`, `color="${lit('color.on-brand')}"`);
  } else {
    // Secondary: transparent fill, brand-colored text + 1px brand border.
    common.push(
      `background-color="transparent"`,
      `color="${lit('color.brand')}"`,
      `border="1px solid ${lit('color.brand')}"`,
    );
  }
  return `${indent(depth)}<mj-button ${common.join(' ')}>${escapeText(node.props.content)}</mj-button>`;
}

function renderImage(node: Extract<Node, { type: 'Image' }>, depth: number): string {
  const width = node.props.width !== undefined ? `${node.props.width}px` : undefined;
  const attrs = [
    `src="${escapeAttr(node.props.src)}"`,
    `alt="${escapeAttr(node.props.alt)}"`,
    width ? `width="${width}"` : '',
    `border-radius="${lit('radius.lg')}"`,
    `padding="0"`,
  ]
    .filter(Boolean)
    .join(' ');
  return `${indent(depth)}<mj-image ${attrs} />`;
}

// Render a single leaf child (Text | Button | Image) inside a column.
function renderLeaf(node: Node, depth: number): string {
  switch (node.type) {
    case 'Text':
      return renderText(node, depth);
    case 'Button':
      return renderButton(node, depth);
    case 'Image':
      return renderImage(node, depth);
    default:
      // Container nodes are handled by the flattener, not here.
      throw new Error(`renderLeaf received non-leaf node "${node.type}"`);
  }
}

// --- Flattener ------------------------------------------------------------

// A Row flattens to its OWN sibling <mj-section> (Row -> two-column mapping):
// one <mj-column> per child, surface background so the card stays continuous.
function renderRowSection(
  row: Extract<Node, { type: 'Row' }>,
  surfaceBg: string,
  depth: number,
): string {
  const lines: string[] = [];
  const sectionAttrs = [
    `background-color="${surfaceBg}"`,
    `padding="0 ${lit('space.lg')} ${lit('space.lg')}"`,
  ].join(' ');
  lines.push(`${indent(depth)}<mj-section ${sectionAttrs}>`);
  for (const child of row.children) {
    lines.push(`${indent(depth + 1)}<mj-column>`);
    lines.push(renderLeaf(child, depth + 2));
    lines.push(`${indent(depth + 1)}</mj-column>`);
  }
  lines.push(`${indent(depth)}</mj-section>`);
  return lines.join('\n');
}

// Walk the top Stack (the card): leaf children go into one column section; a
// nested Row is emitted as a separate sibling section after it. We emit the
// leading leaf run as a single section, then each Row as its own section,
// preserving document order.
function renderCardSections(stack: Extract<Node, { type: 'Stack' }>, depth: number): string {
  const surfaceBg = styleLit(stack.style, 'background') ?? lit('color.surface');
  const padding = styleLit(stack.style, 'padding') ?? lit('space.lg');

  const blocks: string[] = [];
  let leafRun: Node[] = [];

  const flushLeafRun = (isFirst: boolean) => {
    if (leafRun.length === 0) return;
    const lines: string[] = [];
    // The first section gets full padding (incl. top); when a Row section
    // already consumed the bottom, the trailing leaf section keeps full
    // padding too. Top padding only on the very first card section.
    const pad = isFirst
      ? `${padding} ${padding} ${lit('space.md')}`
      : `0 ${padding} ${padding}`;
    const sectionAttrs = [`background-color="${surfaceBg}"`, `padding="${pad}"`].join(' ');
    lines.push(`${indent(depth)}<mj-section ${sectionAttrs}>`);
    lines.push(`${indent(depth + 1)}<mj-column>`);
    for (const leaf of leafRun) {
      lines.push(renderLeaf(leaf, depth + 2));
    }
    lines.push(`${indent(depth + 1)}</mj-column>`);
    lines.push(`${indent(depth)}</mj-section>`);
    blocks.push(lines.join('\n'));
    leafRun = [];
  };

  let firstSectionEmitted = false;
  for (const child of stack.children) {
    if (child.type === 'Row') {
      flushLeafRun(!firstSectionEmitted);
      firstSectionEmitted = true;
      blocks.push(renderRowSection(child, surfaceBg, depth));
    } else if (child.type === 'Stack' || child.type === 'Column') {
      // Nested containers other than Row are not part of the frozen sample.
      // Flatten conservatively: treat their leaf descendants as a leaf run.
      flushLeafRun(!firstSectionEmitted);
      firstSectionEmitted = true;
      for (const grand of child.children) {
        if (grand.type === 'Row') {
          blocks.push(renderRowSection(grand, surfaceBg, depth));
        } else if (grand.type === 'Stack' || grand.type === 'Column') {
          // One level of conservative flattening is enough for the skeleton.
          leafRun.push(...grand.children.filter((g) => g.type !== 'Row'));
        } else {
          leafRun.push(grand);
        }
      }
      flushLeafRun(false);
    } else {
      leafRun.push(child);
    }
  }
  flushLeafRun(!firstSectionEmitted);

  return blocks.join('\n');
}

// --- Entry point ----------------------------------------------------------

export function emitMJML(frame: Frame): string {
  const root = frame.root;
  if (root.type !== 'Stack') {
    throw new Error(`emitMJML expects a top-level Stack card, got "${root.type}"`);
  }
  const pageBg = lit('color.page');
  const fontFamily = lit('font.family');

  const sections = renderCardSections(root, 2);

  return [
    `<mjml>`,
    `  <mj-head>`,
    `    <mj-attributes>`,
    `      <mj-all font-family="${escapeAttr(fontFamily)}" />`,
    `    </mj-attributes>`,
    `  </mj-head>`,
    `  <mj-body background-color="${pageBg}">`,
    sections,
    `  </mj-body>`,
    `</mjml>`,
    ``,
  ].join('\n');
}
