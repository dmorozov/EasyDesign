import { type IconName } from '../design-system';
import { type Node } from '../ir/types';

import { DESCRIPTORS, makeAccordion, makeAppShell, makeStepper, makeTabs } from './descriptors';

/** A draggable Component Palette entry. `create()` mints a fresh IR node. */
export interface PaletteItem {
  id: string;
  label: string;
  /** Chrome icon shown on the palette tile/row. */
  icon: IconName;
  /** Layout components render as cards (2-col grid); content components as rows. */
  group: 'layout' | 'content';
  /** The data the email rule reads (ADR-0006): `false` items are locked in email Frames. The rule
   *  itself lives in `frames.ts` (`canInsertComponent`/`canInsertInTarget`), not here. */
  emailSafe: boolean;
  /** The node type this tile inserts (a variant's underlying type, e.g. 'Text' for "Heading"). The
   *  drop validator reads it to enforce the allowed-children rule (RP-10) without minting a node. */
  nodeType: Node['type'];
  create: () => Node;
}

type NodeType = Node['type'];

// A palette entry is a node TYPE — projected wholesale from its descriptor (RP-2) — or a named VARIANT
// of one (the two Buttons, the Heading-vs-Text split) that overrides id/label/icon/create. The type-level
// facts (group, email-safety, and the default icon/label/create) always come from the descriptor, so the
// per-item `emailSafe` duplication that frames.test used to guard is gone: there is one source.
type PaletteSpec =
  | NodeType
  | { type: NodeType; id: string; label?: string; icon?: IconName; create?: () => Node };

const PALETTE_SPECS: readonly PaletteSpec[] = [
  'Stack',
  'Row',
  { type: 'Grid', id: 'grid', label: 'Grid (2-col)' },
  // A surface container (this ADR) — a pre-styled Stack the user fills.
  'Paper',
  // ADR-0017: the application-shell layout. The default tile seeds header+main+footer (descriptor
  // create); the presets are just different region sets via makeAppShell. Region itself is NOT a tile.
  { type: 'AppShell', id: 'app-shell', label: 'App layout' },
  {
    type: 'AppShell',
    id: 'app-holy-grail',
    label: 'Holy grail',
    create: () => makeAppShell(['header', 'left', 'main', 'right', 'footer']),
  },
  {
    type: 'AppShell',
    id: 'app-sidebar-main',
    label: 'Sidebar + Main',
    create: () => makeAppShell(['left', 'main']),
  },
  // ADR-0019 — application chrome. AppBar seeds a brand + logout; the nav menus/trail seed NavLinks.
  'AppBar',
  'TopNav',
  'SideNav',
  'Breadcrumb',
  // The common design components (this ADR). MenuBar/ToolBar seed their items; the Stepper ships as two
  // orientation presets over one seed (makeStepper) — "(vertical, horizontal)" as palette variants.
  'MenuBar',
  { type: 'Stepper', id: 'stepper', label: 'Stepper' },
  {
    type: 'Stepper',
    id: 'stepper-vertical',
    label: 'Stepper (vertical)',
    create: () => makeStepper('vertical'),
  },
  'ToolBar',
  {
    type: 'Text',
    id: 'heading',
    label: 'Heading',
    icon: 'heading',
    create: () => ({ type: 'Text', props: { content: 'Heading', variant: 'h2' } }),
  },
  { type: 'Text', id: 'text' }, // the default Text (body) — label/icon/create come from the descriptor
  {
    type: 'Button',
    id: 'button-primary',
    label: 'Button (primary)',
    create: () => ({ type: 'Button', props: { content: 'Button', variant: 'primary' } }),
  },
  {
    type: 'Button',
    id: 'button-secondary',
    label: 'Button (secondary)',
    create: () => ({ type: 'Button', props: { content: 'Button', variant: 'secondary' } }),
  },
  'Image',
  // RP-10: the compound Component + its slot leaf. Radio is draggable but lands ONLY in a RadioGroup
  // (the drop validator rejects it elsewhere) — the proof of the allowed-children rule.
  'RadioGroup',
  'Radio',
  // ADR-0019: NavLink is draggable but lands ONLY in a nav Component (TopNav/SideNav/Breadcrumb/MenuBar) —
  // the same allowed-children rule as Radio→RadioGroup, the drop validator rejects it anywhere else.
  'NavLink',
  // Slot leaves (this ADR): a Step lands ONLY in a Stepper, a ToolButton ONLY in a ToolBar — the same
  // allowed-children rule as Radio/NavLink.
  'Step',
  'ToolButton',
  // The complex compound components (ADR-0021). DataTable seeds a header + two body rows; its TableRow
  // lands ONLY in a DataTable (allowed-children rule) and ships as a body + a header preset. There is NO
  // TableCell tile: a TableRow is not a canvas drop target, so a cell tile would be undroppable — cells
  // are seeded with each row and edited via the Structure tree + Inspector. Pagination reuses NavLink.
  'DataTable',
  { type: 'TableRow', id: 'table-row', label: 'Table row' },
  {
    type: 'TableRow',
    id: 'table-row-header',
    label: 'Table row (header)',
    create: () => ({
      type: 'TableRow',
      props: { header: true },
      children: [
        { type: 'TableCell', props: { content: 'Heading' } },
        { type: 'TableCell', props: { content: 'Heading' } },
        { type: 'TableCell', props: { content: 'Heading' } },
      ],
    }),
  },
  'Pagination',
  // The interactive compounds (ADR-0022). Tabs ships as two orientation presets over one seed (makeTabs);
  // Accordion as a multi-open default + a single-open preset (makeAccordion). A TabPanel lands ONLY in a
  // Tabs, an AccordionItem ONLY in an Accordion — the same allowed-children rule as Radio/NavLink — but
  // unlike a TableRow, their container IS a canvas drop target, so the slot tiles are genuinely droppable.
  { type: 'Tabs', id: 'tabs', label: 'Tabs' },
  {
    type: 'Tabs',
    id: 'tabs-vertical',
    label: 'Tabs (vertical)',
    create: () => makeTabs('vertical'),
  },
  'TabPanel',
  { type: 'Accordion', id: 'accordion', label: 'Accordion' },
  {
    type: 'Accordion',
    id: 'accordion-single',
    label: 'Accordion (single-open)',
    create: () => makeAccordion(true),
  },
  'AccordionItem',
  // Display-only leaves (this ADR): droppable into any open container.
  'Divider',
  'Spacer',
];

function project(spec: PaletteSpec): PaletteItem {
  if (typeof spec === 'string') {
    const d = DESCRIPTORS[spec];
    return {
      id: spec.toLowerCase(),
      label: d.label,
      icon: d.icon,
      group: d.group,
      emailSafe: d.emailSafe,
      nodeType: spec,
      create: d.create,
    };
  }
  const d = DESCRIPTORS[spec.type];
  return {
    id: spec.id,
    label: spec.label ?? d.label,
    icon: spec.icon ?? d.icon,
    group: d.group, // group + email-safety are TYPE facts — never per-variant
    emailSafe: d.emailSafe,
    nodeType: spec.type,
    create: spec.create ?? d.create,
  };
}

export const PALETTE: PaletteItem[] = PALETTE_SPECS.map(project);
