import { describe, expect, it } from 'vitest';

import { type DocumentBody } from '../../src/editor/document';
import { emptyHistory, record, redo, undo, type History } from '../../src/editor/history';

// Bodies are identified by a marker frame title so assertions read clearly; only identity/shape matters.
const body = (tag: string): DocumentBody => ({
  frames: [
    {
      id: tag,
      title: tag,
      target: 'web',
      x: 0,
      y: 0,
      width: 1280,
      root: { type: 'Stack', children: [] },
    },
  ],
  themeOverrides: {},
});

describe('record — coalescing + redo-clear + cap', () => {
  it('a discrete edit (null key) always pushes the prev body', () => {
    const h = record(emptyHistory, body('a'), null);
    expect(h.past).toHaveLength(1);
    expect(h.lastKey).toBeNull();
  });
  it('consecutive same-key edits coalesce (one entry)', () => {
    let h = record(emptyHistory, body('a'), 'text:1');
    h = record(h, body('b'), 'text:1');
    h = record(h, body('c'), 'text:1');
    expect(h.past).toHaveLength(1);
    expect(h.past[0]?.frames[0]?.id).toBe('a'); // the pre-chain body, not later ones
  });
  it('different keys do not coalesce', () => {
    let h = record(emptyHistory, body('a'), 'text:1');
    h = record(h, body('b'), 'text:2');
    expect(h.past).toHaveLength(2);
  });
  it('recording clears the redo stack', () => {
    const h: History = { past: [body('a')], future: [body('f')], lastKey: null };
    expect(record(h, body('b'), null).future).toEqual([]);
  });
  it('caps the past at 100 entries, dropping the oldest', () => {
    let h = emptyHistory;
    for (let i = 0; i < 105; i++) h = record(h, body(String(i)), null);
    expect(h.past).toHaveLength(100);
    expect(h.past[0]?.frames[0]?.id).toBe('5'); // 0..4 dropped
  });
});

describe('undo / redo', () => {
  it('undo returns the newest past body and moves current to the redo stack', () => {
    const h: History = { past: [body('p')], future: [], lastKey: 'text:1' };
    const r = undo(h, body('cur'));
    expect(r?.body.frames[0]?.id).toBe('p');
    expect(r?.history.past).toEqual([]);
    expect(r?.history.future[0]?.frames[0]?.id).toBe('cur');
    expect(r?.history.lastKey).toBeNull(); // a fresh edit after undo won't coalesce
  });
  it('undo returns null when there is nothing to undo', () => {
    expect(undo(emptyHistory, body('cur'))).toBeNull();
  });
  it('redo returns the next future body and moves current to the past stack', () => {
    const h: History = { past: [], future: [body('n')], lastKey: null };
    const r = redo(h, body('cur'));
    expect(r?.body.frames[0]?.id).toBe('n');
    expect(r?.history.future).toEqual([]);
    expect(r?.history.past[0]?.frames[0]?.id).toBe('cur');
  });
  it('redo returns null when there is nothing to redo', () => {
    expect(redo(emptyHistory, body('cur'))).toBeNull();
  });
  it('undo then redo round-trips', () => {
    const start: History = { past: [body('p')], future: [], lastKey: null };
    const afterUndo = undo(start, body('cur'));
    const afterRedo = afterUndo && redo(afterUndo.history, afterUndo.body);
    expect(afterRedo).not.toBeNull();
    expect(afterRedo?.body.frames[0]?.id).toBe('cur');
    expect(afterRedo?.history.past).toEqual(start.past);
    expect(afterRedo?.history.future).toEqual([]);
  });

  it('a same-key edit right after an undo starts a fresh step (does not coalesce into nothing)', () => {
    let h = record(emptyHistory, body('a'), 'text:1');
    h = record(h, body('b'), 'text:1'); // coalesced → one entry
    expect(h.past).toHaveLength(1);
    const undone = undo(h, body('cur'));
    expect(undone?.history.lastKey).toBeNull(); // undo resets the coalesce key
    // typing again in the same field after Ctrl+Z must push a new entry, not merge into the undone chain
    const after = undone && record(undone.history, body('cur'), 'text:1');
    expect(after?.past).toHaveLength(1);
  });
});
