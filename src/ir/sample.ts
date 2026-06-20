import { type Frame } from './types';

// Self-contained banner so demos render offline & deterministically.
// (Real emails must use a hosted URL — email clients block data URIs.)
const banner =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='560' height='180'%3E" +
  "%3Crect width='560' height='180' fill='%234f46e5'/%3E" +
  "%3Ctext x='280' y='104' font-family='Helvetica,Arial,sans-serif' font-size='30' " +
  "fill='white' text-anchor='middle'%3EEasyDesign%3C/text%3E%3C/svg%3E";

// The hand-authored reference design. Email-safe so all four generators run on it.
export const sampleCard: Frame = {
  target: 'email',
  root: {
    type: 'Stack',
    style: {
      background: 'color.surface',
      padding: 'space.lg',
      borderRadius: 'radius.lg',
      gap: 'space.md',
    },
    children: [
      { type: 'Image', props: { src: banner, alt: 'Welcome to EasyDesign', width: 560 } },
      { type: 'Text', props: { content: 'Welcome aboard', variant: 'h2' } },
      {
        type: 'Text',
        props: {
          content: 'Your account is ready. Start building your first design in minutes.',
          variant: 'body',
        },
      },
      {
        type: 'Row',
        style: { gap: 'space.md' },
        children: [
          { type: 'Button', props: { content: 'Get started', variant: 'primary' } },
          { type: 'Button', props: { content: 'Learn more', variant: 'secondary' } },
        ],
      },
    ],
  },
};
