// src/editor/frame-nodes.ts — RP-7: the Board↔React-Flow projection + reconcile, as PURE functions.
//
// React Flow owns transient per-node state (an in-flight drag); the store owns the SET of Frames and
// their committed positions (D3). The subtle decision — "adopt the store position only when it actually
// changed, else keep the existing node so we never fight a live drag" — used to live inside
// useFrameNodes' effect, reachable only by driving React Flow. Extracted here as a pure
// `(prev, frames) → next` so it is unit-testable (the hook is now a thin effect wrapper).
import { type Node as RFNode } from '@xyflow/react';

import { type EditorFrame } from './document';
import { type FrameData } from './FrameNode';

/** Only the grip on the Frame's top border drags it (its class is the React Flow `dragHandle`
 *  selector); the title is select-only (ADR-0013). */
const DRAG_HANDLE = '.ed-frame-grip';

/** Project a Frame to a fresh React Flow node. Selection is store-owned (`selectedFrameId`), so the
 *  node opts out of React Flow's own selection. */
export function toRFNode(f: EditorFrame): RFNode<FrameData> {
  return {
    id: f.id,
    type: 'frame',
    position: { x: f.x, y: f.y },
    data: { frameId: f.id },
    dragHandle: DRAG_HANDLE,
    selectable: false, // we own Selection via the store (selectedFrameId), not React Flow's
  };
}

/** The change signal the Board subscribes to: it changes exactly when a Frame is added, removed, or
 *  MOVED (committed) — never during an in-flight drag (those positions don't reach the store) and never
 *  for a title/width edit (those reconcile without remounting). Cheap string so equality is reference-free. */
export function framesSignature(frames: readonly EditorFrame[]): string {
  return frames.map((f) => `${f.id}:${f.x}:${f.y}`).join('|');
}

/** Reconcile the React Flow node list against the store frames, PURELY and in place: keep the existing
 *  node when its position already matches the store (so React Flow's transient state — incl. a live
 *  drag — survives), adopt the store position only when it changed (e.g. undo of a move), mint a node
 *  for a new Frame, and drop a removed one. The map order follows `frames`. */
export function reconcileNodes(
  prev: readonly RFNode<FrameData>[],
  frames: readonly EditorFrame[],
): RFNode<FrameData>[] {
  const byId = new Map(prev.map((n) => [n.id, n]));
  return frames.map((f) => {
    const existing = byId.get(f.id);
    if (!existing) return toRFNode(f); // freshly added Frame
    // Adopt the store position only when it actually changed (e.g. undo of a move) so we never fight
    // an in-flight drag; otherwise keep the existing node (preserves React Flow's state).
    if (existing.position.x === f.x && existing.position.y === f.y) return existing;
    return { ...existing, position: { x: f.x, y: f.y } };
  });
}
