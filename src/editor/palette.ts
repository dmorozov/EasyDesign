import { type IconName } from '../design-system';
import { type Node } from '../ir/types';

import { DESCRIPTORS, makeAppShell } from './descriptors';

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
  // ADR-0019: NavLink is draggable but lands ONLY in a nav Component (TopNav/SideNav/Breadcrumb) — the
  // same allowed-children rule as Radio→RadioGroup, the drop validator rejects it anywhere else.
  'NavLink',
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
