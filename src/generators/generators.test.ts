import { describe, expect, it } from 'vitest';

import { sampleCard } from '../ir/sample';
import {
  type Distribute,
  type Frame,
  type Justify,
  type RowProps,
  type TokenLiterals,
} from '../ir/types';
import literals from '../theme/generated/tokens.literals.json';

import { emitAngularSource } from './angular';
import { emitHTML } from './html';
import { emitMJML } from './mjml';
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
    expect(emitMJML(sampleCard, literals as TokenLiterals)).toMatchSnapshot();
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
    expect(() => emitMJML({ target: 'email', root: { type: 'Row', children: [] } }, {})).toThrow(
      /Stack/,
    );
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
    expect(() => emitMJML(frame, literals as TokenLiterals)).toThrow(/Unknown token ref/);
  });

  it('throws if a non-Row container reaches the leaf flattener', () => {
    const frame: Frame = {
      target: 'email',
      root: { type: 'Stack', children: [{ type: 'Grid', props: { columns: 2 }, children: [] }] },
    };
    expect(() => emitMJML(frame, literals as TokenLiterals)).toThrow(/non-leaf/);
  });
});
