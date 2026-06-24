import { describe, expect, it } from 'vitest';

import { type EditorFrame } from '../../src/editor/document';
import { framesSignature, reconcileNodes, toRFNode } from '../../src/editor/frame-nodes';

// RP-7: the Board↔React-Flow reconcile decision is now a pure function, so the load-bearing
// "adopt the store position only when it changed, else keep the node so we never fight a live drag"
// rule is a plain assertion — no React Flow, no rendering.

const frame = (over: Partial<EditorFrame> = {}): EditorFrame => ({
  id: 'f1',
  title: 'T',
  target: 'web',
  x: 0,
  y: 0,
  width: 1280,
  root: { type: 'Stack', children: [] },
  ...over,
});

describe('toRFNode — Frame → React Flow node', () => {
  it('projects id/position/data + the drag handle, and opts out of RF selection (store-owned)', () => {
    const n = toRFNode(frame({ id: 'a', x: 10, y: 20 }));
    expect(n).toMatchObject({
      id: 'a',
      type: 'frame',
      position: { x: 10, y: 20 },
      data: { frameId: 'a' },
      dragHandle: '.ed-frame-grip',
      selectable: false,
    });
  });
});

describe('framesSignature — the remount-free change signal', () => {
  it('encodes id:x:y per frame, joined', () => {
    expect(framesSignature([frame({ id: 'a', x: 1, y: 2 }), frame({ id: 'b', x: 3, y: 4 })])).toBe(
      'a:1:2|b:3:4',
    );
  });
  it('changes on a move, an add, or a remove', () => {
    const base = [frame({ id: 'a', x: 0, y: 0 })];
    expect(framesSignature(base)).not.toBe(framesSignature([frame({ id: 'a', x: 5, y: 0 })])); // moved
    expect(framesSignature(base)).not.toBe(framesSignature([...base, frame({ id: 'b' })])); // added
    expect(framesSignature([...base, frame({ id: 'b' })])).not.toBe(framesSignature(base)); // removed
  });
  it('is stable across a non-position edit (title/width) — those reconcile without a remount', () => {
    expect(framesSignature([frame({ id: 'a', title: 'X', width: 375 })])).toBe(
      framesSignature([frame({ id: 'a', title: 'Y', width: 768 })]),
    );
  });
});

describe('reconcileNodes — adopt the store position only when it changed (never fight the drag)', () => {
  it('mints a node for a freshly added Frame', () => {
    const next = reconcileNodes([], [frame({ id: 'a' })]);
    expect(next.map((n) => n.id)).toEqual(['a']);
  });

  it('drops the node for a removed Frame, preserving order', () => {
    const prev = [toRFNode(frame({ id: 'a' })), toRFNode(frame({ id: 'b' }))];
    expect(reconcileNodes(prev, [frame({ id: 'b' })]).map((n) => n.id)).toEqual(['b']);
  });

  it('keeps the SAME node object when the store position is unchanged (RF transient state survives)', () => {
    const prev = [toRFNode(frame({ id: 'a', x: 0, y: 0 }))];
    const next = reconcileNodes(prev, [frame({ id: 'a', x: 0, y: 0 })]);
    expect(next[0]).toBe(prev[0]); // reference-equal → a live drag isn't clobbered
  });

  it('adopts the store position when it changed (e.g. undo of a move) as a new node object', () => {
    const prev = [toRFNode(frame({ id: 'a', x: 0, y: 0 }))];
    const next = reconcileNodes(prev, [frame({ id: 'a', x: 99, y: 88 })]);
    expect(next[0]?.position).toEqual({ x: 99, y: 88 });
    expect(next[0]).not.toBe(prev[0]);
  });

  it('reconciles a mixed add + move + keep in one pass, in frames order', () => {
    const prev = [
      toRFNode(frame({ id: 'a', x: 0, y: 0 })),
      toRFNode(frame({ id: 'b', x: 5, y: 5 })),
    ];
    const next = reconcileNodes(prev, [
      frame({ id: 'b', x: 5, y: 5 }), // kept (same position)
      frame({ id: 'a', x: 1, y: 1 }), // moved
      frame({ id: 'c', x: 9, y: 9 }), // added
    ]);
    expect(next.map((n) => n.id)).toEqual(['b', 'a', 'c']);
    expect(next[0]).toBe(prev[1]); // b kept by reference
    expect(next[1]?.position).toEqual({ x: 1, y: 1 }); // a adopted
  });
});
