// EasyDesign — MJML / EMAIL generator (ADR-0006).
// Walks the IR resolving token refs to LITERALS (passed in), producing valid MJML v5.
//
// Key mapping: MJML cannot nest <mj-section> inside an <mj-column>, so the tree
// FLATTENS into sibling sections. A nested Row becomes its OWN <mj-section> with
// one <mj-column> per child (the Row -> two-column mapping), carrying the surface
// background so the card reads continuous. See docs/walking-skeleton.md findings.
import { type Frame, type Node, type StyleMap, type TokenRef } from '../ir/types';

// The literal resolver (dot-ref -> '16px') is supplied by the caller — the Design-Token Model's
// catalog.withOverrides (D2). MJML keeps only its bespoke FLATTEN (ADR-0008), never token resolution.
type Lit = (ref: TokenRef) => string;

function styleLit(lit: Lit, style: StyleMap | undefined, key: string): string | undefined {
  const ref = style?.[key];
  return ref === undefined ? undefined : lit(ref);
}

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

function indent(depth: number): string {
  return '  '.repeat(depth);
}

// --- Leaf renderers -------------------------------------------------------

function renderText(lit: Lit, node: Extract<Node, { type: 'Text' }>, depth: number): string {
  const isH2 = node.props.variant === 'h2';
  const attrs = [
    `font-family="${escapeAttr(lit('font.family'))}"`,
    `font-size="${isH2 ? lit('font.h2') : lit('font.body')}"`,
    `line-height="${isH2 ? '1.25' : lit('font.line')}"`,
    `font-weight="${isH2 ? '700' : '400'}"`,
    `color="${lit('color.text')}"`,
    `padding="0"`,
  ].join(' ');
  return `${indent(depth)}<mj-text ${attrs}>${escapeText(node.props.content)}</mj-text>`;
}

function renderButton(lit: Lit, node: Extract<Node, { type: 'Button' }>, depth: number): string {
  const common = [
    `href="#"`,
    `font-family="${escapeAttr(lit('font.family'))}"`,
    `font-size="${lit('font.body')}"`,
    `font-weight="600"`,
    `border-radius="${lit('radius.lg')}"`,
    `inner-padding="${lit('space.sm')} ${lit('space.md')}"`,
    `align="left"`,
  ];
  if (node.props.variant === 'primary') {
    common.push(`background-color="${lit('color.brand')}"`, `color="${lit('color.onBrand')}"`);
  } else {
    common.push(
      `background-color="transparent"`,
      `color="${lit('color.brand')}"`,
      `border="1px solid ${lit('color.brand')}"`,
    );
  }
  const content = escapeText(node.props.content);
  return `${indent(depth)}<mj-button ${common.join(' ')}>${content}</mj-button>`;
}

function renderImage(lit: Lit, node: Extract<Node, { type: 'Image' }>, depth: number): string {
  const width = node.props.width !== undefined ? `${String(node.props.width)}px` : undefined;
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

function renderLeaf(lit: Lit, node: Node, depth: number): string {
  switch (node.type) {
    case 'Text':
      return renderText(lit, node, depth);
    case 'Button':
      return renderButton(lit, node, depth);
    case 'Image':
      return renderImage(lit, node, depth);
    case 'Stack':
    case 'Row':
    case 'Column':
    case 'Grid':
      throw new Error(`renderLeaf received non-leaf node "${node.type}"`);
  }
}

// --- Flattener ------------------------------------------------------------

// A Row flattens to its OWN sibling <mj-section> (Row -> two-column mapping).
function renderRowSection(
  lit: Lit,
  row: Extract<Node, { type: 'Row' }>,
  surfaceBg: string,
  depth: number,
): string {
  const sectionAttrs = [
    `background-color="${surfaceBg}"`,
    `padding="0 ${lit('space.lg')} ${lit('space.lg')}"`,
  ].join(' ');
  const lines = [`${indent(depth)}<mj-section ${sectionAttrs}>`];
  for (const child of row.children) {
    lines.push(`${indent(depth + 1)}<mj-column>`);
    lines.push(renderLeaf(lit, child, depth + 2));
    lines.push(`${indent(depth + 1)}</mj-column>`);
  }
  lines.push(`${indent(depth)}</mj-section>`);
  return lines.join('\n');
}

// Walk the top Stack (the card): leaf runs become one section; a nested Row is
// emitted as a separate sibling section after it, preserving document order.
function renderCardSections(
  lit: Lit,
  stack: Extract<Node, { type: 'Stack' }>,
  depth: number,
): string {
  const surfaceBg = styleLit(lit, stack.style, 'background') ?? lit('color.surface');
  const padding = styleLit(lit, stack.style, 'padding') ?? lit('space.lg');

  const blocks: string[] = [];
  let leafRun: Node[] = [];

  const flushLeafRun = (isFirst: boolean): void => {
    if (leafRun.length === 0) return;
    const pad = isFirst ? `${padding} ${padding} ${lit('space.md')}` : `0 ${padding} ${padding}`;
    const sectionAttrs = [`background-color="${surfaceBg}"`, `padding="${pad}"`].join(' ');
    const lines = [
      `${indent(depth)}<mj-section ${sectionAttrs}>`,
      `${indent(depth + 1)}<mj-column>`,
    ];
    for (const leaf of leafRun) {
      lines.push(renderLeaf(lit, leaf, depth + 2));
    }
    lines.push(`${indent(depth + 1)}</mj-column>`, `${indent(depth)}</mj-section>`);
    blocks.push(lines.join('\n'));
    leafRun = [];
  };

  let firstSectionEmitted = false;
  for (const child of stack.children) {
    if (child.type === 'Row') {
      flushLeafRun(!firstSectionEmitted);
      firstSectionEmitted = true;
      blocks.push(renderRowSection(lit, child, surfaceBg, depth));
    } else {
      leafRun.push(child);
    }
  }
  flushLeafRun(!firstSectionEmitted);

  return blocks.join('\n');
}

// --- Entry point ----------------------------------------------------------

export function emitMJML(frame: Frame, lit: Lit): string {
  const root = frame.root;
  if (root.type !== 'Stack') {
    throw new Error(`emitMJML expects a top-level Stack card, got "${root.type}"`);
  }
  const sections = renderCardSections(lit, root, 2);

  return [
    `<mjml>`,
    `  <mj-head>`,
    `    <mj-attributes>`,
    `      <mj-all font-family="${escapeAttr(lit('font.family'))}" />`,
    `    </mj-attributes>`,
    `  </mj-head>`,
    `  <mj-body background-color="${lit('color.page')}">`,
    sections,
    `  </mj-body>`,
    `</mjml>`,
    ``,
  ].join('\n');
}
