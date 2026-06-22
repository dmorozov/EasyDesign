// src/editor/node-tree.ts — RP-1: the Frame layout-tree EDITING module (ADR-0012 amendment).
//
// The store used to repeat the same shape in all seven mutating actions —
// `structuredClone(root)` → `nodeAt` → splice/mutate → reassemble — with the tricky
// invariants (move's index-adjust, the subtree guard, the root-delete guard) inline in
// untested bodies. This module is the one home for those STRUCTURAL edits.
//
// Each op is PURE and TYPE-AGNOSTIC: it deep-clones at entry (never mutates its input),
// works off `'children' in node` (union-derived, never a hardcoded type list), and returns
// `{ root, path } | null`. `path` is the edit's resolved structural location — the
// insert/move target, delete's parent, or the unchanged path for in-place edits — which the
// store maps to Selection. `null` is a tree-level no-op (invalid path, root/subtree guard,
// or no-change), and the store turns that into "no history entry, no state change".
//
// NOT here (by design): the frame lookup, Selection/history policy (the store owns those),
// and node-TYPE semantic rules — the Text/Button gate, the container gate, the Grid-`wrap`
// rule — which stay as thin store sanitization until they move onto the descriptor (RP-2/RP-4).
import { type Node } from '../ir/types';

import { isPrefix, nodeAt, type NodePath } from './paths';

/** A successful structural edit: the next root (a fresh clone) + the path it resolves to. */
export interface TreeEdit {
  readonly root: Node;
  readonly path: NodePath;
}

type ContainerNode = Extract<Node, { children: Node[] }>;

/** Can this node hold children? Union-derived — never a hardcoded `isContainer` list. */
function hasChildren(node: Node): node is ContainerNode {
  return 'children' in node;
}

/**
 * Insert `node` under `parentPath`. With `index` omitted it appends (the old `insertChild`);
 * with `index` given it splices at the clamped position (the old `insertAt`). The inserted
 * node is cloned too, so the result shares no references with either input.
 */
export function insert(
  root: Node,
  parentPath: NodePath,
  node: Node,
  index?: number,
): TreeEdit | null {
  const next = structuredClone(root);
  const parent = nodeAt(next, parentPath);
  if (!parent || !hasChildren(parent)) return null;
  const i =
    index === undefined
      ? parent.children.length
      : Math.max(0, Math.min(index, parent.children.length));
  parent.children.splice(i, 0, structuredClone(node));
  return { root: next, path: [...parentPath, i] };
}

/**
 * Move the node at `fromPath` to position `index` under `parentPath`. Owns the two subtle
 * invariants: the same-parent index-adjust (removing the source shifts later targets left by
 * one) and the "can't move a node into its own subtree" guard. Resolves both parents as object
 * references before splicing, so a parent whose path shifts during the move is still found.
 */
export function move(
  root: Node,
  fromPath: NodePath,
  parentPath: NodePath,
  index: number,
): TreeEdit | null {
  const fromIndex = fromPath.at(-1);
  if (fromIndex === undefined) return null; // can't move the root
  if (isPrefix(fromPath, parentPath)) return null; // can't move a node into its own subtree
  const next = structuredClone(root);
  const fromParent = nodeAt(next, fromPath.slice(0, -1));
  const targetParent = nodeAt(next, parentPath);
  if (!fromParent || !hasChildren(fromParent)) return null;
  if (!targetParent || !hasChildren(targetParent)) return null;
  const moved = fromParent.children[fromIndex];
  if (!moved) return null;
  fromParent.children.splice(fromIndex, 1);
  let i = index;
  if (fromParent === targetParent && fromIndex < i) i -= 1; // the source removal shifted us left
  i = Math.max(0, Math.min(i, targetParent.children.length));
  targetParent.children.splice(i, 0, moved);
  return { root: next, path: [...parentPath, i] };
}

/** Remove the node at `path`. No-op on the root. Resolves to the parent's path. */
export function remove(root: Node, path: NodePath): TreeEdit | null {
  const last = path.at(-1);
  if (last === undefined) return null; // can't delete the root
  const next = structuredClone(root);
  const parent = nodeAt(next, path.slice(0, -1));
  if (!parent || !hasChildren(parent)) return null;
  parent.children.splice(last, 1);
  return { root: next, path: path.slice(0, -1) };
}

/**
 * Blind props merge on the node at `path`: each patch key is set, or DELETED when its value is
 * `undefined`. Type-agnostic — the caller (store) decides which keys are legal for the node type
 * (the Text/Button vs container gate, the Grid-`wrap` drop). Always commits when the path
 * resolves; "no-op when unchanged" is not its job (coalescing handles repeats).
 */
export function updateProps(
  root: Node,
  path: NodePath,
  patch: Record<string, unknown>,
): TreeEdit | null {
  const next = structuredClone(root);
  const target = nodeAt(next, path);
  if (!target) return null;
  const props: Record<string, unknown> = {
    ...(target as { props?: Record<string, unknown> }).props,
  };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete props[key];
    else props[key] = value;
  }
  (target as { props?: unknown }).props = props;
  return { root: next, path };
}

/**
 * Set or clear one token-bound style key on the node at `path`. `ref` falsy (`''`/`null`) clears.
 * Blind to node type (every node carries optional `style`); returns `null` when the value is
 * unchanged, so the store records no history entry.
 */
export function setStyle(
  root: Node,
  path: NodePath,
  key: string,
  ref: string | null,
): TreeEdit | null {
  const next = structuredClone(root);
  const target = nodeAt(next, path);
  if (!target) return null;
  const current = target.style?.[key];
  const nextRef = ref === '' || ref === null ? undefined : ref; // falsy ref clears the key
  if (current === nextRef) return null; // no change → tree-level no-op
  const style = { ...target.style };
  if (nextRef) style[key] = nextRef;
  else delete style[key];
  target.style = style;
  return { root: next, path };
}
