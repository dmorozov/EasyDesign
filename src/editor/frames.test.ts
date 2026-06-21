import { describe, expect, it } from 'vitest';

import { type Node } from '../ir/types';

import { type EditorFrame } from './document';
import {
  canInsertComponent,
  canInsertInTarget,
  createFrame,
  deleteFrame,
  insertHint,
  isEmailFrameClean,
  isNodeEmailSafe,
  moveFrame,
  nextSlot,
  type FrameTarget,
} from './frames';
import { PALETTE, type PaletteItem } from './palette';

const item = (emailSafe: boolean): PaletteItem => ({
  id: 'x',
  label: 'X',
  icon: 'stack',
  group: 'layout',
  emailSafe,
  create: () => ({ type: 'Stack', children: [] }),
});
const frame = (target: FrameTarget, over: Partial<EditorFrame> = {}): EditorFrame => ({
  id: 'f',
  title: 't',
  target,
  x: 0,
  y: 0,
  root: { type: 'Stack', children: [] },
  ...over,
});

describe('canInsertComponent — the ONE email rule (ADR-0006)', () => {
  it('a web Frame accepts everything', () => {
    expect(canInsertComponent(frame('web'), item(false))).toBe(true);
    expect(canInsertComponent(frame('web'), item(true))).toBe(true);
  });
  it('an email Frame takes only email-safe Components', () => {
    expect(canInsertComponent(frame('email'), item(false))).toBe(false); // e.g. a Grid
    expect(canInsertComponent(frame('email'), item(true))).toBe(true);
  });
  it('canInsertInTarget answers the same rule from a bare target', () => {
    expect(canInsertInTarget('email', item(false))).toBe(false);
    expect(canInsertInTarget('web', item(false))).toBe(true);
  });
  it('insertHint names the medium', () => {
    expect(insertHint('email')).toBe('Not available in Email');
  });
});

describe('createFrame — target fixed at creation, unique id, seeded shell', () => {
  it('mints a Frame with the injected id, default title, empty Stack root', () => {
    const { frames, created } = createFrame([], 'email', () => 'frame-1');
    expect(created).toMatchObject({ id: 'frame-1', target: 'email', title: 'New email' });
    expect(created.root).toEqual({ type: 'Stack', style: { gap: 'space.md' }, children: [] });
    expect(frames).toEqual([created]);
  });
  it('appends without mutating the input array; web gets the web title', () => {
    const before: EditorFrame[] = [frame('web', { id: 'a' })];
    const { frames, created } = createFrame(before, 'web', () => 'b');
    expect(created.title).toBe('New screen');
    expect(frames).toHaveLength(2);
    expect(before).toHaveLength(1); // not mutated
  });
});

describe('deleteFrame — pure removal, reports the removed Frame', () => {
  it('removes by id and returns it', () => {
    const fs = [frame('web', { id: 'a' }), frame('email', { id: 'b' })];
    const { frames, removed } = deleteFrame(fs, 'a');
    expect(frames.map((f) => f.id)).toEqual(['b']);
    expect(removed?.id).toBe('a');
  });
  it('is a no-op on an unknown id (same array reference, removed undefined)', () => {
    const fs = [frame('web', { id: 'a' })];
    const { frames, removed } = deleteFrame(fs, 'nope');
    expect(frames).toBe(fs);
    expect(removed).toBeUndefined();
  });
});

describe('moveFrame — immutable, same-position short-circuit', () => {
  it('writes new x/y immutably', () => {
    const fs = [frame('web', { id: 'a', x: 0, y: 0 })];
    const next = moveFrame(fs, 'a', 10, 20);
    expect(next[0]).toMatchObject({ x: 10, y: 20 });
    expect(fs[0]).toMatchObject({ x: 0, y: 0 }); // original untouched
  });
  it('returns the SAME array when the position is unchanged (no history churn)', () => {
    const fs = [frame('web', { id: 'a', x: 5, y: 5 })];
    expect(moveFrame(fs, 'a', 5, 5)).toBe(fs);
  });
  it('returns the SAME array on an unknown id (the store skips a history entry)', () => {
    const fs = [frame('web', { id: 'a', x: 5, y: 5 })];
    expect(moveFrame(fs, 'nope', 9, 9)).toBe(fs);
  });
});

describe('nextSlot — non-overlapping placement', () => {
  it('first Frame at 40,40; subsequent cascade right', () => {
    expect(nextSlot([])).toEqual({ x: 40, y: 40 });
    expect(nextSlot([frame('web', { x: 100, y: 60 })])).toEqual({ x: 560, y: 60 });
  });
});

describe('isEmailFrameClean — the import-time email audit (ADR-0006)', () => {
  const grid: Node = { type: 'Grid', props: { columns: 2 }, children: [] };
  const text: Node = { type: 'Text', props: { content: 'hi', variant: 'body' } };

  it('web Frames are always clean (the rule is email-only)', () => {
    expect(isEmailFrameClean('web', grid)).toBe(true);
  });
  it('an all-email-safe email tree is clean', () => {
    expect(isEmailFrameClean('email', { type: 'Stack', children: [text] })).toBe(true);
  });
  it('flags an email-unsafe node nested anywhere', () => {
    expect(
      isEmailFrameClean('email', { type: 'Stack', children: [{ type: 'Row', children: [grid] }] }),
    ).toBe(false);
  });
  it('is defensive over malformed/partial imported IR (never throws)', () => {
    expect(isEmailFrameClean('email', null)).toBe(true);
    expect(isEmailFrameClean('email', { children: 'nope' })).toBe(true);
  });
});

describe('the type-level email rule stays in sync with the Palette', () => {
  it('isNodeEmailSafe(item type) === item.emailSafe for every Palette item', () => {
    for (const item of PALETTE) {
      expect(isNodeEmailSafe(item.create().type)).toBe(item.emailSafe);
    }
  });
});
