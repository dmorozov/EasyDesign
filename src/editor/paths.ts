import { type Node } from '../ir/types';

/** A path from a Frame's root to a node: child indices, root = []. */
export type NodePath = number[];

const CONTAINER_TYPES = new Set<Node['type']>(['Stack', 'Row', 'Column', 'Grid']);

export function isContainer(node: Node): boolean {
  return CONTAINER_TYPES.has(node.type);
}

/** Resolve the node at `path`, or undefined if the path is invalid. */
export function nodeAt(root: Node, path: NodePath): Node | undefined {
  let current: Node = root;
  for (const index of path) {
    if (!('children' in current)) return undefined;
    const next = current.children[index];
    if (next === undefined) return undefined;
    current = next;
  }
  return current;
}

export function samePath(a: NodePath | null, b: NodePath | null): boolean {
  if (a === null || b === null) return a === b;
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

/** True if `prefix` is an ancestor of (or equal to) `path`. */
export function isPrefix(prefix: NodePath, path: NodePath): boolean {
  return prefix.length <= path.length && prefix.every((value, i) => value === path[i]);
}
