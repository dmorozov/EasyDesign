import { describe, expect, it } from 'vitest';

import { type Node } from '../ir/types';
import { isLayoutContainer } from '../ir/walk';

import { canContain, DESCRIPTORS, RESTRICTED_CHILD_TYPES } from './descriptors';
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

  it('email-unsafe = Grid + the interactive RadioGroup/Radio (ADR-0006/0016)', () => {
    const unsafe = new Set<Node['type']>(['Grid', 'RadioGroup', 'Radio']);
    for (const type of TYPES) {
      expect(DESCRIPTORS[type].emailSafe).toBe(!unsafe.has(type));
    }
  });

  it('LAYOUT containers expose layout controls + container style keys; a component container and a leaf do not', () => {
    for (const type of TYPES) {
      const d = DESCRIPTORS[type];
      const node = d.create();
      if (isLayoutContainer(node)) {
        expect(d.styleKeys).toContain('background');
        expect(d.controls).toContain('justify');
        expect(d.controls).not.toContain('content');
      } else if ('children' in node) {
        // component container (RadioGroup): renders as a Component, so no layout controls/style keys —
        // it carries a slot rule (allowedChildren) instead (RP-10).
        expect(d.controls).toHaveLength(0);
        expect(d.allowedChildren).toBeDefined();
      } else {
        expect(d.controls).not.toContain('justify');
      }
    }
  });

  it('Text exposes free-form typography style keys; the other leaves expose none (RP-4)', () => {
    expect(DESCRIPTORS.Text.styleKeys).toEqual(['fontSize', 'fontWeight']);
    expect(DESCRIPTORS.Button.styleKeys).toHaveLength(0);
    expect(DESCRIPTORS.Image.styleKeys).toHaveLength(0);
  });

  it('only Row offers distribute; only non-Grid containers offer wrap; Text offers the named-style picker', () => {
    expect(DESCRIPTORS.Row.controls).toContain('distribute');
    expect(DESCRIPTORS.Stack.controls).not.toContain('distribute');
    expect(DESCRIPTORS.Stack.controls).toContain('wrap');
    expect(DESCRIPTORS.Grid.controls).not.toContain('wrap');
    expect(DESCRIPTORS.Text.controls).toEqual(['heading']); // the variant picker; the text is a textField
    expect(DESCRIPTORS.Button.controls).toEqual([]);
  });

  it('text props are declared per type as type-checked `textFields` (subsumes the old content control)', () => {
    expect(DESCRIPTORS.Text.textFields).toEqual([{ key: 'content', label: 'Text' }]);
    expect(DESCRIPTORS.Button.textFields).toEqual([{ key: 'content', label: 'Label' }]);
    expect(DESCRIPTORS.RadioGroup.textFields).toEqual([{ key: 'label', label: 'Group label' }]);
    expect(DESCRIPTORS.Radio.textFields).toEqual([
      { key: 'label', label: 'Label' },
      { key: 'value', label: 'Value' },
    ]);
    expect(DESCRIPTORS.Image.textFields).toBeUndefined();
    // every declared key is a real prop of its node type (mostly compile-enforced; this guards the data)
    for (const type of TYPES) {
      const node = DESCRIPTORS[type].create();
      for (const f of DESCRIPTORS[type].textFields ?? []) {
        expect(node.props && f.key in node.props).toBe(true);
      }
    }
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
      'radiogroup',
      'radio',
    ]);
  });
  it('every entry carries its underlying node type (read by the drop validator, RP-10)', () => {
    for (const item of PALETTE) {
      expect(item.nodeType).toBe(item.create().type);
    }
  });
});

// RP-10 / ADR-0016 — the allowed-children (slot) rule, derived from the descriptors.
describe('canContain — the allowed-children rule (RP-10)', () => {
  it('a constrained parent admits only its listed slot types (RadioGroup → Radio)', () => {
    expect(canContain('RadioGroup', 'Radio')).toBe(true);
    expect(canContain('RadioGroup', 'Button')).toBe(false);
    expect(canContain('RadioGroup', 'Text')).toBe(false);
  });
  it('an open parent admits anything that is NOT a slot-restricted child', () => {
    expect(canContain('Stack', 'Button')).toBe(true);
    expect(canContain('Stack', 'RadioGroup')).toBe(true); // RadioGroup itself is not slot-restricted
    expect(canContain('Stack', 'Radio')).toBe(false); // Radio is a slot child → never in an open parent
    expect(canContain('Grid', 'Radio')).toBe(false); // the flagship scenario
  });
  it('the restricted-child set is DERIVED from the descriptors (one source)', () => {
    expect(RESTRICTED_CHILD_TYPES.has('Radio')).toBe(true);
    expect(RESTRICTED_CHILD_TYPES.has('Button')).toBe(false);
  });
});
