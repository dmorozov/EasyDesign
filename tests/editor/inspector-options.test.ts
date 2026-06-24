import { describe, expect, it } from 'vitest';

import {
  ALIGN_OPTS,
  DISTRIBUTE_OPTS,
  HEADING_OPTS,
  JUSTIFY_OPTS,
  type Opt,
  STYLE_LABEL,
  WRAP_OPTS,
} from '../../src/editor/inspector-options';
import { type Align, type Distribute, type Justify, type Wrap } from '../../src/ir/types';
import { type StyleKey } from '../../src/theme/design-tokens';
import { type TextStyle } from '../../src/theme/generated/typography';

// The presenter's invariant option lists are compile-forced off the IR/token unions (a missing member
// is a build error in the label maps). These pure tests pin that contract at RUNTIME too: each list
// set-EQUALS its union witness — so a value can neither silently vanish from a picker (the review's
// drift finding) nor sneak in — and every option is unique + labelled. The witnesses are typed by the
// union, so removing a union member breaks the witness at compile time; adding one is caught here.

const values = (opts: readonly Opt[]): string[] => opts.map((o) => o.value).sort();
const wellFormed = (opts: readonly Opt[]): void => {
  expect(new Set(opts.map((o) => o.value)).size).toBe(opts.length); // unique values
  expect(opts.every((o) => o.label.length > 0)).toBe(true); // every option labelled
};

describe('inspector-options — layout pickers cover exactly their IR union (drift guard)', () => {
  it('JUSTIFY_OPTS = Justify', () => {
    const witness: Justify[] = ['start', 'center', 'end', 'space-between', 'space-around'];
    expect(values(JUSTIFY_OPTS)).toEqual([...witness].sort());
    wellFormed(JUSTIFY_OPTS);
  });
  it('ALIGN_OPTS = Align', () => {
    const witness: Align[] = ['start', 'center', 'end', 'stretch'];
    expect(values(ALIGN_OPTS)).toEqual([...witness].sort());
    wellFormed(ALIGN_OPTS);
  });
  it('WRAP_OPTS = Wrap', () => {
    const witness: Wrap[] = ['nowrap', 'wrap'];
    expect(values(WRAP_OPTS)).toEqual([...witness].sort());
    wellFormed(WRAP_OPTS);
  });
  it('DISTRIBUTE_OPTS = Distribute', () => {
    const witness: Distribute[] = ['fit', 'fill'];
    expect(values(DISTRIBUTE_OPTS)).toEqual([...witness].sort());
    wellFormed(DISTRIBUTE_OPTS);
  });
});

describe('inspector-options — typography', () => {
  it('HEADING_OPTS covers every TextStyle, in scale order (the dropdown order)', () => {
    const witness: TextStyle[] = ['h1', 'h2', 'h3', 'body', 'caption', 'label'];
    expect(HEADING_OPTS.map((o) => o.value)).toEqual(witness);
    wellFormed(HEADING_OPTS);
  });
  it('STYLE_LABEL labels every StyleKey', () => {
    const keys: StyleKey[] = [
      'background',
      'padding',
      'borderRadius',
      'gap',
      'fontSize',
      'fontWeight',
    ];
    for (const k of keys) expect(STYLE_LABEL[k].length).toBeGreaterThan(0);
  });
});
