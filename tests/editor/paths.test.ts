import { describe, expect, it } from 'vitest';

import { flattenPaths, isContainer, isPrefix, nodeAt, samePath } from '../../src/editor/paths';
import { type Node } from '../../src/ir/types';

// Shared fixture: Stack[ Text"a", Row[ Button"b" ] ]. Paths: [] [0] [1] [1,0].
const tree: Node = {
  type: 'Stack',
  children: [
    { type: 'Text', props: { content: 'a', variant: 'body' } },
    { type: 'Row', children: [{ type: 'Button', props: { content: 'b', variant: 'primary' } }] },
  ],
};

// nodeAt / isPrefix are load-bearing across 12+ call sites; RP-1 backfills their own unit tests.
describe('nodeAt — resolve a node by path', () => {
  it('returns the root for the empty path', () => {
    expect(nodeAt(tree, [])).toBe(tree);
  });
  it('resolves a nested node', () => {
    expect(nodeAt(tree, [1, 0])).toMatchObject({ type: 'Button' });
  });
  it('returns undefined for an out-of-range index', () => {
    expect(nodeAt(tree, [9])).toBeUndefined();
  });
  it('returns undefined when descending through a leaf', () => {
    expect(nodeAt(tree, [0, 0])).toBeUndefined();
  });
});

describe('isPrefix — ancestor-or-equal', () => {
  it('the empty path is a prefix of every path', () => {
    expect(isPrefix([], [1, 0])).toBe(true);
    expect(isPrefix([], [])).toBe(true);
  });
  it('a path is a prefix of itself and of its descendants', () => {
    expect(isPrefix([1], [1])).toBe(true);
    expect(isPrefix([1], [1, 0])).toBe(true);
  });
  it('a sibling or longer path is not a prefix', () => {
    expect(isPrefix([1], [0])).toBe(false);
    expect(isPrefix([1, 0], [1])).toBe(false);
  });
});

describe('isContainer — the four Layout elements', () => {
  it('is true for Stack/Row/Column/Grid', () => {
    expect(isContainer({ type: 'Stack', children: [] })).toBe(true);
    expect(isContainer({ type: 'Grid', props: { columns: 2 }, children: [] })).toBe(true);
  });
  it('is false for leaves', () => {
    expect(isContainer({ type: 'Text', props: { content: 'x', variant: 'body' } })).toBe(false);
  });
});

describe('samePath — value equality (null-safe)', () => {
  it('equal contents are the same', () => {
    expect(samePath([1, 0], [1, 0])).toBe(true);
  });
  it('different length or contents differ', () => {
    expect(samePath([1], [1, 0])).toBe(false);
    expect(samePath([1, 0], [1, 1])).toBe(false);
  });
  it('null only equals null', () => {
    expect(samePath(null, null)).toBe(true);
    expect(samePath(null, [])).toBe(false);
    expect(samePath([], null)).toBe(false);
  });
});

describe('flattenPaths — pre-order (document) traversal', () => {
  it('lists the root then each subtree depth-first', () => {
    const tree: Node = {
      type: 'Stack',
      children: [
        { type: 'Text', props: { content: 'a', variant: 'body' } },
        {
          type: 'Row',
          children: [{ type: 'Button', props: { content: 'b', variant: 'primary' } }],
        },
      ],
    };
    expect(flattenPaths(tree)).toEqual([[], [0], [1], [1, 0]]);
  });
  it('a leaf root yields just the root path', () => {
    expect(flattenPaths({ type: 'Text', props: { content: 'x', variant: 'body' } })).toEqual([[]]);
  });
  it('orders a deep subtree before its later sibling', () => {
    const tree: Node = {
      type: 'Stack',
      children: [
        {
          type: 'Row',
          children: [
            { type: 'Text', props: { content: 'a', variant: 'body' } },
            { type: 'Text', props: { content: 'b', variant: 'body' } },
          ],
        },
        { type: 'Button', props: { content: 'c', variant: 'primary' } },
      ],
    };
    expect(flattenPaths(tree)).toEqual([[], [0], [0, 0], [0, 1], [1]]);
  });
  it('honours the base offset', () => {
    const leaf: Node = { type: 'Text', props: { content: 'x', variant: 'body' } };
    expect(flattenPaths(leaf, [2])).toEqual([[2]]);
  });
});
