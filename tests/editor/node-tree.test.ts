import { describe, expect, it } from 'vitest';

import { insert, move, remove, setStyle, updateProps } from '../../src/editor/node-tree';
import { nodeAt, type NodePath } from '../../src/editor/paths';
import { type Node } from '../../src/ir/types';

// The 5 pure ops ARE the test surface (RP-1): the tricky invariants — move's index-adjust, the
// subtree guard, the root guards — become direct assertions with no zustand / history / React.
// Shared fixture: Stack[ Text"A", Row[ Button"B", Button"C" ] ]. Paths: [] [0] [1] [1,0] [1,1].
const tree = (): Node => ({
  type: 'Stack',
  children: [
    { type: 'Text', props: { content: 'A', variant: 'body' } },
    {
      type: 'Row',
      children: [
        { type: 'Button', props: { content: 'B', variant: 'primary' } },
        { type: 'Button', props: { content: 'C', variant: 'secondary' } },
      ],
    },
  ],
});

const childrenOf = (node: Node | undefined): Node[] =>
  node && 'children' in node ? node.children : [];
const contentAt = (root: Node, path: NodePath): string | undefined => {
  const n = nodeAt(root, path);
  return n && (n.type === 'Text' || n.type === 'Button') ? n.props.content : undefined;
};
const leaf = (content: string): Node => ({ type: 'Text', props: { content, variant: 'body' } });

describe('insert', () => {
  it('appends when no index is given (the old insertChild)', () => {
    const r = insert(tree(), [1], leaf('D'));
    expect(r).not.toBeNull();
    expect(childrenOf(nodeAt(r?.root ?? tree(), [1]))).toHaveLength(3);
    expect(contentAt(r?.root ?? tree(), [1, 2])).toBe('D');
    expect(r?.path).toEqual([1, 2]);
  });
  it('splices at the given index (the old insertAt)', () => {
    const r = insert(tree(), [], leaf('Z'), 0);
    expect(contentAt(r?.root ?? tree(), [0])).toBe('Z');
    expect(r?.path).toEqual([0]);
    expect(childrenOf(r?.root)).toHaveLength(3);
  });
  it('clamps an out-of-range index to the end', () => {
    const r = insert(tree(), [], leaf('Z'), 99);
    expect(r?.path).toEqual([2]);
  });
  it('clamps a negative index to the front', () => {
    const r = insert(tree(), [], leaf('Z'), -5);
    expect(r?.path).toEqual([0]);
  });
  it('is a no-op into a leaf', () => {
    expect(insert(tree(), [0], leaf('D'))).toBeNull();
  });
  it('is a no-op into an invalid path', () => {
    expect(insert(tree(), [9], leaf('D'))).toBeNull();
  });
  it('does not mutate its input root, and clones the inserted node', () => {
    const root = tree();
    const node = leaf('D');
    const r = insert(root, [1], node);
    expect(root).toEqual(tree()); // input untouched
    // mutating the caller's node must not bleed into the result (it was cloned in)
    if (node.type === 'Text') node.props.content = 'MUTATED';
    expect(contentAt(r?.root ?? tree(), [1, 2])).toBe('D');
  });
});

describe('move', () => {
  it('reorders forward within a parent with the index-adjust', () => {
    // Row [B, C]; move [1,0] toward index 2 → [C, B].
    const r = move(tree(), [1, 0], [1], 2);
    expect(contentAt(r?.root ?? tree(), [1, 0])).toBe('C');
    expect(contentAt(r?.root ?? tree(), [1, 1])).toBe('B');
    expect(r?.path).toEqual([1, 1]);
  });
  it('reorders backward without an index-adjust', () => {
    const r = move(tree(), [1, 1], [1], 0); // C to the front → [C, B]
    expect(contentAt(r?.root ?? tree(), [1, 0])).toBe('C');
    expect(r?.path).toEqual([1, 0]);
  });
  it('moves across parents (resolving parents by reference, not stale path)', () => {
    // Move [0] (Text A) into the Row [1]; removing [0] shifts the Row, but the ref still resolves.
    const r = move(tree(), [0], [1], 0);
    expect(childrenOf(r?.root)).toHaveLength(1); // Stack now holds only the Row
    const row = nodeAt(r?.root ?? tree(), [0]); // the Row slid up to [0]
    expect(childrenOf(row)).toHaveLength(3);
    expect(contentAt(r?.root ?? tree(), [0, 0])).toBe('A');
  });
  it('refuses to move the root', () => {
    expect(move(tree(), [], [1], 0)).toBeNull();
  });
  it('refuses to move a node into its own subtree (descendant target)', () => {
    expect(move(tree(), [1], [1, 0], 0)).toBeNull();
  });
  it('refuses to move a node onto itself (equal target)', () => {
    expect(move(tree(), [1], [1], 0)).toBeNull();
  });
  it('is a no-op into a leaf target', () => {
    expect(move(tree(), [0], [1, 0], 0)).toBeNull();
  });
  it('is a no-op from an out-of-range source index', () => {
    expect(move(tree(), [9], [1], 0)).toBeNull();
  });
  it('is a no-op when the source parent path is invalid', () => {
    expect(move(tree(), [9, 0], [1], 0)).toBeNull();
  });
  it('does not mutate its input root', () => {
    const root = tree();
    move(root, [1, 0], [1], 2);
    expect(root).toEqual(tree());
  });
});

describe('remove', () => {
  it('removes a top-level child and resolves to the parent path', () => {
    const r = remove(tree(), [0]);
    expect(childrenOf(r?.root)).toHaveLength(1);
    expect(childrenOf(r?.root)[0]?.type).toBe('Row');
    expect(r?.path).toEqual([]);
  });
  it('removes a deeply nested node', () => {
    const r = remove(tree(), [1, 1]);
    expect(childrenOf(nodeAt(r?.root ?? tree(), [1]))).toHaveLength(1);
    expect(contentAt(r?.root ?? tree(), [1, 0])).toBe('B');
    expect(r?.path).toEqual([1]);
  });
  it('refuses to remove the root', () => {
    expect(remove(tree(), [])).toBeNull();
  });
  it('is a no-op when the parent path is invalid', () => {
    expect(remove(tree(), [9, 0])).toBeNull();
  });
  it('does not mutate its input root', () => {
    const root = tree();
    remove(root, [1, 1]);
    expect(root).toEqual(tree());
  });
});

describe('updateProps', () => {
  it('merges a patch into a node props', () => {
    const r = updateProps(tree(), [0], { content: 'changed' });
    expect(contentAt(r?.root ?? tree(), [0])).toBe('changed');
    expect(r?.path).toEqual([0]);
  });
  it('deletes a key when the patch value is undefined', () => {
    const withJustify = updateProps(tree(), [1], { justify: 'center' });
    const cleared = updateProps(withJustify?.root ?? tree(), [1], { justify: undefined });
    const row = nodeAt(cleared?.root ?? tree(), [1]);
    expect(row && 'props' in row ? row.props : undefined).toEqual({});
  });
  it('commits even when the value is unchanged (coalescing handles repeats, not this op)', () => {
    expect(updateProps(tree(), [0], { content: 'A' })).not.toBeNull();
  });
  it('is a no-op on an invalid path', () => {
    expect(updateProps(tree(), [9], { content: 'x' })).toBeNull();
  });
  it('does not mutate its input root', () => {
    const root = tree();
    updateProps(root, [0], { content: 'changed' });
    expect(root).toEqual(tree());
  });
});

describe('setStyle', () => {
  const styleAt = (root: Node | undefined, path: NodePath): Record<string, string> | undefined =>
    root ? nodeAt(root, path)?.style : undefined;

  it('sets a token-bound style key', () => {
    const r = setStyle(tree(), [], 'background', 'color.brand');
    expect(styleAt(r?.root, [])?.background).toBe('color.brand');
    expect(r?.path).toEqual([]);
  });
  it('clears a key with an empty string', () => {
    const set = setStyle(tree(), [], 'background', 'color.brand');
    const cleared = setStyle(set?.root ?? tree(), [], 'background', '');
    expect(styleAt(cleared?.root, [])?.background).toBeUndefined();
  });
  it('clears a key with null', () => {
    const set = setStyle(tree(), [], 'gap', 'space.md');
    const cleared = setStyle(set?.root ?? tree(), [], 'gap', null);
    expect(styleAt(cleared?.root, [])?.gap).toBeUndefined();
  });
  it('is a no-op when the value is unchanged (clearing an absent key)', () => {
    expect(setStyle(tree(), [0], 'background', null)).toBeNull();
  });
  it('is a no-op when setting the same value twice', () => {
    const set = setStyle(tree(), [], 'background', 'color.brand');
    expect(setStyle(set?.root ?? tree(), [], 'background', 'color.brand')).toBeNull();
  });
  it('is a no-op on an invalid path', () => {
    expect(setStyle(tree(), [9], 'background', 'color.brand')).toBeNull();
  });
  it('does not mutate its input root', () => {
    const root = tree();
    setStyle(root, [], 'background', 'color.brand');
    expect(root).toEqual(tree());
  });
});
