import { describe, expect, it } from 'vitest';

import { type Node } from '../../src/ir/types';
import { type Emitter, shapeOf, walkNode } from '../../src/ir/walk';

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
      component: {
        RadioGroup: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        AppShell: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<<${children.join(',')}>>`;
        },
        AppBar: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        TopNav: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        SideNav: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        Breadcrumb: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        MenuBar: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        Stepper: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        ToolBar: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        DataTable: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        TableRow: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        Pagination: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        Tabs: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        TabPanel: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        Accordion: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        AccordionItem: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
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
        Radio: (node, depth) => {
          log.push(`${node.type}@${depth}`);
          return 'R';
        },
        NavLink: (node, depth) => {
          log.push(`${node.type}@${depth}`);
          return 'N';
        },
        Step: (node, depth) => {
          log.push(`${node.type}@${depth}`);
          return 'S';
        },
        ToolButton: (node, depth) => {
          log.push(`${node.type}@${depth}`);
          return 'TB';
        },
        Divider: (node, depth) => {
          log.push(`${node.type}@${depth}`);
          return 'D';
        },
        Spacer: (node, depth) => {
          log.push(`${node.type}@${depth}`);
          return 'SP';
        },
        TableCell: (node, depth) => {
          log.push(`${node.type}@${depth}`);
          return 'TC';
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

  it('a component container (RadioGroup) dispatches through emit.component, NOT container (RP-10)', () => {
    const log: string[] = [];
    const recorder: Emitter<string, number> = {
      container: (node, shape, children, depth) => {
        log.push(`container:${shape.kind}:${node.type}@${depth}`);
        return `[${children.join(',')}]`;
      },
      component: {
        RadioGroup: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        AppShell: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<<${children.join(',')}>>`;
        },
        AppBar: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        TopNav: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        SideNav: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        Breadcrumb: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        MenuBar: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        Stepper: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        ToolBar: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        DataTable: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        TableRow: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        Pagination: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        Tabs: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        TabPanel: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        Accordion: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        AccordionItem: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
      },
      leaf: {
        Text: () => 'T',
        Button: () => 'B',
        Image: () => 'I',
        Radio: (_node, depth) => {
          log.push(`Radio@${depth}`);
          return 'R';
        },
        NavLink: () => 'N',
        Step: () => 'S',
        ToolButton: () => 'TB',
        Divider: () => 'D',
        Spacer: () => 'SP',
        TableCell: () => 'TC',
      },
      descend: (depth) => depth + 1,
    };

    const tree: Node = {
      type: 'Stack',
      children: [
        {
          type: 'RadioGroup',
          props: { label: 'Pick' },
          children: [
            { type: 'Radio', props: { value: 'a', label: 'A' } },
            { type: 'Radio', props: { value: 'b', label: 'B' } },
          ],
        },
      ],
    };

    const out = walkNode<string, number>(tree, 0, recorder);

    // The RadioGroup goes through component() (no shape), its Radios through the leaf path — in order.
    expect(log).toEqual(['Radio@2', 'Radio@2', 'component:RadioGroup@1', 'container:flow:Stack@0']);
    expect(out).toBe('[<R,R>]');
  });

  it('the interactive compounds dispatch through component AND recurse into their OPEN panel content (ADR-0022)', () => {
    const log: string[] = [];
    const recorder: Emitter<string, number> = {
      container: (node, _shape, children, depth) => {
        log.push(`container:${node.type}@${depth}`);
        return `[${children.join(',')}]`;
      },
      component: {
        RadioGroup: (_node, children) => `<${children.join(',')}>`,
        AppShell: (_node, children) => `<${children.join(',')}>`,
        AppBar: (_node, children) => `<${children.join(',')}>`,
        TopNav: (_node, children) => `<${children.join(',')}>`,
        SideNav: (_node, children) => `<${children.join(',')}>`,
        Breadcrumb: (_node, children) => `<${children.join(',')}>`,
        MenuBar: (_node, children) => `<${children.join(',')}>`,
        Stepper: (_node, children) => `<${children.join(',')}>`,
        ToolBar: (_node, children) => `<${children.join(',')}>`,
        DataTable: (_node, children) => `<${children.join(',')}>`,
        TableRow: (_node, children) => `<${children.join(',')}>`,
        Pagination: (_node, children) => `<${children.join(',')}>`,
        Tabs: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        TabPanel: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        Accordion: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
        AccordionItem: (node, children, depth) => {
          log.push(`component:${node.type}@${depth}`);
          return `<${children.join(',')}>`;
        },
      },
      leaf: {
        Text: (_node, depth) => {
          log.push(`Text@${depth}`);
          return 'T';
        },
        Button: () => 'B',
        Image: () => 'I',
        Radio: () => 'R',
        NavLink: () => 'N',
        Step: () => 'S',
        ToolButton: () => 'TB',
        Divider: () => 'D',
        Spacer: () => 'SP',
        TableCell: () => 'TC',
      },
      descend: (depth) => depth + 1,
    };

    const tree: Node = {
      type: 'Stack',
      children: [
        {
          type: 'Tabs',
          props: { orientation: 'horizontal' },
          children: [
            {
              type: 'TabPanel',
              props: { label: 'One' },
              children: [{ type: 'Text', props: { content: 'a', variant: 'body' } }],
            },
          ],
        },
        {
          type: 'Accordion',
          props: { exclusive: false },
          children: [
            {
              type: 'AccordionItem',
              props: { title: 'S', open: true },
              children: [{ type: 'Text', props: { content: 'b', variant: 'body' } }],
            },
          ],
        },
      ],
    };

    const out = walkNode<string, number>(tree, 0, recorder);

    // Tabs/TabPanel/Accordion/AccordionItem all dispatch through emit.component; each panel's OPEN content
    // (a Text) recurses through the leaf path — proving the panels are real, recursing containers.
    expect(log).toEqual([
      'Text@3',
      'component:TabPanel@2',
      'component:Tabs@1',
      'Text@3',
      'component:AccordionItem@2',
      'component:Accordion@1',
      'container:Stack@0',
    ]);
    expect(out).toBe('[<<T>>,<<T>>]');
  });
});
