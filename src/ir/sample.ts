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

// A real web-page layout (ADR-0019): an AppShell grid hosting application chrome — an AppBar (brand +
// TopNav + logout) in the header, a SideNav in the left rail, and a Breadcrumb + content in main. The
// header Region uses `padding: space.none` (ADR-0019's zero-spacing token) so the bar is full-bleed
// while the surface background still separates it from the body. Web-only (AppShell can't flatten to
// MJML), so the generate runner exports it to HTML + the live canvas, not email.
export const sampleAppLayout: Frame = {
  target: 'web',
  root: {
    type: 'AppShell',
    children: [
      {
        type: 'Region',
        props: { area: 'header' },
        style: { background: 'color.surface', padding: 'space.none' }, // full-bleed bar (space.none)
        children: [
          {
            type: 'AppBar',
            style: { background: 'color.surface', padding: 'space.md' },
            children: [
              {
                type: 'Row',
                props: { align: 'center' },
                style: { gap: 'space.lg' },
                children: [
                  { type: 'Text', props: { content: 'Acme', variant: 'h3' } },
                  {
                    type: 'TopNav',
                    style: { gap: 'space.md' },
                    children: [
                      { type: 'NavLink', props: { label: 'Home', href: '#', active: true } },
                      { type: 'NavLink', props: { label: 'Features', href: '#' } },
                      { type: 'NavLink', props: { label: 'Pricing', href: '#' } },
                    ],
                  },
                ],
              },
              { type: 'Button', props: { content: 'Log out', variant: 'secondary' } },
            ],
          },
        ],
      },
      {
        type: 'Region',
        props: { area: 'left' },
        style: { background: 'color.page', padding: 'space.md' },
        children: [
          {
            type: 'SideNav',
            style: { gap: 'space.sm' },
            children: [
              { type: 'NavLink', props: { label: 'Dashboard', href: '#', active: true } },
              { type: 'NavLink', props: { label: 'Projects', href: '#' } },
              { type: 'NavLink', props: { label: 'Team', href: '#' } },
              { type: 'NavLink', props: { label: 'Settings', href: '#' } },
            ],
          },
        ],
      },
      {
        type: 'Region',
        props: { area: 'main' },
        style: { background: 'color.surface', padding: 'space.lg', gap: 'space.md' },
        children: [
          {
            type: 'Breadcrumb',
            style: { gap: 'space.sm' },
            children: [
              { type: 'NavLink', props: { label: 'Home', href: '#' } },
              { type: 'NavLink', props: { label: 'Projects', href: '#' } },
              { type: 'NavLink', props: { label: 'Acme Redesign', href: '#', active: true } },
            ],
          },
          { type: 'Text', props: { content: 'Project overview', variant: 'h2' } },
          {
            type: 'Text',
            props: {
              content: 'Track progress, assign work, and ship faster.',
              variant: 'body',
            },
          },
          {
            type: 'Row',
            style: { gap: 'space.md' },
            children: [
              { type: 'Button', props: { content: 'New task', variant: 'primary' } },
              { type: 'Button', props: { content: 'Invite', variant: 'secondary' } },
            ],
          },
        ],
      },
      {
        type: 'Region',
        props: { area: 'footer' },
        style: { background: 'color.page', padding: 'space.md' },
        children: [{ type: 'Text', props: { content: '© 2026 Acme, Inc.', variant: 'caption' } }],
      },
    ],
  },
};
