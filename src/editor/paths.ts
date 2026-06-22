import { type Node } from '../ir/types';

/** A path from a Frame's root to a node: child indices, root = []. */
export type NodePath = number[];

/** Can this node hold children? Union-derived (`'children' in node`), so every container — layout
 *  (Stack/Row/Column/Grid) AND component (RadioGroup) — counts, with no hand-maintained type list. */
export function isContainer(node: Node): boolean {
  return 'children' in node;
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

/** Every node path in document (pre-order) order — root first, then each child subtree depth-first.
 *  Powers keyboard tree navigation (Arrow Up/Down) across the canvas. */
export function flattenPaths(root: Node, base: NodePath = []): NodePath[] {
  const out: NodePath[] = [base];
  if ('children' in root) {
    root.children.forEach((child, i) => out.push(...flattenPaths(child, [...base, i])));
  }
  return out;
}
