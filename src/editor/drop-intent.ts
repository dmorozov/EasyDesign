// src/editor/drop-intent.ts — RP-5: the drag-drop INTENT module.
//
// Translating a drag into a tree edit was complex domain logic trapped in `Editor.tsx`:
// the drop-mode thresholds (<0.25 before / >0.75 after / else inside), the "root forces
// inside" rule, the insert-vs-move branching, and the email-safety guard — all reachable
// only by mocking dnd-kit's events, so none of it was tested. Worse, the email guard ran
// LATE (only at drag-end), so a blocked drop showed a normal indicator and then silently
// dropped nothing.
//
// This module is the one home for "what does this drag mean", PURE and framework-free: it
// knows nothing about dnd-kit (the Editor adapts the event shape at the boundary) or React.
// `computeMode` owns the geometry→mode maths; `placeAt` owns mode→parent/index; and
// `resolveDropIntent` folds in the email rule (via frames.ts, the ONE email predicate) so the
// SAME resolution drives both the live indicator (which can now show a drop as `blocked`) and
// the drag-end dispatch. Structural validity (the move-into-own-subtree guard, index bounds)
// stays in node-tree.ts (RP-1) — this module emits exactly the op that module consumes.
import { type Node } from '../ir/types';

import { canContain } from './descriptors';
import { canInsertInTarget, type FrameTarget } from './frames';
import { type PaletteItem } from './palette';
import { type NodePath } from './paths';

/** Where a drop lands relative to the hovered node. */
export type DropMode = 'before' | 'after' | 'inside';

/** The live drop indicator's state (transient editor UI — never enters history). `blocked` marks a
 *  drop the email rule forbids: the indicator shows it disallowed and drag-end dispatches nothing. */
export interface DropTarget {
  frameId: string;
  path: NodePath;
  mode: DropMode;
  blocked?: boolean;
}

/** The dragged thing, adapted from dnd-kit's `active.data` at the Editor boundary: a Palette item
 *  being inserted, or an existing node being moved (its source path within the Frame). `childType` is
 *  the dragged node's type — the allowed-children rule (RP-10) reads it to vet the target parent. */
export type DragSource =
  | { kind: 'insert'; item: PaletteItem; childType: Node['type'] }
  | { kind: 'move'; fromPath: NodePath; childType: Node['type'] };

/** The hovered drop zone, adapted from dnd-kit's `over` at the Editor boundary. `node` is the
 *  already-resolved hovered node (the Editor does the `nodeAt`); `medium` is its Frame's target, read
 *  by the email rule; `parentType` is the hovered node's PARENT type (undefined at the root), used by
 *  the allowed-children rule when a drop lands `before`/`after` (its parent, not the hovered node). */
export interface DropZone {
  frameId: string;
  path: NodePath;
  node: Node;
  medium: FrameTarget;
  parentType?: Node['type'];
  /** When set, the placement mode is FORCED by an explicit insertion-point ("gap") droppable, bypassing
   *  the geometry thirds (`computeMode`). A gap anchors to an existing child node + a `before`/`after`
   *  side, so the SAME placement/indicator/allowed-children/email path serves both gap and node drops.
   *  Plain node droppables omit it, so `computeMode` runs exactly as before (RP-5 behaviour preserved). */
  mode?: DropMode;
}

/** Pointer position vs. the hovered node's rect (`pointerY` already folds dnd-kit's activator-Y +
 *  delta-Y at the boundary). Used to pick before/inside/after. */
export interface DropGeometry {
  pointerY: number;
  rectTop: number;
  rectHeight: number;
}

/** Why a drop was refused: the email-safety rule (ADR-0006), or the allowed-children rule (RP-10 — a
 *  Radio outside a RadioGroup, etc.). Move-into-own-subtree is NOT here: it's a silent structural no-op
 *  owned by node-tree.ts, not a user-facing rejection. */
export type RejectReason = 'email-unsafe' | 'invalid-child';

/** A resolved drag. Every variant carries `target` (the placement that drives the indicator); the
 *  rest tells drag-end what to dispatch. `rejected` is the same placement with `target.blocked` set. */
export type DropIntent =
  | { kind: 'insert'; target: DropTarget; item: PaletteItem; parentPath: NodePath; index: number }
  | { kind: 'move'; target: DropTarget; fromPath: NodePath; parentPath: NodePath; index: number }
  | { kind: 'rejected'; target: DropTarget; reason: RejectReason };

/** The fraction [0..1] of the pointer down the hovered rect — 0.5 for a degenerate (zero-height) rect. */
function relativeY(geom: DropGeometry): number {
  return geom.rectHeight > 0 ? (geom.pointerY - geom.rectTop) / geom.rectHeight : 0.5;
}

/**
 * The placement mode from geometry + the hovered node. A container splits in thirds
 * (before / inside / after); a leaf splits in half (before / after); an empty container always
 * takes `inside` (there is nothing to sit beside); the Frame root (path `[]`) always takes `inside`
 * (it has no siblings). Container-ness is union-derived (`'children' in node`), never a hardcoded list.
 */
export function computeMode(node: Node, path: NodePath, geom: DropGeometry): DropMode {
  const container = 'children' in node;
  if (container && node.children.length === 0) return 'inside'; // empty container → drop inside it
  if (path.length === 0) return 'inside'; // the Frame root has no siblings to land beside
  const rel = relativeY(geom);
  if (container) return rel < 0.25 ? 'before' : rel > 0.75 ? 'after' : 'inside';
  return rel < 0.5 ? 'before' : 'after';
}

/**
 * Turn a placement (the hovered node + a mode) into the parent path + insertion index it denotes.
 * `inside` appends under the node itself; `before`/`after` splice beside it in its parent. Returns
 * `null` only for a `before`/`after` on the root (no siblings) — in practice unreachable, since
 * `computeMode` forces the root to `inside`, but guarded so `placeAt` is correct in isolation.
 */
export function placeAt(
  node: Node,
  path: NodePath,
  mode: DropMode,
): { parentPath: NodePath; index: number } | null {
  if (mode === 'inside') {
    const len = 'children' in node ? node.children.length : 0;
    return { parentPath: path, index: len };
  }
  const last = path.at(-1);
  if (last === undefined) return null; // root has no siblings
  return { parentPath: path.slice(0, -1), index: mode === 'before' ? last : last + 1 };
}

/**
 * Resolve a drag into an actionable intent. `null` when there is no valid hover (or a placement that
 * can't resolve). Two rules can `reject` (each shown via `target.blocked`): the allowed-children rule
 * (RP-10 — the actual parent for the placement must accept the dragged type, e.g. a Radio only into a
 * RadioGroup) applies to BOTH insert and move; the email rule (ADR-0006) applies to insert only. The
 * actual parent is the hovered node for `inside`, else its parent (`zone.parentType`). A move is never
 * email-rejected (it introduces no new type). The emitted op matches node-tree.ts.
 */
export function resolveDropIntent(
  zone: DropZone | null,
  source: DragSource,
  geom: DropGeometry,
): DropIntent | null {
  if (!zone) return null;
  // A gap droppable forces the mode (it IS an insertion point); a node droppable derives it from geometry.
  const mode = zone.mode ?? computeMode(zone.node, zone.path, geom);
  const placed = placeAt(zone.node, zone.path, mode);
  if (!placed) return null;
  const target: DropTarget = { frameId: zone.frameId, path: zone.path, mode };

  // Allowed-children (RP-10): the node that will actually become the parent must accept this type.
  const parentType = mode === 'inside' ? zone.node.type : zone.parentType;
  if (parentType !== undefined && !canContain(parentType, source.childType)) {
    return { kind: 'rejected', target: { ...target, blocked: true }, reason: 'invalid-child' };
  }

  if (source.kind === 'insert') {
    if (!canInsertInTarget(zone.medium, source.item)) {
      return { kind: 'rejected', target: { ...target, blocked: true }, reason: 'email-unsafe' };
    }
    return {
      kind: 'insert',
      target,
      item: source.item,
      parentPath: placed.parentPath,
      index: placed.index,
    };
  }
  return {
    kind: 'move',
    target,
    fromPath: source.fromPath,
    parentPath: placed.parentPath,
    index: placed.index,
  };
}
