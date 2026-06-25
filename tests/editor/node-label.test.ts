import { describe, expect, it } from 'vitest';

import { nodeLabel } from '../../src/editor/node-label';

// The one home for Frame-tree node labels (shared by the canvas a11y tree + the Structure panel).
describe('nodeLabel — Frame-tree node labels', () => {
  it('prefixes the root, uses the descriptor label otherwise', () => {
    expect(nodeLabel({ type: 'Stack', children: [] }, [])).toBe('root Stack');
    expect(nodeLabel({ type: 'Stack', children: [] }, [1])).toBe('Stack');
  });

  it('appends a distinguishing detail per content-bearing type', () => {
    expect(nodeLabel({ type: 'Text', props: { content: 'Hello', variant: 'body' } }, [0])).toBe(
      'Text: Hello',
    );
    expect(nodeLabel({ type: 'Button', props: { content: 'Go', variant: 'primary' } }, [0])).toBe(
      'Button: Go',
    );
    expect(nodeLabel({ type: 'Image', props: { src: 'x', alt: 'A logo' } }, [0])).toBe(
      'Image: A logo',
    );
    expect(nodeLabel({ type: 'Radio', props: { value: 'a', label: 'Option A' } }, [0])).toBe(
      'Radio: Option A',
    );
    // ADR-0017: a Region is labelled by the grid area it occupies.
    expect(nodeLabel({ type: 'Region', props: { area: 'header' }, children: [] }, [0])).toBe(
      'Region: header',
    );
    // This ADR + ADR-0019: the labelled slot/leaf types surface their label too.
    expect(nodeLabel({ type: 'NavLink', props: { label: 'Home', href: '/' } }, [0])).toBe(
      'Nav link: Home',
    );
    expect(nodeLabel({ type: 'Step', props: { label: 'Profile', status: 'current' } }, [0])).toBe(
      'Step: Profile',
    );
    expect(nodeLabel({ type: 'ToolButton', props: { icon: 'undo', label: 'Undo' } }, [0])).toBe(
      'Tool button: Undo',
    );
    // an icon-only ToolButton (cleared label) falls back to the bare type label.
    expect(nodeLabel({ type: 'ToolButton', props: { icon: 'undo', label: '' } }, [0])).toBe(
      'Tool button',
    );
    // ADR-0021: a Table cell surfaces its text; a Table row reads as header vs a plain body row.
    expect(nodeLabel({ type: 'TableCell', props: { content: 'Ada' } }, [0])).toBe(
      'Table cell: Ada',
    );
    expect(nodeLabel({ type: 'TableRow', props: { header: true }, children: [] }, [0])).toBe(
      'Table row: header',
    );
    expect(nodeLabel({ type: 'TableRow', props: { header: false }, children: [] }, [0])).toBe(
      'Table row',
    );
  });

  it('falls back to the bare label when the content is blank', () => {
    expect(nodeLabel({ type: 'Text', props: { content: '   ', variant: 'body' } }, [0])).toBe(
      'Text',
    );
  });
});
