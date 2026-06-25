// EasyDesign — MJML / EMAIL generator (ADR-0006).
// Walks the IR resolving token refs to LITERALS (passed in), producing valid MJML v5.
//
// Key mapping: MJML cannot nest <mj-section> inside an <mj-column>, so the tree
// FLATTENS into sibling sections. A nested Row becomes its OWN <mj-section> with
// one <mj-column> per child (the Row -> two-column mapping), carrying the surface
// background so the card reads continuous (see ADR-0008 for the flattening strategy,
// ADR-0006 for email constraints).
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

// A horizontal rule → MJML's native <mj-divider> (this ADR). Divider is the one email-SAFE display-only
// leaf, so unlike the guardrails below it renders for real — proving the Capability-A path to all four
// targets. Resolved to literals (color.muted, space.md) like every other email leaf.
function renderDivider(lit: Lit, _node: Extract<Node, { type: 'Divider' }>, depth: number): string {
  const attrs = [
    `border-width="1px"`,
    `border-color="${lit('color.muted')}"`,
    `padding="${lit('space.md')} 0"`,
  ].join(' ');
  return `${indent(depth)}<mj-divider ${attrs} />`;
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
  Divider: renderDivider,
  // Radio is email-unsafe (it only lives in a RadioGroup, which email Frames block — ADR-0006/0016).
  // RP-9 still requires the entry; it throws as a guardrail and is never reached in a valid email tree.
  Radio: () => {
    throw new Error('MJML email cannot render a Radio (RadioGroup is email-unsafe, ADR-0016).');
  },
  // NavLink only lives inside a nav Component (TopNav/SideNav/Breadcrumb/MenuBar), all web-only — so a
  // valid email tree never reaches it. RP-9 still requires the entry; it throws as a guardrail (ADR-0019).
  NavLink: () => {
    throw new Error('MJML email cannot render a NavLink (navigation is web-only, ADR-0019).');
  },
  // Step/ToolButton are slot leaves of the web-only Stepper/ToolBar; Spacer relies on flexbox, which the
  // email table model lacks — all three are emailSafe:false, so a valid email tree never reaches them.
  // RP-9 still requires the entries; they throw as guardrails (like Radio/NavLink).
  Step: () => {
    throw new Error('MJML email cannot render a Step (the Stepper is web-only, this ADR).');
  },
  ToolButton: () => {
    throw new Error('MJML email cannot render a ToolButton (the ToolBar is web-only, this ADR).');
  },
  Spacer: () => {
    throw new Error('MJML email cannot render a Spacer (flex has no email equivalent, this ADR).');
  },
  // A TableCell is email-SAFE (the Data Table reaches email), but it is rendered by its DataTable's
  // <mj-table> (renderDataTableSection), NEVER as a standalone leaf — cells only ever live inside a
  // DataTable, so a valid tree never dispatches here. RP-9 still requires the entry; it throws as an
  // unreachable guardrail (ADR-0021).
  TableCell: () => {
    throw new Error(
      'MJML email renders a TableCell via its DataTable (<mj-table>), not as a standalone leaf (ADR-0021).',
    );
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
  | { role: 'table'; node: Extract<Node, { type: 'DataTable' }> }
  | { role: 'unsupported'; type: ContainerType };

export function classifyCardChild(node: Node): CardChild {
  if (!('children' in node)) return { role: 'leaf', node };
  switch (node.type) {
    case 'Row':
      return { role: 'row', node };
    // DataTable is email-SAFE (ADR-0021): it flattens to its own sibling section wrapping a native
    // <mj-table> (renderDataTableSection), like a Row gets its own section — the 2nd email-safe Component.
    case 'DataTable':
      return { role: 'table', node };
    case 'Stack':
    case 'Column':
    case 'Grid':
    case 'Paper':
    case 'RadioGroup':
    case 'AppShell':
    case 'Region':
    case 'AppBar':
    case 'TopNav':
    case 'SideNav':
    case 'Breadcrumb':
    case 'MenuBar':
    case 'Stepper':
    case 'ToolBar':
    case 'TableRow':
    case 'Pagination':
    case 'Tabs':
    case 'TabPanel':
    case 'Accordion':
    case 'AccordionItem':
      // Stack/Column/Grid/Paper don't flatten (a nested surface has no email section model); the rest are
      // web-only (emailSafe:false) — Grid/RadioGroup/AppShell/Region, the application chrome
      // (AppBar/TopNav/SideNav/Breadcrumb/MenuBar), the common design components (Stepper/ToolBar), the
      // web-only Pagination, and the interactive compounds (Tabs/TabPanel/Accordion/AccordionItem — tabs
      // and disclosure have no email model, ADR-0022). A bare TableRow at card level is invalid (it only
      // lives inside a DataTable, which owns its rows wholesale); likewise a bare TabPanel/AccordionItem
      // only lives inside its Tabs/Accordion. The arms keep the switch compile-exhaustive.
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
    // A Row column holds a leaf OR a Data Table (both render in a column); a DataTable emits its own
    // <mj-table> here (ADR-0021), so a table beside text in an email Row works instead of throwing. Any
    // other container child still hits renderLeaf's non-leaf guard (nested Rows/Stacks have no email model).
    lines.push(
      child.type === 'DataTable'
        ? renderMjTable(lit, child, depth + 2)
        : renderLeaf(lit, child, depth + 2),
    );
    lines.push(`${indent(depth + 1)}</mj-column>`);
  }
  lines.push(`${indent(depth)}</mj-section>`);
  return lines.join('\n');
}

// Render JUST the native <mj-table> block — caption + a <thead> of header rows and a <tbody> of body
// rows, structurally identical to the three web targets (ADR-0021). mj-table is an "ending tag": it
// accepts plain table HTML only (no nested MJML), which is exactly why the Data Table's TEXT cells survive
// to email, making it the 2nd email-safe Component after Divider. Styles resolve to LITERALS (mj-table
// can't read CSS vars), mirroring renderDivider; the th/td decision reads the row's `header` flag (the
// single source of truth). Shared by the table's own section AND by a DataTable in a Row's column.
function renderMjTable(
  lit: Lit,
  table: Extract<Node, { type: 'DataTable' }>,
  depth: number,
): string {
  const textColor = lit('color.text');
  const rule = lit('color.muted');
  const semibold = lit('font.weight.semibold');
  const cellPad = `${lit('space.sm')} ${lit('space.md')}`;
  const headerCell = `text-align:left;padding:${cellPad};border-bottom:2px solid ${rule};color:${textColor};font-weight:${semibold};`;
  const bodyCell = `text-align:left;padding:${cellPad};border-bottom:1px solid ${rule};color:${textColor};`;
  const rowHtml = (row: Extract<Node, { type: 'TableRow' }>): string => {
    const cells = row.children
      .map((cell) => {
        const content = escapeText(cell.props.content);
        return row.props.header
          ? `<th scope="col" style="${headerCell}">${content}</th>`
          : `<td style="${bodyCell}">${content}</td>`;
      })
      .join('');
    return `<tr>${cells}</tr>`;
  };

  const headerRows = table.children.filter((r) => r.props.header);
  const bodyRows = table.children.filter((r) => !r.props.header);
  const tableAttrs = [
    `font-family="${escapeAttr(lit('font.family'))}"`,
    `font-size="${lit('font.size.base')}"`,
    `color="${textColor}"`,
    `padding="0"`,
  ].join(' ');

  const lines = [`${indent(depth)}<mj-table ${tableAttrs}>`];
  if (table.props.caption) {
    lines.push(
      `${indent(depth + 1)}<caption style="text-align:left;font-weight:${semibold};color:${textColor};padding-bottom:${lit('space.sm')};">${escapeText(table.props.caption)}</caption>`,
    );
  }
  if (headerRows.length > 0) {
    lines.push(`${indent(depth + 1)}<thead>`);
    for (const r of headerRows) lines.push(`${indent(depth + 2)}${rowHtml(r)}`);
    lines.push(`${indent(depth + 1)}</thead>`);
  }
  if (bodyRows.length > 0) {
    lines.push(`${indent(depth + 1)}<tbody>`);
    for (const r of bodyRows) lines.push(`${indent(depth + 2)}${rowHtml(r)}`);
    lines.push(`${indent(depth + 1)}</tbody>`);
  }
  lines.push(`${indent(depth)}</mj-table>`);
  return lines.join('\n');
}

// A DataTable flattens to its OWN sibling <mj-section> wrapping the <mj-table> — like a Row gets its own
// section. (A DataTable that sits INSIDE a Row's column is handled by renderRowSection, which emits the
// same renderMjTable directly into that column.)
function renderDataTableSection(
  lit: Lit,
  table: Extract<Node, { type: 'DataTable' }>,
  surfaceBg: string,
  depth: number,
): string {
  const sectionAttrs = [
    `background-color="${surfaceBg}"`,
    `padding="0 ${lit('space.lg')} ${lit('space.lg')}"`,
  ].join(' ');
  return [
    `${indent(depth)}<mj-section ${sectionAttrs}>`,
    `${indent(depth + 1)}<mj-column>`,
    renderMjTable(lit, table, depth + 2),
    `${indent(depth + 1)}</mj-column>`,
    `${indent(depth)}</mj-section>`,
  ].join('\n');
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
    } else if (c.role === 'table') {
      flushLeafRun(!firstSectionEmitted);
      firstSectionEmitted = true;
      blocks.push(renderDataTableSection(lit, c.node, surfaceBg, depth));
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
