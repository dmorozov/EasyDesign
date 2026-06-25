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
      // A Data Table (ADR-0021) INSIDE the email card — proving the all-four-target path: it exports to
      // MJML's native <mj-table> (cells are plain text, exactly what mj-table accepts). The 2nd email-safe
      // Component after Divider.
      {
        type: 'DataTable',
        props: { caption: 'Your plan' },
        children: [
          {
            type: 'TableRow',
            props: { header: true },
            children: [
              { type: 'TableCell', props: { content: 'Feature' } },
              { type: 'TableCell', props: { content: 'Included' } },
            ],
          },
          {
            type: 'TableRow',
            props: { header: false },
            children: [
              { type: 'TableCell', props: { content: 'Projects' } },
              { type: 'TableCell', props: { content: 'Unlimited' } },
            ],
          },
          {
            type: 'TableRow',
            props: { header: false },
            children: [
              { type: 'TableCell', props: { content: 'Seats' } },
              { type: 'TableCell', props: { content: '5' } },
            ],
          },
        ],
      },
      // The email-SAFE display-only leaf (this ADR): a rule before the CTA, exported to <mj-divider>.
      { type: 'Divider' },
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
          // A MenuBar (this ADR): a semantic role="menubar" application menu, distinct from the AppBar's
          // TopNav site links.
          {
            type: 'MenuBar',
            style: { background: 'color.surface', padding: 'space.sm' },
            children: [
              { type: 'NavLink', props: { label: 'File', href: '#', active: true } },
              { type: 'NavLink', props: { label: 'Edit', href: '#' } },
              { type: 'NavLink', props: { label: 'View', href: '#' } },
              { type: 'NavLink', props: { label: 'Help', href: '#' } },
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
          // The common design components (this ADR): a ToolBar of icon/label buttons, a Stepper, a
          // Divider rule, and a Paper surface whose Row uses a Spacer to push the action to the right.
          {
            type: 'ToolBar',
            props: { label: 'Formatting' },
            style: {
              background: 'color.page',
              padding: 'space.sm',
              borderRadius: 'radius.lg',
              gap: 'space.sm',
            },
            children: [
              { type: 'ToolButton', props: { icon: 'undo', label: 'Undo' } },
              { type: 'ToolButton', props: { icon: 'redo', label: 'Redo' } },
              { type: 'ToolButton', props: { icon: 'image', label: '' } },
              { type: 'ToolButton', props: { icon: 'code', label: '' } },
            ],
          },
          {
            type: 'Stepper',
            props: { orientation: 'horizontal' },
            children: [
              { type: 'Step', props: { label: 'Account', status: 'complete' } },
              { type: 'Step', props: { label: 'Profile', status: 'current' } },
              { type: 'Step', props: { label: 'Done', status: 'upcoming' } },
            ],
          },
          { type: 'Divider' },
          {
            type: 'Paper',
            style: {
              background: 'color.page',
              padding: 'space.lg',
              borderRadius: 'radius.lg',
              gap: 'space.md',
            },
            children: [
              { type: 'Text', props: { content: 'Surface panel', variant: 'h3' } },
              {
                type: 'Row',
                props: { align: 'center' },
                style: { gap: 'space.md' },
                children: [
                  { type: 'Text', props: { content: 'Pushed apart by a Spacer', variant: 'body' } },
                  { type: 'Spacer' },
                  { type: 'Button', props: { content: 'Action', variant: 'secondary' } },
                ],
              },
            ],
          },
          // The complex compound components (ADR-0021): a Data Table (caption + a header row + body rows)
          // and a Pagination bar beneath it.
          {
            type: 'DataTable',
            props: { caption: 'Team members' },
            children: [
              {
                type: 'TableRow',
                props: { header: true },
                children: [
                  { type: 'TableCell', props: { content: 'Name' } },
                  { type: 'TableCell', props: { content: 'Role' } },
                  { type: 'TableCell', props: { content: 'Status' } },
                ],
              },
              {
                type: 'TableRow',
                props: { header: false },
                children: [
                  { type: 'TableCell', props: { content: 'Ada Lovelace' } },
                  { type: 'TableCell', props: { content: 'Engineer' } },
                  { type: 'TableCell', props: { content: 'Active' } },
                ],
              },
              {
                type: 'TableRow',
                props: { header: false },
                children: [
                  { type: 'TableCell', props: { content: 'Alan Turing' } },
                  { type: 'TableCell', props: { content: 'Researcher' } },
                  { type: 'TableCell', props: { content: 'Active' } },
                ],
              },
            ],
          },
          {
            type: 'Pagination',
            children: [
              { type: 'NavLink', props: { label: '‹ Prev', href: '#' } },
              { type: 'NavLink', props: { label: '1', href: '#' } },
              { type: 'NavLink', props: { label: '2', href: '#', active: true } },
              { type: 'NavLink', props: { label: '3', href: '#' } },
              { type: 'NavLink', props: { label: 'Next ›', href: '#' } },
            ],
          },
          // The interactive compounds (ADR-0022): a Tabs strip (its panels hold arbitrary content —
          // text + a button) and a multi-open Accordion of native <details> sections. Web-only.
          {
            type: 'Tabs',
            props: { orientation: 'horizontal' },
            children: [
              {
                type: 'TabPanel',
                props: { label: 'Overview' },
                children: [
                  {
                    type: 'Text',
                    props: { content: 'A quick summary of the project.', variant: 'body' },
                  },
                ],
              },
              {
                type: 'TabPanel',
                props: { label: 'Activity' },
                children: [
                  {
                    type: 'Text',
                    props: { content: 'Recent activity shows up here.', variant: 'body' },
                  },
                  { type: 'Button', props: { content: 'View all', variant: 'secondary' } },
                ],
              },
            ],
          },
          {
            type: 'Accordion',
            props: { exclusive: false },
            children: [
              {
                type: 'AccordionItem',
                props: { title: 'What is included?', open: true },
                children: [
                  {
                    type: 'Text',
                    props: { content: 'Everything in the Pro plan.', variant: 'body' },
                  },
                ],
              },
              {
                type: 'AccordionItem',
                props: { title: 'How do I cancel?', open: false },
                children: [
                  {
                    type: 'Text',
                    props: { content: 'Cancel anytime from Settings.', variant: 'body' },
                  },
                ],
              },
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
