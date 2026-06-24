// EasyDesign — MJML / EMAIL generator (ADR-0006).
// Walks the IR resolving token refs to LITERALS (passed in), producing valid MJML v5.
//
// Key mapping: MJML cannot nest <mj-section> inside an <mj-column>, so the tree
// FLATTENS into sibling sections. A nested Row becomes its OWN <mj-section> with
// one <mj-column> per child (the Row -> two-column mapping), carrying the surface
// background so the card reads continuous. See docs/walking-skeleton.md findings.
import { type Frame, type Node, type StyleMap, type TokenRef } from '../ir/types';
import { type ContainerType, type LeafNode, type LeafType } from '../ir/walk';
import { TEXT_STYLE_BINDING } from '../theme/generated/typography';

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
  // Typography resolves through the binding (RP-3); a free-form fontSize/fontWeight overrides it.
  const binding = TEXT_STYLE_BINDING[node.props.variant];
  const fontSize = lit(node.style?.fontSize ?? binding.fontSize);
  const fontWeight = lit(node.style?.fontWeight ?? binding.fontWeight);
  // Outlook treats decimal-unitless line-height as a percentage and rounds it (a live bug); resolve it
  // to px (size × ratio) so MJML's mso-line-height-rule:exactly makes it deterministic (RP-3). Guard the
  // arithmetic: a malformed Theme/free-form override (a non-numeric font-size) would make the product
  // NaN — fall back to the unitless ratio so email never ships `line-height="NaNpx"` (the flagship
  // clean-output gate). Valid tokens always yield a finite px, so golden output is unchanged.
  const px = Math.round(parseFloat(fontSize) * parseFloat(lit(binding.lineHeight)));
  const lineHeight = Number.isFinite(px) ? `${px}px` : lit(binding.lineHeight);
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

function renderButton(lit: Lit, node: Extract<Node, { type: 'Button' }>, depth: number): string {
  const common = [
    `href="#"`,
    `font-family="${escapeAttr(lit('font.family'))}"`,
    `font-size="${lit('font.size.base')}"`,
    `font-weight="${lit('font.weight.semibold')}"`, // RP-3: was hard-coded 600
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

// Per-leaf-type MJML renderers, keyed off the shared LeafType union (RP-9) — a forgotten leaf is a
// COMPILE error here too, not the old runtime throw. MJML keeps its bespoke section/column structure
// (ADR-0008); only the leaf dispatch is registry-driven.
const MJML_LEAVES: {
  [K in LeafType]: (lit: Lit, node: Extract<Node, { type: K }>, depth: number) => string;
} = {
  Text: renderText,
  Button: renderButton,
  Image: renderImage,
  // Radio is email-unsafe (it only lives in a RadioGroup, which email Frames block — ADR-0006/0016).
  // RP-9 still requires the entry; it throws as a guardrail and is never reached in a valid email tree.
  Radio: () => {
    throw new Error('MJML email cannot render a Radio (RadioGroup is email-unsafe, ADR-0016).');
  },
};

function renderLeaf(lit: Lit, node: Node, depth: number): string {
  // A container reaching the leaf flattener means the MJML section model was violated (ADR-0006/0008).
  if ('children' in node) throw new Error(`renderLeaf received non-leaf node "${node.type}"`);
  return (MJML_LEAVES[node.type] as (l: Lit, n: LeafNode, d: number) => string)(lit, node, depth);
}

// --- Structure dispatch (RP-8) --------------------------------------------

// MJML's section/column flattener is bespoke and stays so (ADR-0008) — but its CONTAINER dispatch now
// shares the Node Walk's union vocabulary and is EXHAUSTIVE, mirroring MJML_LEAVES for leaves. A card's
// child is exactly one of: a leaf (batched into a leaf-run section), a Row (its own sibling section),
// or an unsupported container — Stack/Column/Grid have no email mapping (Grid is email-unsafe, ADR-0006;
// nested Stack/Column don't flatten). The `default` is a `never` sentinel: every container type is cased,
// so adding one stops this compiling until it is given an explicit email decision here — instead of
// silently falling through to `renderLeaf`'s runtime throw.
type CardChild =
  | { role: 'leaf'; node: LeafNode }
  | { role: 'row'; node: Extract<Node, { type: 'Row' }> }
  | { role: 'unsupported'; type: ContainerType };

export function classifyCardChild(node: Node): CardChild {
  if (!('children' in node)) return { role: 'leaf', node };
  switch (node.type) {
    case 'Row':
      return { role: 'row', node };
    case 'Stack':
    case 'Column':
    case 'Grid':
    case 'RadioGroup':
    case 'AppShell':
    case 'Region':
      // Stack/Column/Grid don't flatten; Grid/RadioGroup/AppShell/Region are web-only (emailSafe:false),
      // so a valid email tree never reaches them — the arms keep the switch compile-exhaustive (ADR-0017).
      return { role: 'unsupported', type: node.type };
    default:
      // Exhaustiveness: `node` is `never` here. A new container type makes it non-never → a compile
      // error, forcing the email decision above (RP-8). Unreachable at runtime for the current union.
      return node;
  }
}

function unsupportedInEmail(type: ContainerType): string {
  return `MJML email cannot represent a nested ${type} (ADR-0006/0008): email Frames flatten to sections + columns, with leaves and Rows only.`;
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
  let leafRun: LeafNode[] = [];

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
    const c = classifyCardChild(child);
    if (c.role === 'row') {
      flushLeafRun(!firstSectionEmitted);
      firstSectionEmitted = true;
      blocks.push(renderRowSection(lit, c.node, surfaceBg, depth));
    } else if (c.role === 'leaf') {
      leafRun.push(c.node);
    } else {
      throw new Error(unsupportedInEmail(c.type));
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
