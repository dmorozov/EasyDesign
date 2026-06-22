import { describe, expect, it } from 'vitest';

import { type Node, type RadioNode } from '../ir/types';

import {
  computeMode,
  placeAt,
  resolveDropIntent,
  type DragSource,
  type DropGeometry,
  type DropZone,
} from './drop-intent';
import { type PaletteItem } from './palette';

// RP-5: drag-drop intent is now a pure function, so the drop-mode maths, the root/empty rules, the
// insert-vs-move branching, and the email guard are plain assertions — no dnd-kit, no React.

const container = (children: Node[] = []): Node => ({
  type: 'Stack',
  style: { gap: 'space.md' },
  children,
});
const leaf = (): Node => ({ type: 'Text', props: { content: 'x', variant: 'body' } });

// Pointer at fraction `rel` down a unit (0..100) rect; `degenerate` is a zero-height rect → rel 0.5.
const geomAt = (rel: number): DropGeometry => ({
  pointerY: rel * 100,
  rectTop: 0,
  rectHeight: 100,
});
const degenerate: DropGeometry = { pointerY: 50, rectTop: 0, rectHeight: 0 };

const safeItem: PaletteItem = {
  id: 'stack',
  label: 'Stack',
  icon: 'stack',
  group: 'layout',
  emailSafe: true,
  nodeType: 'Stack',
  create: () => container(),
};
const unsafeItem: PaletteItem = {
  id: 'grid',
  label: 'Grid',
  icon: 'grid',
  group: 'layout',
  emailSafe: false,
  nodeType: 'Grid',
  create: () => ({ type: 'Grid', props: { columns: 2 }, style: { gap: 'space.md' }, children: [] }),
};
const radioItem: PaletteItem = {
  id: 'radio',
  label: 'Radio',
  icon: 'check',
  group: 'content',
  emailSafe: false,
  nodeType: 'Radio',
  create: () => ({ type: 'Radio', props: { value: 'o', label: 'O' } }),
};

// DragSource builders — `childType` comes from the item (insert) or is given (move).
const ins = (item: PaletteItem): DragSource => ({ kind: 'insert', item, childType: item.nodeType });
const mv = (fromPath: number[], childType: Node['type']): DragSource => ({
  kind: 'move',
  fromPath,
  childType,
});

describe('computeMode — geometry + node → before/inside/after', () => {
  it('an empty container is always `inside` (nothing to sit beside), even near its top edge', () => {
    expect(computeMode(container([]), [0], geomAt(0.1))).toBe('inside');
  });

  it('the Frame root is always `inside` (no siblings), overriding what the geometry would pick', () => {
    expect(computeMode(container([leaf()]), [], geomAt(0.1))).toBe('inside');
    expect(computeMode(container([leaf()]), [], geomAt(0.9))).toBe('inside');
  });

  it('a non-empty container splits in thirds: <0.25 before, 0.25–0.75 inside, >0.75 after', () => {
    const c = container([leaf()]);
    expect(computeMode(c, [0], geomAt(0.1))).toBe('before');
    expect(computeMode(c, [0], geomAt(0.25))).toBe('inside'); // boundary: not < 0.25
    expect(computeMode(c, [0], geomAt(0.5))).toBe('inside');
    expect(computeMode(c, [0], geomAt(0.75))).toBe('inside'); // boundary: not > 0.75
    expect(computeMode(c, [0], geomAt(0.9))).toBe('after');
  });

  it('a leaf splits in half: <0.5 before, ≥0.5 after', () => {
    expect(computeMode(leaf(), [0], geomAt(0.1))).toBe('before');
    expect(computeMode(leaf(), [0], geomAt(0.49))).toBe('before');
    expect(computeMode(leaf(), [0], geomAt(0.5))).toBe('after'); // boundary: not < 0.5
    expect(computeMode(leaf(), [0], geomAt(0.9))).toBe('after');
  });

  it('a degenerate (zero-height) rect reads as the middle (rel 0.5)', () => {
    expect(computeMode(leaf(), [0], degenerate)).toBe('after'); // 0.5 → after for a leaf
    expect(computeMode(container([leaf()]), [0], degenerate)).toBe('inside'); // 0.5 → middle third
  });
});

describe('placeAt — placement (node + mode) → parent path + insertion index', () => {
  it('`inside` a container appends after its existing children', () => {
    expect(placeAt(container([leaf(), leaf()]), [3], 'inside')).toEqual({
      parentPath: [3],
      index: 2,
    });
  });

  it('`inside` a leaf yields index 0 (node-tree then rejects it — leaves take no children)', () => {
    expect(placeAt(leaf(), [3], 'inside')).toEqual({ parentPath: [3], index: 0 });
  });

  it('`before` splices at the sibling index; `after` at index+1', () => {
    expect(placeAt(leaf(), [2], 'before')).toEqual({ parentPath: [], index: 2 });
    expect(placeAt(leaf(), [2], 'after')).toEqual({ parentPath: [], index: 3 });
    expect(placeAt(leaf(), [1, 0], 'before')).toEqual({ parentPath: [1], index: 0 });
  });

  it('`before`/`after` on the root is null (the root has no siblings)', () => {
    expect(placeAt(container([leaf()]), [], 'before')).toBeNull();
    expect(placeAt(container([leaf()]), [], 'after')).toBeNull();
  });
});

describe('resolveDropIntent — the full intent (placement + op + email guard)', () => {
  it('no hovered zone → null (nothing to drop on)', () => {
    expect(resolveDropIntent(null, ins(safeItem), geomAt(0.5))).toBeNull();
  });

  it('insert into a web container resolves to an `insert` op at the append index', () => {
    const zone: DropZone = { frameId: 'f1', path: [1], node: container([leaf()]), medium: 'web' };
    const intent = resolveDropIntent(zone, ins(safeItem), geomAt(0.5));
    expect(intent).toMatchObject({
      kind: 'insert',
      item: safeItem,
      parentPath: [1],
      index: 1,
      target: { frameId: 'f1', path: [1], mode: 'inside' },
    });
    expect(intent?.kind === 'insert' && intent.target.blocked).toBeFalsy();
  });

  it('insert BEFORE a leaf splices into its parent at the leaf index', () => {
    const zone: DropZone = { frameId: 'f1', path: [0, 2], node: leaf(), medium: 'web' };
    const intent = resolveDropIntent(zone, ins(safeItem), geomAt(0.1));
    expect(intent).toMatchObject({
      kind: 'insert',
      parentPath: [0],
      index: 2,
      target: { mode: 'before' },
    });
  });

  it('an email-unsafe Component over an EMAIL Frame is rejected and marked blocked (ADR-0006)', () => {
    const zone: DropZone = { frameId: 'e1', path: [0], node: container([]), medium: 'email' };
    const intent = resolveDropIntent(zone, ins(unsafeItem), geomAt(0.5));
    expect(intent).toEqual({
      kind: 'rejected',
      reason: 'email-unsafe',
      target: { frameId: 'e1', path: [0], mode: 'inside', blocked: true },
    });
  });

  it('the SAME email-unsafe Component over a WEB Frame is allowed (the rule is the medium, not the item)', () => {
    const zone: DropZone = { frameId: 'f1', path: [0], node: container([]), medium: 'web' };
    const intent = resolveDropIntent(zone, ins(unsafeItem), geomAt(0.5));
    expect(intent?.kind).toBe('insert');
  });

  it('an email-SAFE Component over an email Frame is allowed', () => {
    const zone: DropZone = { frameId: 'e1', path: [0], node: container([]), medium: 'email' };
    expect(resolveDropIntent(zone, ins(safeItem), geomAt(0.5))?.kind).toBe('insert');
  });

  it('a move resolves to a `move` op carrying the source path — and is NEVER email-rejected', () => {
    const zone: DropZone = { frameId: 'e1', path: [2], node: leaf(), medium: 'email' };
    const intent = resolveDropIntent(zone, mv([0, 1], 'Button'), geomAt(0.9));
    expect(intent).toMatchObject({
      kind: 'move',
      fromPath: [0, 1],
      parentPath: [],
      index: 3, // after [2]
      target: { frameId: 'e1', path: [2], mode: 'after' },
    });
  });
});

describe('resolveDropIntent — allowed-children rule (RP-10): the parent must accept the dragged type', () => {
  const radio = (): RadioNode => ({ type: 'Radio', props: { value: 'a', label: 'A' } });
  const radioGroup = (kids: RadioNode[] = []): Node => ({
    type: 'RadioGroup',
    props: { label: 'L' },
    children: kids,
  });
  const grid = (kids: Node[] = []): Node => ({
    type: 'Grid',
    props: { columns: 2 },
    children: kids,
  });

  it('a Radio dropped INSIDE a RadioGroup is allowed (the slot rule satisfied)', () => {
    const zone: DropZone = { frameId: 'f', path: [0], node: radioGroup(), medium: 'web' };
    expect(resolveDropIntent(zone, ins(radioItem), geomAt(0.5))?.kind).toBe('insert');
  });

  it('a Radio dropped INSIDE a Grid is rejected as invalid-child (the flagship RP-10 scenario)', () => {
    const zone: DropZone = { frameId: 'f', path: [0], node: grid(), medium: 'web' };
    expect(resolveDropIntent(zone, ins(radioItem), geomAt(0.5))).toMatchObject({
      kind: 'rejected',
      reason: 'invalid-child',
      target: { blocked: true },
    });
  });

  it('a Radio dropped INSIDE a Stack is rejected (a restricted child needs an explicit slot)', () => {
    const zone: DropZone = { frameId: 'f', path: [0], node: container([]), medium: 'web' };
    expect(resolveDropIntent(zone, ins(radioItem), geomAt(0.5))?.kind).toBe('rejected');
  });

  it('a Radio dropped BEFORE a Radio is vetted against its PARENT (RadioGroup) — allowed', () => {
    const zone: DropZone = {
      frameId: 'f',
      path: [0, 1],
      node: radio(),
      medium: 'web',
      parentType: 'RadioGroup',
    };
    expect(resolveDropIntent(zone, ins(radioItem), geomAt(0.1))?.kind).toBe('insert');
  });

  it('a non-Radio dropped into a RadioGroup is rejected (it admits only Radio — bidirectional)', () => {
    const zone: DropZone = { frameId: 'f', path: [0], node: radioGroup([radio()]), medium: 'web' };
    expect(resolveDropIntent(zone, mv([1, 0], 'Button'), geomAt(0.5))).toMatchObject({
      kind: 'rejected',
      reason: 'invalid-child',
    });
  });

  it('MOVE enforces the rule too: a Radio moved into a Grid is rejected', () => {
    const zone: DropZone = { frameId: 'f', path: [0], node: grid(), medium: 'web' };
    expect(resolveDropIntent(zone, mv([1], 'Radio'), geomAt(0.5))?.kind).toBe('rejected');
  });
});
