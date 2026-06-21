// The undo/redo history reducer (D4) — PURE over DocumentBody. No zustand, no React, no I/O, so it is
// unit-tested directly (history.test.ts). The store holds one `History` plus a denormalised present
// (top-level frames/themeOverrides) and routes every document mutation through `record` (via the store's
// `mutate` funnel); undo/redo restore a past/future snapshot. Clearing Selection on undo is a UI
// side-effect the store owns — it never enters here.
//
// IMMUTABILITY CONTRACT: bodies are stored BY REFERENCE (no copy). Callers MUST treat any DocumentBody
// handed to record/undo/redo as frozen — never mutate its `frames`/`themeOverrides` (or a node subtree)
// in place afterwards, or you retroactively rewrite an already-recorded snapshot. The store upholds this
// by replacing arrays/subtrees wholesale on every edit (structuredClone(root) + frames.map/filter), so
// the present is always a fresh allocation. This is the standard immutable-snapshot pattern.
import { type DocumentBody } from './document';

export interface History {
  past: DocumentBody[];
  future: DocumentBody[];
  /** The coalesce key of the last recorded edit (null = discrete); consecutive same-key edits merge. */
  lastKey: string | null;
}

export const emptyHistory: History = { past: [], future: [], lastKey: null };

const LIMIT = 100;

/** Record the pre-edit body before a mutation. Consecutive edits sharing a non-null `key` (typing in
 *  one field, dragging one swatch) coalesce into a single undo step; a discrete edit passes null.
 *  Always clears the redo stack. */
export function record(history: History, prev: DocumentBody, key: string | null): History {
  const coalesce = key !== null && key === history.lastKey;
  const past = coalesce ? history.past : [...history.past, prev].slice(-LIMIT);
  return { past, future: [], lastKey: key };
}

/** Step back: pop the newest past body and push `current` onto the redo stack. Null when nothing to undo. */
export function undo(
  history: History,
  current: DocumentBody,
): { history: History; body: DocumentBody } | null {
  const body = history.past.at(-1);
  if (body === undefined) return null;
  return {
    history: {
      past: history.past.slice(0, -1),
      future: [current, ...history.future],
      lastKey: null,
    },
    body,
  };
}

/** Step forward: pop the next future body and push `current` onto the past stack. Null when nothing to redo. */
export function redo(
  history: History,
  current: DocumentBody,
): { history: History; body: DocumentBody } | null {
  const body = history.future[0];
  if (body === undefined) return null;
  return {
    history: { past: [...history.past, current], future: history.future.slice(1), lastKey: null },
    body,
  };
}
