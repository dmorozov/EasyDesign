import { describe, expect, it } from 'vitest';

import { sampleCard } from '../ir/sample';
import { type Distribute, type Frame, type Justify, type RowProps } from '../ir/types';
import { catalog } from '../theme/design-tokens';

import { emitAngularSource } from './angular';
import { emitHTML } from './html';
import { classifyCardChild, emitMJML } from './mjml';
import { emitReactSource } from './react';

// A minimal two-button Row, for exercising the distribute / justify behaviour.
function rowFrame(distribute?: Distribute, justify?: Justify): Frame {
  const props: RowProps = {};
  if (distribute) props.distribute = distribute;
  if (justify) props.justify = justify;
  return {
    target: 'web',
    root: {
      type: 'Row',
      props,
      children: [
        { type: 'Button', props: { content: 'A', variant: 'primary' } },
        { type: 'Button', props: { content: 'B', variant: 'secondary' } },
      ],
    },
  };
}

describe('generators — golden output on the sample (regression guard)', () => {
  it('html', () => {
    expect(emitHTML(sampleCard)).toMatchSnapshot();
  });
  it('react', () => {
    expect(emitReactSource(sampleCard)).toMatchSnapshot();
  });
  it('angular', () => {
    expect(emitAngularSource(sampleCard)).toMatchSnapshot();
  });
  it('mjml', () => {
    expect(emitMJML(sampleCard, catalog.withOverrides({}))).toMatchSnapshot();
  });
});

describe('Row distribute (ADR-0010) — every web target', () => {
  const WEB = [
    { name: 'html', emit: emitHTML, flex: 'flex:1' },
    { name: 'react', emit: emitReactSource, flex: 'flex: 1' },
    { name: 'angular', emit: emitAngularSource, flex: 'flex:1' },
  ] as const;

  for (const { name, emit, flex } of WEB) {
    it(`${name}: fit (default) does NOT wrap children`, () => {
      expect(emit(rowFrame())).not.toContain(flex);
    });
    it(`${name}: fill wraps each child in equal columns`, () => {
      expect(emit(rowFrame('fill')).split(flex).length - 1).toBe(2);
    });
  }

  it('justify reaches the output on a fit Row (there is free space to distribute)', () => {
    expect(emitHTML(rowFrame('fit', 'space-between'))).toContain('justify-content:space-between');
    expect(emitReactSource(rowFrame('fit', 'space-between'))).toContain(
      "justifyContent: 'space-between'",
    );
  });
});

describe('MJML guardrails (ADR-0006/0008)', () => {
  it('throws on a non-Stack root rather than emitting broken email', () => {
    expect(() =>
      emitMJML({ target: 'email', root: { type: 'Row', children: [] } }, catalog.withOverrides({})),
    ).toThrow(/Stack/);
  });

  it('throws on an unknown token ref (caught at email-build time, not silently)', () => {
    const frame: Frame = {
      target: 'email',
      root: {
        type: 'Stack',
        style: { background: 'color.nope' },
        children: [{ type: 'Text', props: { content: 'x', variant: 'body' } }],
      },
    };
    expect(() => emitMJML(frame, catalog.withOverrides({}))).toThrow(/Unknown token ref/);
  });

  it('rejects an unsupported nested container in the email card with a clear message (RP-8)', () => {
    // A Grid/Column/Stack at card level has no email flattening — the exhaustive card-child dispatch
    // rejects it explicitly (ADR-0006/0008), rather than silently falling through to the leaf throw.
    const grid: Frame = {
      target: 'email',
      root: { type: 'Stack', children: [{ type: 'Grid', props: { columns: 2 }, children: [] }] },
    };
    expect(() => emitMJML(grid, catalog.withOverrides({}))).toThrow(/nested Grid/);
    const column: Frame = {
      target: 'email',
      root: { type: 'Stack', children: [{ type: 'Column', children: [] }] },
    };
    expect(() => emitMJML(column, catalog.withOverrides({}))).toThrow(/nested Column/);
  });

  it('a container nested inside a Row column still hits the leaf-flattener guard (RP-8)', () => {
    // The Row→column mapping takes only leaves; a container child is caught by renderLeaf's runtime
    // guardrail (defense in depth — the IR can't yet forbid it at compile time; that is RP-10).
    const frame: Frame = {
      target: 'email',
      root: {
        type: 'Stack',
        children: [{ type: 'Row', children: [{ type: 'Column', children: [] }] }],
      },
    };
    expect(() => emitMJML(frame, catalog.withOverrides({}))).toThrow(/non-leaf/);
  });

  it('classifyCardChild maps each card child to its email role (RP-8)', () => {
    expect(classifyCardChild({ type: 'Text', props: { content: 'x', variant: 'body' } })).toEqual({
      role: 'leaf',
      node: { type: 'Text', props: { content: 'x', variant: 'body' } },
    });
    expect(classifyCardChild({ type: 'Row', children: [] }).role).toBe('row');
    expect(classifyCardChild({ type: 'Grid', props: { columns: 2 }, children: [] })).toEqual({
      role: 'unsupported',
      type: 'Grid',
    });
    expect(classifyCardChild({ type: 'Stack', children: [] }).role).toBe('unsupported');
  });

  it('a malformed type-scale override never ships line-height="NaNpx" (RP-6 guard)', () => {
    // An h2 binds font.size.2xl; a non-numeric Theme override would make size×ratio NaN. The guard
    // falls the line-height back to the unitless ratio so the email stays clean (the flagship gate).
    const frame: Frame = {
      target: 'email',
      root: { type: 'Stack', children: [{ type: 'Text', props: { content: 'x', variant: 'h2' } }] },
    };
    const out = emitMJML(frame, catalog.withOverrides({ 'font.size.2xl': 'abc' }));
    expect(out).not.toContain('NaN');
    expect(out).toContain('line-height="1.25"'); // the binding's base ratio, not NaNpx
  });
});
