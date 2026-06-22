import { type IconName } from '../design-system';
import { type Node } from '../ir/types';

import { DESCRIPTORS } from './descriptors';

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
    create: spec.create ?? d.create,
  };
}

export const PALETTE: PaletteItem[] = PALETTE_SPECS.map(project);
