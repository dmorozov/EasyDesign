import { describe, expect, it } from 'vitest';

import { type Node } from '../ir/types';

import { resolveEditModel } from './edit-model';

// resolveEditModel is the RP-6 testability win: "what can I edit about this Selection" is now a pure
// function, so the rules that used to be inline in Inspector JSX — the email-root style narrowing, the
// Row-`fill` justify/wrap hiding, the per-type control set, the token-option resolution — become plain
// assertions with no React, no store, no rendering.

describe('resolveEditModel — leaves', () => {
  it('Text: content + typography (named style + free-form size/weight), no layout/style', () => {
    const node: Node = { type: 'Text', props: { content: 'Hi', variant: 'body' } };
    const m = resolveEditModel('web', node, [0]);
    expect(m.type).toBe('Text');
    expect(m.text).toEqual([{ key: 'content', label: 'Text', value: 'Hi' }]);
    expect(m.typography?.heading).toBe('body');
    expect(m.typography?.size?.key).toBe('fontSize');
    expect(m.typography?.weight?.key).toBe('fontWeight');
    expect(m.layout).toBeUndefined();
    expect(m.style).toBeUndefined(); // Text's style keys are typographic → live under typography
  });

  it('Text size/weight options come from the Type scale, lead with a "Default" clear row', () => {
    const node: Node = { type: 'Text', props: { content: 'Hi', variant: 'body' } };
    const size = resolveEditModel('web', node, [0]).typography?.size;
    expect(size?.options[0]).toEqual({ value: '', label: 'Default' });
    expect(size?.options.some((o) => o.value === 'font.size.lg')).toBe(true);
    expect(size?.options.every((o) => o.value === '' || o.value.startsWith('font.size.'))).toBe(
      true,
    );
  });

  it('Text reflects a free-form fontSize override as the current value', () => {
    const node: Node = {
      type: 'Text',
      props: { content: 'Hi', variant: 'body' },
      style: { fontSize: 'font.size.xl' },
    };
    const m = resolveEditModel('web', node, [0]);
    expect(m.typography?.size?.value).toBe('font.size.xl');
    expect(m.typography?.weight?.value).toBe(''); // unset → Default
  });

  it('Button: a single Label text field — no typography, layout, or style', () => {
    const node: Node = { type: 'Button', props: { content: 'Go', variant: 'primary' } };
    const m = resolveEditModel('web', node, [0]);
    expect(m.text).toEqual([{ key: 'content', label: 'Label', value: 'Go' }]);
    expect(m.typography).toBeUndefined();
    expect(m.layout).toBeUndefined();
    expect(m.style).toBeUndefined();
  });

  it('Image: nothing editable (no controls, no text fields, no style keys)', () => {
    const node: Node = { type: 'Image', props: { src: 's', alt: 'a' } };
    const m = resolveEditModel('web', node, [0]);
    expect(m).toEqual({ type: 'Image' });
  });

  it('Radio: two text fields (label, value) in order; nothing else (RP-10)', () => {
    const node: Node = { type: 'Radio', props: { value: 'pro', label: 'Pro plan' } };
    const m = resolveEditModel('web', node, [0, 1]);
    expect(m.text).toEqual([
      { key: 'label', label: 'Label', value: 'Pro plan' },
      { key: 'value', label: 'Value', value: 'pro' },
    ]);
    expect(m.layout).toBeUndefined();
    expect(m.typography).toBeUndefined();
    expect(m.style).toBeUndefined();
  });
});

describe('resolveEditModel — containers (layout + style)', () => {
  it('Stack with no props resolves the layout defaults; exposes all container style keys', () => {
    const node: Node = { type: 'Stack', children: [] };
    const m = resolveEditModel('web', node, []);
    expect(m.layout).toEqual({ justify: 'start', align: 'stretch', wrap: 'nowrap' }); // no distribute
    expect(m.style?.map((f) => f.key)).toEqual(['background', 'padding', 'borderRadius', 'gap']);
    expect(m.text).toBeUndefined();
    expect(m.typography).toBeUndefined();
  });

  it('reads the container current layout values from props', () => {
    const node: Node = { type: 'Stack', props: { justify: 'center', align: 'end' }, children: [] };
    expect(resolveEditModel('web', node, []).layout).toMatchObject({
      justify: 'center',
      align: 'end',
      wrap: 'nowrap',
    });
  });

  it('container style options are sourced from each key category (background → colors)', () => {
    const node: Node = { type: 'Stack', children: [] };
    const bg = resolveEditModel('web', node, []).style?.find((f) => f.key === 'background');
    expect(bg?.options[0]).toEqual({ value: '', label: 'Default' });
    expect(bg?.options.some((o) => o.value === 'color.brand')).toBe(true);
  });

  // ADR-0019: an explicit zero. 'Default' (value '') only *clears* the key (CSS default, and in MJML a
  // non-zero fallback); `space.none` is the discoverable way to pin padding/gap to 0 — full-width chrome.
  it('padding and gap offer an explicit "none · 0px" zero option (space.none)', () => {
    const node: Node = { type: 'Stack', children: [] };
    const style = resolveEditModel('web', node, []).style;
    for (const key of ['padding', 'gap'] as const) {
      const field = style?.find((f) => f.key === key);
      expect(field?.options.some((o) => o.value === 'space.none' && o.label === 'none · 0px')).toBe(
        true,
      );
    }
  });

  it('Row (fit) offers distribute + justify + align + wrap', () => {
    const node: Node = { type: 'Row', props: { distribute: 'fit' }, children: [] };
    const layout = resolveEditModel('web', node, []).layout;
    expect(layout).toEqual({
      distribute: 'fit',
      justify: 'start',
      align: 'stretch',
      wrap: 'nowrap',
    });
  });

  it('Row (fill) hides justify AND wrap (no free space), keeps distribute + align', () => {
    const node: Node = { type: 'Row', props: { distribute: 'fill' }, children: [] };
    const layout = resolveEditModel('web', node, []).layout;
    expect(layout?.distribute).toBe('fill');
    expect(layout?.align).toBe('stretch');
    expect(layout?.justify).toBeUndefined();
    expect(layout?.wrap).toBeUndefined();
  });

  it('Grid offers justify + align but never wrap or distribute', () => {
    const node: Node = { type: 'Grid', props: { columns: 2 }, children: [] };
    const layout = resolveEditModel('web', node, []).layout;
    expect(layout?.justify).toBe('start');
    expect(layout?.align).toBe('stretch');
    expect(layout?.wrap).toBeUndefined();
    expect(layout?.distribute).toBeUndefined();
  });

  it('RadioGroup (a component container) exposes its label text field, NOT a layout section (RP-10)', () => {
    const node: Node = { type: 'RadioGroup', props: { label: 'Plan' }, children: [] };
    const m = resolveEditModel('web', node, []);
    expect(m.text).toEqual([{ key: 'label', label: 'Group label', value: 'Plan' }]);
    expect(m.layout).toBeUndefined(); // it renders as a Component, not a layout box
    expect(m.style).toBeUndefined();
  });
});

describe('resolveEditModel — medium narrows container style (ADR-0006)', () => {
  it('email ROOT container exposes only background + padding', () => {
    const node: Node = { type: 'Stack', children: [] };
    const m = resolveEditModel('email', node, []);
    expect(m.style?.map((f) => f.key)).toEqual(['background', 'padding']);
  });

  it('email NESTED container exposes no style keys (MJML only styles the root Stack)', () => {
    const node: Node = { type: 'Stack', children: [] };
    const m = resolveEditModel('email', node, [0]);
    expect(m.style).toBeUndefined();
  });

  it('email does NOT narrow a Text node — its typography survives into MJML (RP-3 binding)', () => {
    const node: Node = { type: 'Text', props: { content: 'Hi', variant: 'h2' } };
    const m = resolveEditModel('email', node, [0]);
    expect(m.text).toEqual([{ key: 'content', label: 'Text', value: 'Hi' }]);
    expect(m.typography?.heading).toBe('h2');
    expect(m.typography?.size?.key).toBe('fontSize');
  });

  it('email still offers full layout on a nested container — only style is medium-gated', () => {
    const node: Node = { type: 'Row', props: { distribute: 'fit' }, children: [] };
    const m = resolveEditModel('email', node, [0]);
    expect(m.layout).toEqual({
      distribute: 'fit',
      justify: 'start',
      align: 'stretch',
      wrap: 'nowrap',
    });
    expect(m.style).toBeUndefined();
  });
});
