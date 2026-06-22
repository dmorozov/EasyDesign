import { describe, expect, it } from 'vitest';

import { type Node } from './types';
import { type Emitter, shapeOf, walkNode } from './walk';

describe('shapeOf — the one place the structural (α) decisions live', () => {
  it('Stack is vertical flow that does not wrap its children', () => {
    expect(shapeOf({ type: 'Stack', children: [] })).toEqual({
      kind: 'flow',
      axis: 'column',
      wrapChildren: false,
      justify: null,
      align: null,
      wrap: null,
    });
  });

  it('Column resolves identically to Stack', () => {
    expect(shapeOf({ type: 'Column', children: [] })).toEqual(
      shapeOf({ type: 'Stack', children: [] }),
    );
  });

  it('Row is horizontal flow and defaults to FIT — no flex:1 wrappers (ADR-0010)', () => {
    expect(shapeOf({ type: 'Row', children: [] })).toMatchObject({
      kind: 'flow',
      axis: 'row',
      wrapChildren: false,
    });
  });

  it('Row with distribute:fill wraps every child (equal columns)', () => {
    expect(shapeOf({ type: 'Row', props: { distribute: 'fill' }, children: [] })).toMatchObject({
      wrapChildren: true,
    });
  });

  it('Grid carries its column count and never wraps', () => {
    expect(shapeOf({ type: 'Grid', props: { columns: 3 }, children: [] })).toEqual({
      kind: 'grid',
      columns: 3,
      justify: null,
      align: null,
    });
  });

  it('threads justify / align / wrap straight from the node props', () => {
    expect(
      shapeOf({
        type: 'Row',
        props: { justify: 'space-between', align: 'center', wrap: 'wrap' },
        children: [],
      }),
    ).toMatchObject({ justify: 'space-between', align: 'center', wrap: 'wrap' });
  });
});

describe('walkNode — dispatch, document order, recursion contract', () => {
  it('walks children in document order, leaves never recurse, descend threads context', () => {
    const log: string[] = [];
    const recorder: Emitter<string, number> = {
      container: (node, shape, children, depth) => {
        log.push(`${shape.kind}:${node.type}@${depth}`);
        return `[${children.join(',')}]`;
      },
      leaf: {
        Text: (node, depth) => {
          log.push(`${node.type}@${depth}`);
          return 'T';
        },
        Button: (node, depth) => {
          log.push(`${node.type}@${depth}`);
          return 'B';
        },
        Image: (node, depth) => {
          log.push(`${node.type}@${depth}`);
          return 'I';
        },
      },
      descend: (depth) => depth + 1,
    };

    const tree: Node = {
      type: 'Stack',
      children: [
        { type: 'Text', props: { content: 'a', variant: 'body' } },
        {
          type: 'Row',
          children: [{ type: 'Button', props: { content: 'x', variant: 'primary' } }],
        },
      ],
    };

    const out = walkNode<string, number>(tree, 0, recorder);

    // children are fully walked before their parent's container() runs
    expect(log).toEqual(['Text@1', 'Button@2', 'flow:Row@1', 'flow:Stack@0']);
    // the emitter assembles bottom-up from the returned child values
    expect(out).toBe('[T,[B]]');
  });
});
