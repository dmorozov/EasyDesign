// src/generators/golden.test.ts — RP-11: the golden-output regression net.
//
// PURE-ADDITIVE safety harness (zero production change). A committed snapshot per
// Export Target over a corpus that exercises the FULL IR vocabulary, so the
// emitter-touching refactors that follow (RP-3 typography tokenization, RP-9 the
// typed renderer registry) review a snapshot DIFF instead of hoping. Every later
// step that changes an emitter must justify its diff here.
//
// Split by what each target can represent:
//   - EMAIL-SAFE fixtures (Stack root; children are leaves or Row-of-leaves) run
//     through ALL FOUR targets — html / react / angular / mjml.
//   - WEB-ONLY fixtures (Grid / Column / nested containers) run through the three
//     web targets only; MJML deliberately rejects them (ADR-0006/0008), so feeding
//     them to emitMJML would throw, not regress.
// The canonical rich `sampleCard` keeps its own golden block in generators.test.ts;
// this corpus isolates one feature per fixture for legible diffs.
import { describe, expect, it } from 'vitest';

import { emitAngularSource } from '../../src/generators/angular';
import { emitHTML } from '../../src/generators/html';
import { emitMJML } from '../../src/generators/mjml';
import { emitReactSource } from '../../src/generators/react';
import { type Frame } from '../../src/ir/types';
import { catalog } from '../../src/theme/design-tokens';

// Short, stable image source — we snapshot generator SOURCE, not delivered email,
// so a plain URL keeps the goldens readable (vs. the sample's inline data URI).
const IMG = 'https://cdn.example.com/banner.png';

interface GoldenFixture {
  readonly name: string;
  readonly frame: Frame;
  /** Also exercised through MJML (Stack root, leaf / Row-of-leaf children only). */
  readonly emailSafe: boolean;
}

// One feature isolated per fixture. Collectively they cover: every container
// (Stack/Row/Column/Grid), distribute fit+fill, every Justify/Align/Wrap value,
// every leaf variant (Text h2/body, Button primary/secondary, Image width/no-width),
// and the container style keys (background/padding/borderRadius/gap).
const FIXTURES: readonly GoldenFixture[] = [
  // ---- email-safe (all four targets) ------------------------------------
  {
    name: 'text-variants',
    emailSafe: true,
    frame: {
      target: 'email',
      root: {
        type: 'Stack',
        style: { background: 'color.surface', padding: 'space.lg', gap: 'space.md' },
        children: [
          { type: 'Text', props: { content: 'Heading', variant: 'h2' } },
          { type: 'Text', props: { content: 'Body copy goes here.', variant: 'body' } },
        ],
      },
    },
  },
  {
    name: 'buttons',
    emailSafe: true,
    frame: {
      target: 'email',
      root: {
        type: 'Stack',
        children: [
          {
            type: 'Row',
            style: { gap: 'space.md' },
            children: [
              { type: 'Button', props: { content: 'Save', variant: 'primary' } },
              { type: 'Button', props: { content: 'Cancel', variant: 'secondary' } },
            ],
          },
        ],
      },
    },
  },
  {
    name: 'images',
    emailSafe: true,
    frame: {
      target: 'email',
      root: {
        type: 'Stack',
        style: { gap: 'space.md' },
        children: [
          { type: 'Image', props: { src: IMG, alt: 'Sized banner', width: 320 } },
          { type: 'Image', props: { src: IMG, alt: 'Fluid banner' } },
        ],
      },
    },
  },
  {
    name: 'row-fit-justify',
    emailSafe: true,
    frame: {
      target: 'email',
      root: {
        type: 'Stack',
        children: [
          {
            type: 'Row',
            props: { distribute: 'fit', justify: 'space-between', align: 'center' },
            style: { gap: 'space.md' },
            children: [
              { type: 'Button', props: { content: 'Left', variant: 'primary' } },
              { type: 'Button', props: { content: 'Right', variant: 'secondary' } },
            ],
          },
        ],
      },
    },
  },
  {
    name: 'row-fill',
    emailSafe: true,
    frame: {
      target: 'email',
      root: {
        type: 'Stack',
        children: [
          {
            type: 'Row',
            props: { distribute: 'fill' },
            style: { gap: 'space.sm' },
            children: [
              { type: 'Button', props: { content: 'A', variant: 'primary' } },
              { type: 'Button', props: { content: 'B', variant: 'secondary' } },
              { type: 'Button', props: { content: 'C', variant: 'primary' } },
            ],
          },
        ],
      },
    },
  },
  {
    name: 'stack-flow-styled',
    emailSafe: true,
    frame: {
      target: 'email',
      root: {
        type: 'Stack',
        props: { justify: 'center', align: 'stretch' },
        style: {
          background: 'color.surface',
          padding: 'space.lg',
          borderRadius: 'radius.lg',
          gap: 'space.md',
        },
        children: [
          { type: 'Text', props: { content: 'Title', variant: 'h2' } },
          { type: 'Text', props: { content: 'Subtitle', variant: 'body' } },
          { type: 'Button', props: { content: 'Go', variant: 'primary' } },
        ],
      },
    },
  },
  {
    // This ADR — the email-SAFE display-only leaf: a Divider in a leaf-run, exercised through ALL FOUR
    // targets (it lands as <hr> on web and <mj-divider> in email — the Capability-A path end to end).
    name: 'divider',
    emailSafe: true,
    frame: {
      target: 'email',
      root: {
        type: 'Stack',
        style: { gap: 'space.md' },
        children: [
          { type: 'Text', props: { content: 'Above the rule', variant: 'body' } },
          { type: 'Divider' },
          { type: 'Text', props: { content: 'Below the rule', variant: 'body' } },
        ],
      },
    },
  },

  {
    // ADR-0021 — the Data Table: the 2nd email-SAFE Component, exercised through ALL FOUR targets. It
    // exports as a semantic <table> (caption + <thead> of <th scope="col"> + <tbody> of <td>) on web and
    // through MJML's native <mj-table> in email. Header lives on the ROW (the single source of truth).
    name: 'datatable',
    emailSafe: true,
    frame: {
      target: 'email',
      root: {
        type: 'Stack',
        style: { gap: 'space.md' },
        children: [
          {
            type: 'DataTable',
            props: { caption: 'People' },
            children: [
              {
                type: 'TableRow',
                props: { header: true },
                children: [
                  { type: 'TableCell', props: { content: 'Name' } },
                  { type: 'TableCell', props: { content: 'Role' } },
                ],
              },
              {
                type: 'TableRow',
                props: { header: false },
                children: [
                  { type: 'TableCell', props: { content: 'Ada Lovelace' } },
                  { type: 'TableCell', props: { content: 'Engineer' } },
                ],
              },
            ],
          },
        ],
      },
    },
  },

  // ---- web-only (html / react / angular; MJML rejects these shapes) ------
  {
    name: 'grid',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Grid',
        props: { columns: 3, justify: 'center', align: 'end' },
        style: { gap: 'space.md', padding: 'space.lg' },
        children: [
          { type: 'Text', props: { content: 'One', variant: 'body' } },
          { type: 'Button', props: { content: 'Two', variant: 'primary' } },
          { type: 'Image', props: { src: IMG, alt: 'Three', width: 80 } },
        ],
      },
    },
  },
  {
    name: 'column-wrap',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Column',
        props: { justify: 'end', align: 'center', wrap: 'wrap' },
        style: { gap: 'space.sm' },
        children: [
          { type: 'Button', props: { content: 'A', variant: 'primary' } },
          { type: 'Button', props: { content: 'B', variant: 'secondary' } },
        ],
      },
    },
  },
  {
    // Every Justify value, one per Row.
    name: 'justify-matrix',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Stack',
        style: { gap: 'space.sm' },
        children: (['start', 'center', 'end', 'space-between', 'space-around'] as const).map(
          (justify) => ({
            type: 'Row',
            props: { justify },
            children: [
              { type: 'Button', props: { content: justify, variant: 'primary' } },
              { type: 'Button', props: { content: 'x', variant: 'secondary' } },
            ],
          }),
        ),
      },
    },
  },
  {
    // Every Align value + both Wrap values, one per Column.
    name: 'align-wrap-matrix',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Stack',
        style: { gap: 'space.sm' },
        children: [
          {
            type: 'Column',
            props: { align: 'start', wrap: 'nowrap' },
            children: [{ type: 'Button', props: { content: 'start', variant: 'primary' } }],
          },
          {
            type: 'Column',
            props: { align: 'center' },
            children: [{ type: 'Button', props: { content: 'center', variant: 'primary' } }],
          },
          {
            type: 'Column',
            props: { align: 'end' },
            children: [{ type: 'Button', props: { content: 'end', variant: 'primary' } }],
          },
          {
            type: 'Column',
            props: { align: 'stretch', wrap: 'wrap' },
            children: [
              { type: 'Button', props: { content: 'stretch', variant: 'primary' } },
              { type: 'Button', props: { content: 'wrap', variant: 'secondary' } },
            ],
          },
        ],
      },
    },
  },
  {
    // RP-10 / ADR-0016 — the compound Component: a RadioGroup (component container) of Radios. Web-only
    // (email-unsafe). Locks the <fieldset>/<legend>/<label><input type="radio"> export markup.
    name: 'radiogroup',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Stack',
        style: { gap: 'space.md' },
        children: [
          {
            type: 'RadioGroup',
            props: { label: 'Plan' },
            children: [
              { type: 'Radio', props: { value: 'free', label: 'Free' } },
              { type: 'Radio', props: { value: 'pro', label: 'Pro' } },
            ],
          },
        ],
      },
    },
  },
  {
    // This ADR — Paper: a surface LAYOUT container (a styled flow column). Web-only.
    name: 'paper',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Paper',
        style: {
          background: 'color.surface',
          padding: 'space.lg',
          borderRadius: 'radius.lg',
          gap: 'space.md',
        },
        children: [
          { type: 'Text', props: { content: 'On paper', variant: 'h3' } },
          { type: 'Text', props: { content: 'A surface you fill.', variant: 'body' } },
        ],
      },
    },
  },
  {
    // This ADR — Stepper (component container) of Steps in both orientations + every status. Web-only.
    name: 'stepper-horizontal',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Stepper',
        props: { orientation: 'horizontal' },
        children: [
          { type: 'Step', props: { label: 'Account', status: 'complete' } },
          { type: 'Step', props: { label: 'Profile', status: 'current' } },
          { type: 'Step', props: { label: 'Done', status: 'upcoming' } },
        ],
      },
    },
  },
  {
    name: 'stepper-vertical',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Stepper',
        props: { orientation: 'vertical' },
        children: [
          { type: 'Step', props: { label: 'Account', status: 'complete' } },
          { type: 'Step', props: { label: 'Profile', status: 'current' } },
        ],
      },
    },
  },
  {
    // This ADR — ToolBar (component container) of ToolButtons: labeled AND icon-only (cleared label).
    // Web-only. Locks the <div role="toolbar"> + <button><svg>... export markup.
    name: 'toolbar',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'ToolBar',
        props: { label: 'Formatting' },
        style: { background: 'color.surface', padding: 'space.sm', gap: 'space.sm' },
        children: [
          { type: 'ToolButton', props: { icon: 'undo', label: 'Undo' } },
          { type: 'ToolButton', props: { icon: 'image', label: '' } },
        ],
      },
    },
  },
  {
    // This ADR — MenuBar (component container) reusing the NavLink slot leaf. Web-only. Locks the
    // <nav><ul role="menubar"><li role="none"> application-bar markup (distinct from TopNav).
    name: 'menubar',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'MenuBar',
        style: { background: 'color.surface', padding: 'space.sm' },
        children: [
          { type: 'NavLink', props: { label: 'File', href: '#', active: true } },
          { type: 'NavLink', props: { label: 'Edit', href: '#' } },
        ],
      },
    },
  },
  {
    // ADR-0021 — Pagination: a <nav aria-label="Pagination"><ul> of boxed page links, reusing the NavLink
    // slot leaf (the current page carries aria-current). Web-only (a page nav has no MJML equivalent).
    name: 'pagination',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Pagination',
        children: [
          { type: 'NavLink', props: { label: 'Prev', href: '#' } },
          { type: 'NavLink', props: { label: '1', href: '#' } },
          { type: 'NavLink', props: { label: '2', href: '#', active: true } },
          { type: 'NavLink', props: { label: 'Next', href: '#' } },
        ],
      },
    },
  },
  {
    // ADR-0022 — Tabs: a static accessible snapshot on export (a role="tablist" of role="tab" buttons +
    // one role="tabpanel" per panel; the first selected, the rest hidden). Web-only; panels hold any
    // content. The canvas is interactive (React Aria); this locks the static-export markup.
    name: 'tabs',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Tabs',
        props: { orientation: 'horizontal' },
        children: [
          {
            type: 'TabPanel',
            props: { label: 'Overview' },
            children: [{ type: 'Text', props: { content: 'Overview content', variant: 'body' } }],
          },
          {
            type: 'TabPanel',
            props: { label: 'Settings' },
            children: [{ type: 'Button', props: { content: 'Save', variant: 'primary' } }],
          },
        ],
      },
    },
  },
  {
    // ADR-0022 — Accordion: native <details>/<summary> sections (multi-open default; the first open).
    // Web-only; sections hold any content. (The single-open <details name> variant is a palette preset.)
    name: 'accordion',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Accordion',
        props: { exclusive: false },
        children: [
          {
            type: 'AccordionItem',
            props: { title: 'Shipping', open: true },
            children: [{ type: 'Text', props: { content: 'Ships in 3 days.', variant: 'body' } }],
          },
          {
            type: 'AccordionItem',
            props: { title: 'Returns', open: false },
            children: [{ type: 'Text', props: { content: '30-day returns.', variant: 'body' } }],
          },
        ],
      },
    },
  },
  {
    // This ADR — Spacer: a flexible flex:1 gap pushing siblings apart. Web-only (flex has no email model).
    name: 'spacer',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Row',
        children: [
          { type: 'Button', props: { content: 'Left', variant: 'primary' } },
          { type: 'Spacer' },
          { type: 'Button', props: { content: 'Right', variant: 'secondary' } },
        ],
      },
    },
  },
  {
    // Recursion depth + mixed containers in one tree.
    name: 'nested-deep',
    emailSafe: false,
    frame: {
      target: 'web',
      root: {
        type: 'Stack',
        style: { background: 'color.surface', padding: 'space.lg', gap: 'space.md' },
        children: [
          {
            type: 'Row',
            props: { distribute: 'fit' },
            style: { gap: 'space.md' },
            children: [
              {
                type: 'Column',
                style: { gap: 'space.sm' },
                children: [
                  { type: 'Text', props: { content: 'Col head', variant: 'h2' } },
                  { type: 'Text', props: { content: 'col body', variant: 'body' } },
                ],
              },
              {
                type: 'Grid',
                props: { columns: 2 },
                style: { gap: 'space.sm' },
                children: [
                  { type: 'Button', props: { content: 'x', variant: 'primary' } },
                  { type: 'Image', props: { src: IMG, alt: 'thumb', width: 60 } },
                ],
              },
            ],
          },
        ],
      },
    },
  },
];

const WEB_TARGETS = [
  { target: 'html', emit: emitHTML },
  { target: 'react', emit: emitReactSource },
  { target: 'angular', emit: emitAngularSource },
] as const;

describe('RP-11 golden net — IR → web targets (full IR vocabulary)', () => {
  for (const fx of FIXTURES) {
    for (const { target, emit } of WEB_TARGETS) {
      it(`${fx.name} → ${target}`, () => {
        expect(emit(fx.frame)).toMatchSnapshot();
      });
    }
  }
});

describe('RP-11 golden net — IR → MJML (email-safe fixtures)', () => {
  const lit = catalog.withOverrides({});
  for (const fx of FIXTURES.filter((f) => f.emailSafe)) {
    it(`${fx.name} → mjml`, () => {
      expect(emitMJML(fx.frame, lit)).toMatchSnapshot();
    });
  }
});
