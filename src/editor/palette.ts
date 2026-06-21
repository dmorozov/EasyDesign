import { type IconName } from '../design-system';
import { type Node } from '../ir/types';

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

// A tiny neutral placeholder so a dropped Image renders something.
const placeholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120'%3E" +
  "%3Crect width='200' height='120' fill='%23e5e7eb'/%3E%3C/svg%3E";

export const PALETTE: PaletteItem[] = [
  {
    id: 'stack',
    label: 'Stack',
    icon: 'stack',
    group: 'layout',
    emailSafe: true,
    create: () => ({ type: 'Stack', style: { gap: 'space.md' }, children: [] }),
  },
  {
    id: 'row',
    label: 'Row',
    icon: 'row',
    group: 'layout',
    emailSafe: true,
    create: () => ({ type: 'Row', style: { gap: 'space.md' }, children: [] }),
  },
  {
    id: 'grid',
    label: 'Grid (2-col)',
    icon: 'grid',
    group: 'layout',
    emailSafe: false,
    create: () => ({
      type: 'Grid',
      props: { columns: 2 },
      style: { gap: 'space.md' },
      children: [],
    }),
  },
  {
    id: 'heading',
    label: 'Heading',
    icon: 'heading',
    group: 'content',
    emailSafe: true,
    create: () => ({ type: 'Text', props: { content: 'Heading', variant: 'h2' } }),
  },
  {
    id: 'text',
    label: 'Text',
    icon: 'text',
    group: 'content',
    emailSafe: true,
    create: () => ({ type: 'Text', props: { content: 'Body text', variant: 'body' } }),
  },
  {
    id: 'button-primary',
    label: 'Button (primary)',
    icon: 'button',
    group: 'content',
    emailSafe: true,
    create: () => ({ type: 'Button', props: { content: 'Button', variant: 'primary' } }),
  },
  {
    id: 'button-secondary',
    label: 'Button (secondary)',
    icon: 'button',
    group: 'content',
    emailSafe: true,
    create: () => ({ type: 'Button', props: { content: 'Button', variant: 'secondary' } }),
  },
  {
    id: 'image',
    label: 'Image',
    icon: 'image',
    group: 'content',
    emailSafe: true,
    create: () => ({ type: 'Image', props: { src: placeholder, alt: 'image', width: 200 } }),
  },
];
