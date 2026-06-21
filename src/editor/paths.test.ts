import { describe, expect, it } from 'vitest';

import { type Node } from '../ir/types';

import { flattenPaths } from './paths';

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
