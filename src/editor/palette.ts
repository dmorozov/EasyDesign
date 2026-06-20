import { type Node } from '../ir/types';

/** A draggable Component Palette entry. `create()` mints a fresh IR node. */
export interface PaletteItem {
  id: string;
  label: string;
  /** False items are hidden in email Frames (ADR-0006). */
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
    emailSafe: true,
    create: () => ({ type: 'Stack', style: { gap: 'space.md' }, children: [] }),
  },
  {
    id: 'row',
    label: 'Row',
    emailSafe: true,
    create: () => ({ type: 'Row', style: { gap: 'space.md' }, children: [] }),
  },
  {
    id: 'grid',
    label: 'Grid (2-col)',
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
    emailSafe: true,
    create: () => ({ type: 'Text', props: { content: 'Heading', variant: 'h2' } }),
  },
  {
    id: 'text',
    label: 'Text',
    emailSafe: true,
    create: () => ({ type: 'Text', props: { content: 'Body text', variant: 'body' } }),
  },
  {
    id: 'button-primary',
    label: 'Button (primary)',
    emailSafe: true,
    create: () => ({ type: 'Button', props: { content: 'Button', variant: 'primary' } }),
  },
  {
    id: 'button-secondary',
    label: 'Button (secondary)',
    emailSafe: true,
    create: () => ({ type: 'Button', props: { content: 'Button', variant: 'secondary' } }),
  },
  {
    id: 'image',
    label: 'Image',
    emailSafe: true,
    create: () => ({ type: 'Image', props: { src: placeholder, alt: 'image', width: 200 } }),
  },
];

export function paletteFor(target: 'web' | 'email'): PaletteItem[] {
  return target === 'email' ? PALETTE.filter((item) => item.emailSafe) : PALETTE;
}
