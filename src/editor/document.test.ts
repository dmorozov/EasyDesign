import { describe, expect, it } from 'vitest';

import { decideSave, parseDocument } from './document';

// A minimal valid raw document holding one Frame; `over` patches/omits fields (e.g. drop `width`).
function rawDoc(over: Record<string, unknown> = {}): unknown {
  return {
    version: 1,
    frames: [
      {
        id: 'f1',
        title: 'T',
        target: 'web',
        x: 0,
        y: 0,
        root: { type: 'Stack', children: [] },
        ...over,
      },
    ],
    themeOverrides: {},
  };
}

describe('parseDocument — Preview-width back-fill (ADR-0013)', () => {
  it('accepts a pre-width document and back-fills a web Frame to 1280', () => {
    const doc = parseDocument(rawDoc({ target: 'web' })); // no `width` key
    expect(doc).not.toBeNull();
    expect(doc?.frames[0]?.width).toBe(1280);
  });
  it('back-fills an email Frame to 600', () => {
    const doc = parseDocument(rawDoc({ target: 'email' }));
    expect(doc?.frames[0]?.width).toBe(600);
  });
  it('preserves an explicit width', () => {
    const doc = parseDocument(rawDoc({ target: 'web', width: 768 }));
    expect(doc?.frames[0]?.width).toBe(768);
  });
  it('still rejects a malformed document', () => {
    expect(parseDocument({ version: 1, frames: 'nope', themeOverrides: {} })).toBeNull();
    expect(parseDocument(null)).toBeNull();
  });
});

describe('decideSave — when the persistence effect saves (RP-7)', () => {
  const body = { frames: [], themeOverrides: {} };

  it('primes on the initial mount — record, but DON’T re-save the just-loaded document', () => {
    expect(decideSave(null, body)).toBe('prime');
  });

  it('skips an unchanged body (StrictMode double-invoke / a no-op set → same references)', () => {
    expect(decideSave(body, body)).toBe('skip');
    // a different wrapper object but the SAME inner refs is still a skip (reference identity is the signal)
    expect(decideSave({ frames: body.frames, themeOverrides: body.themeOverrides }, body)).toBe(
      'skip',
    );
  });

  it('saves when frames change by reference (a real edit)', () => {
    expect(decideSave(body, { frames: [], themeOverrides: body.themeOverrides })).toBe('save');
  });

  it('saves when themeOverrides change by reference', () => {
    expect(decideSave(body, { frames: body.frames, themeOverrides: {} })).toBe('save');
  });
});
