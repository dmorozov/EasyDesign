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
