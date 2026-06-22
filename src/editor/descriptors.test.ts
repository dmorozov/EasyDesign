import { describe, expect, it } from 'vitest';

import { type Node } from '../ir/types';

import { DESCRIPTORS } from './descriptors';
import { PALETTE } from './palette';

// Mapped-type completeness (a row per node type) is enforced by the COMPILER, not here. These cover the
// runtime facts the type system can't: create()/type parity, the email rule, and the control/style sets.
const TYPES = Object.keys(DESCRIPTORS) as Node['type'][];

describe('DESCRIPTORS — the single source of node-type facts (RP-2)', () => {
  it('create() mints a node of its own type (parity by construction)', () => {
    for (const type of TYPES) {
      expect(DESCRIPTORS[type].create().type).toBe(type);
    }
  });

  it('only Grid is email-unsafe (ADR-0006)', () => {
    for (const type of TYPES) {
      expect(DESCRIPTORS[type].emailSafe).toBe(type !== 'Grid');
    }
  });

  it('containers expose layout controls + style keys; leaves expose neither', () => {
    for (const type of TYPES) {
      const d = DESCRIPTORS[type];
      if ('children' in d.create()) {
        expect(d.styleKeys.length).toBeGreaterThan(0);
        expect(d.controls).toContain('justify');
        expect(d.controls).not.toContain('content');
      } else {
        expect(d.styleKeys).toHaveLength(0);
        expect(d.controls).not.toContain('justify');
      }
    }
  });

  it('only Row offers distribute; only non-Grid containers offer wrap; leaves offer content', () => {
    expect(DESCRIPTORS.Row.controls).toContain('distribute');
    expect(DESCRIPTORS.Stack.controls).not.toContain('distribute');
    expect(DESCRIPTORS.Stack.controls).toContain('wrap');
    expect(DESCRIPTORS.Grid.controls).not.toContain('wrap');
    expect(DESCRIPTORS.Text.controls).toEqual(['content']);
    expect(DESCRIPTORS.Button.controls).toEqual(['content']);
  });
});

// The old frames.test drift-guard (isNodeEmailSafe(type) === item.emailSafe) is gone: both now derive
// from the descriptor, so they CAN'T drift. This is its successor — every Palette entry projects its
// node type's facts (RP-2), incl. the two Button variants + the Heading/Text split.
describe('PALETTE — projects per-type facts from the descriptor', () => {
  it('every entry inherits group + email-safety from its node type', () => {
    for (const item of PALETTE) {
      const d = DESCRIPTORS[item.create().type];
      expect(item.emailSafe).toBe(d.emailSafe);
      expect(item.group).toBe(d.group);
    }
  });
  it('keeps every node type exportable AND surfaces the expected entries', () => {
    expect(PALETTE.map((i) => i.id)).toEqual([
      'stack',
      'row',
      'grid',
      'heading',
      'text',
      'button-primary',
      'button-secondary',
      'image',
    ]);
  });
});
