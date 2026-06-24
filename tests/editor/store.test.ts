import { beforeEach, describe, expect, it } from 'vitest';

import { makeAppShell } from '../../src/editor/descriptors';
import { emptyHistory } from '../../src/editor/history';
import { nodeAt, type NodePath } from '../../src/editor/paths';
import { useEditor } from '../../src/editor/store';
import { type Node } from '../../src/ir/types';

// ── D4 regression net ───────────────────────────────────────────────────────
// CHARACTERIZATION tests of the editor history + persistence contract as it stands TODAY (post-D3).
// They drive the store's public actions and pin the observable behaviour D4 must preserve when it
// extracts/hardens this machinery — the same byte-equality discipline that guarded D1. They assert
// OUTCOMES (history length, what undo restores) over internals; a couple of `lastCommitKey` checks
// document the coalesce-key scheme on purpose. The store loads from localStorage at import, which is
// absent under node → it initialises from the seeded document, captured here once.

const SEED = structuredClone(useEditor.getState().frames);
const s = () => useEditor.getState();
const text = (content = 'x'): Node => ({ type: 'Text', props: { content, variant: 'body' } });
function content(frameId: string, path: NodePath): string | undefined {
  const frame = s().frames.find((f) => f.id === frameId);
  const node = frame ? nodeAt(frame.root, path) : undefined;
  return node && (node.type === 'Text' || node.type === 'Button') ? node.props.content : undefined;
}

beforeEach(() => {
  useEditor.setState({
    frames: structuredClone(SEED),
    selectedFrameId: null,
    selectedPath: null,
    themeOverrides: {},
    rightTab: 'inspector',
    exportTarget: 'react',
    dropTarget: null,
    pendingFocusFrameId: null,
    docKey: 0,
    saveStatus: 'saved',
    history: emptyHistory,
  });
});

describe('coalescing — consecutive same-key edits collapse into one undo step', () => {
  it('text edits on the same node coalesce (one entry, keyed by frame+path)', () => {
    s().setTextProp('web-1', [0], 'content', 'a');
    s().setTextProp('web-1', [0], 'content', 'ab');
    s().setTextProp('web-1', [0], 'content', 'abc');
    expect(s().history.past).toHaveLength(1);
    expect(s().history.lastKey).toBe('prop:web-1:0:content'); // coalesce key = frame:path:propKey
  });
  it('text edits on different nodes do NOT coalesce', () => {
    s().setTextProp('web-1', [0], 'content', 'a'); // heading
    s().setTextProp('web-1', [1, 0], 'content', 'b'); // a grid cell
    expect(s().history.past).toHaveLength(2);
  });
  it('layout edits on the same container coalesce', () => {
    s().setLayout('web-1', [], { justify: 'center' });
    s().setLayout('web-1', [], { align: 'center' });
    expect(s().history.past).toHaveLength(1);
  });
  it('theme overrides coalesce per token name', () => {
    s().setThemeOverride('color.brand', '#111');
    s().setThemeOverride('color.brand', '#222');
    expect(s().history.past).toHaveLength(1);
    s().setThemeOverride('color.surface', '#333');
    expect(s().history.past).toHaveLength(2);
  });
  it('Frame renames coalesce per Frame', () => {
    s().renameFrame('web-1', 'A');
    s().renameFrame('web-1', 'AB');
    expect(s().history.past).toHaveLength(1);
    expect(s().frames.find((f) => f.id === 'web-1')?.title).toBe('AB');
  });
  it('a discrete op between two same-key edits breaks the coalesce chain', () => {
    s().setTextProp('web-1', [0], 'content', 'a'); // entry 1
    s().insertChild('web-1', [], text()); // entry 2 (null key resets lastCommitKey)
    s().setTextProp('web-1', [0], 'content', 'ab'); // entry 3 — no longer coalesces
    expect(s().history.past).toHaveLength(3);
  });
});

describe('setTextProp — writes only descriptor-declared text props (RP-10 gate)', () => {
  it('is a no-op on a node type with no such text prop (the root Stack has no textFields)', () => {
    s().setTextProp('web-1', [], 'content', 'x');
    expect(s().history.past).toHaveLength(0);
  });
  it('is a no-op for an undeclared key on a node that declares others (Text → only `content`)', () => {
    s().setTextProp('web-1', [0], 'variant', 'h1'); // `variant` is not a text field
    expect(s().history.past).toHaveLength(0);
  });
});

describe('discrete edits — null coalesce key always pushes', () => {
  it('two inserts make two entries', () => {
    s().insertChild('web-1', [], text());
    s().insertChild('web-1', [], text());
    expect(s().history.past).toHaveLength(2);
  });
  it('addFrame and removeFrame each push (and never coalesce)', () => {
    s().addFrame('web');
    s().addFrame('email');
    expect(s().history.past).toHaveLength(2);
    expect(s().frames).toHaveLength(4);
  });
});

describe('moveFrame — only a real move makes history', () => {
  it('moving to a new position pushes one entry', () => {
    s().moveFrame('web-1', 200, 220);
    expect(s().history.past).toHaveLength(1);
    expect(s().frames.find((f) => f.id === 'web-1')).toMatchObject({ x: 200, y: 220 });
  });
  it('moving to the same position pushes nothing (no history churn)', () => {
    s().moveFrame('web-1', 40, 40); // its seeded position
    expect(s().history.past).toHaveLength(0);
  });
});

describe('setFrameWidth — only a real resize makes history (ADR-0013)', () => {
  it('resizing to a new Preview width pushes one entry and updates the Frame', () => {
    s().setFrameWidth('web-1', 375);
    expect(s().history.past).toHaveLength(1);
    expect(s().frames.find((f) => f.id === 'web-1')?.width).toBe(375);
  });
  it('resizing to the same width pushes nothing (no history churn)', () => {
    const current = s().frames.find((f) => f.id === 'web-1')?.width ?? 0;
    s().setFrameWidth('web-1', current);
    expect(s().history.past).toHaveLength(0);
  });
  it('undo restores the prior width', () => {
    s().setFrameWidth('web-1', 768);
    s().undo();
    expect(s().frames).toEqual(SEED);
  });
});

describe('Snapshot captures the document only', () => {
  it('a history entry has exactly { frames, themeOverrides }', () => {
    s().setTextProp('web-1', [0], 'content', 'a');
    expect(Object.keys(s().history.past[0] ?? {}).sort()).toEqual(['frames', 'themeOverrides']);
  });
  it('undo restores the document and CLEARS Selection (selection is not in history)', () => {
    s().selectNode('web-1', [0]);
    s().setTextProp('web-1', [0], 'content', 'changed');
    expect(s().selectedFrameId).toBe('web-1');
    s().undo();
    expect(s().frames).toEqual(SEED);
    expect(s().selectedFrameId).toBeNull();
    expect(s().selectedPath).toBeNull();
  });
});

describe('undo / redo mechanics', () => {
  it('undo moves a snapshot to the redo stack; redo re-applies it', () => {
    s().setTextProp('web-1', [0], 'content', 'changed');
    s().undo();
    expect(s().history.past).toHaveLength(0);
    expect(s().history.future).toHaveLength(1);
    expect(s().frames).toEqual(SEED);
    s().redo();
    expect(s().history.future).toHaveLength(0);
    expect(s().history.past).toHaveLength(1);
    expect(content('web-1', [0])).toBe('changed');
  });
  it('a new commit after undo clears the redo stack', () => {
    s().setTextProp('web-1', [0], 'content', 'a');
    s().undo();
    expect(s().history.future).toHaveLength(1);
    s().setTextProp('web-1', [0], 'content', 'b');
    expect(s().history.future).toHaveLength(0);
  });
  it('undo with empty history is a no-op', () => {
    s().undo();
    expect(s().frames).toEqual(SEED);
    expect(s().history.past).toHaveLength(0);
  });
  it('redo with empty future is a no-op', () => {
    s().setTextProp('web-1', [0], 'content', 'a');
    s().redo();
    expect(s().history.future).toHaveLength(0);
    expect(content('web-1', [0])).toBe('a');
  });
});

describe('history is bounded', () => {
  it('keeps at most HISTORY_LIMIT (100) entries, dropping the oldest', () => {
    for (let i = 0; i < 105; i++) s().insertChild('web-1', [], text(String(i)));
    expect(s().history.past).toHaveLength(100);
  });
});

// ── RP-1 characterization: moveNode / deleteNode ─────────────────────────────
// These two mutating actions had ZERO unit coverage. Pin their observable behaviour
// (tree outcome, resolved Selection, history) BEFORE RP-1 extracts the tree edits
// into src/editor/node-tree.ts — the byte-equality discipline that lets the extract
// prove it changed nothing. web-1 seed: Stack[ Text"Web screen", Grid[ Text"Cell A", Text"Cell B" ] ].
const childrenOf = (node: Node | undefined): Node[] =>
  node && 'children' in node ? node.children : [];
const rootOf = (id: string): Node | undefined => s().frames.find((f) => f.id === id)?.root;
const at = (id: string, path: NodePath): Node | undefined => {
  const root = rootOf(id);
  return root ? nodeAt(root, path) : undefined;
};

describe('moveNode — reorder within a container (the index-adjust)', () => {
  it('moving a child forward past a later sibling lands it after that sibling', () => {
    // Grid children [Cell A, Cell B]; move [1,0] (A) toward index 2 → [Cell B, Cell A].
    s().moveNode('web-1', [1, 0], [1], 2);
    expect(content('web-1', [1, 0])).toBe('Cell B');
    expect(content('web-1', [1, 1])).toBe('Cell A');
    expect(s().selectedPath).toEqual([1, 1]); // resolved resting place after the index-adjust
    expect(s().history.past).toHaveLength(1);
  });
  it('moving a child backward to the front needs no index-adjust', () => {
    s().moveNode('web-1', [1, 1], [1], 0); // move B to the front → [Cell B, Cell A]
    expect(content('web-1', [1, 0])).toBe('Cell B');
    expect(content('web-1', [1, 1])).toBe('Cell A');
    expect(s().selectedPath).toEqual([1, 0]);
  });
});

describe('moveNode — across containers', () => {
  it('lifts a grid cell up into the root Stack at the chosen index', () => {
    s().moveNode('web-1', [1, 1], [], 1); // Cell B → Stack index 1
    expect(childrenOf(rootOf('web-1'))).toHaveLength(3);
    expect(content('web-1', [1])).toBe('Cell B'); // moved node now sits at [1]
    expect(s().selectedPath).toEqual([1]);
    expect(childrenOf(at('web-1', [2]))).toHaveLength(1); // the Grid (now [2]) lost a child
    expect(s().history.past).toHaveLength(1);
  });
});

describe('moveNode — guards (no-op, no history)', () => {
  it('refuses to move the root', () => {
    s().moveNode('web-1', [], [1], 0);
    expect(s().frames).toEqual(SEED);
    expect(s().history.past).toHaveLength(0);
  });
  it('refuses to move a node into its own subtree', () => {
    s().moveNode('web-1', [1], [1, 0], 0); // the Grid into one of its own cells
    expect(s().frames).toEqual(SEED);
    expect(s().history.past).toHaveLength(0);
  });
  it('refuses an unknown frame', () => {
    s().moveNode('nope', [0], [1], 0);
    expect(s().frames).toEqual(SEED);
    expect(s().history.past).toHaveLength(0);
  });
  it('refuses a non-container target parent', () => {
    s().moveNode('web-1', [0], [1, 0], 0); // target parent [1,0] is a Text leaf
    expect(s().frames).toEqual(SEED);
    expect(s().history.past).toHaveLength(0);
  });
});

describe('deleteNode', () => {
  it('removes a top-level child and clears the Selection', () => {
    s().selectNode('web-1', [0]);
    s().deleteNode('web-1', [0]);
    expect(childrenOf(rootOf('web-1'))).toHaveLength(1);
    expect(childrenOf(rootOf('web-1'))[0]?.type).toBe('Grid');
    expect(s().selectedFrameId).toBeNull();
    expect(s().selectedPath).toBeNull();
    expect(s().history.past).toHaveLength(1);
  });
  it('removes a deeply nested node', () => {
    s().deleteNode('web-1', [1, 1]); // delete Cell B
    expect(content('web-1', [1, 0])).toBe('Cell A');
    expect(at('web-1', [1, 1])).toBeUndefined();
  });
  it('refuses to delete the root (no-op, no history)', () => {
    s().deleteNode('web-1', []);
    expect(s().frames).toEqual(SEED);
    expect(s().history.past).toHaveLength(0);
  });
  it('refuses an unknown frame', () => {
    s().deleteNode('nope', [0]);
    expect(s().frames).toEqual(SEED);
    expect(s().history.past).toHaveLength(0);
  });
  it('undo restores a deleted subtree', () => {
    s().deleteNode('web-1', [1]); // delete the whole Grid
    s().undo();
    expect(s().frames).toEqual(SEED);
  });
});

describe('setVariant — the heading-style picker (RP-6)', () => {
  const variantOf = (id: string, path: NodePath): string | undefined => {
    const node = at(id, path);
    return node?.type === 'Text' ? node.props.variant : undefined;
  };
  it('changes a Text node’s named style and is undoable', () => {
    expect(variantOf('web-1', [0])).toBe('h2'); // seed heading
    s().setVariant('web-1', [0], 'h1');
    expect(variantOf('web-1', [0])).toBe('h1');
    expect(s().history.past).toHaveLength(1);
    s().undo();
    expect(s().frames).toEqual(SEED);
  });
  it('refuses a non-Text node (no-op, no history)', () => {
    s().setVariant('web-1', [1], 'h1'); // [1] is the Grid
    expect(s().frames).toEqual(SEED);
    expect(s().history.past).toHaveLength(0);
  });
  it('refuses an unknown frame (no-op, no history)', () => {
    s().setVariant('nope', [0], 'h1');
    expect(s().frames).toEqual(SEED);
    expect(s().history.past).toHaveLength(0);
  });
  it('coalesces repeated picks on the same node into one undo step', () => {
    s().setVariant('web-1', [0], 'h1');
    s().setVariant('web-1', [0], 'h3');
    expect(s().history.past).toHaveLength(1);
    expect(variantOf('web-1', [0])).toBe('h3');
  });
});

describe('setThemeOverride — clearing reverts to the base token (RP-6)', () => {
  it('a blank value DELETES the override key (no stale "" that breaks canvas/MJML)', () => {
    s().setThemeOverride('font.size.2xl', '28px');
    expect(s().themeOverrides['font.size.2xl']).toBe('28px');
    s().setThemeOverride('font.size.2xl', '');
    expect('font.size.2xl' in s().themeOverrides).toBe(false);
  });
  it('clearing an unset token is a no-op (no history churn)', () => {
    s().setThemeOverride('font.size.lg', '   ');
    expect(s().themeOverrides['font.size.lg']).toBeUndefined();
    expect(s().history.past).toHaveLength(0);
  });
});

describe('setNodeStyle — token-bound container style', () => {
  const styleOf = (id: string) => s().frames.find((f) => f.id === id)?.root.style;
  it('binds a Design Token to a style key and is undoable', () => {
    s().setNodeStyle('web-1', [], 'background', 'color.brand');
    expect(styleOf('web-1')?.background).toBe('color.brand');
    expect(s().history.past).toHaveLength(1);
    s().undo();
    expect(s().frames).toEqual(SEED);
  });
  it('clears a key when passed an empty ref', () => {
    s().setNodeStyle('web-1', [], 'gap', '');
    expect(styleOf('web-1')?.gap).toBeUndefined();
  });
  it('coalesces repeated edits of the same key, but not of a different key', () => {
    s().setNodeStyle('web-1', [], 'background', 'color.brand');
    s().setNodeStyle('web-1', [], 'background', 'color.surface');
    expect(s().history.past).toHaveLength(1); // same node+key → one undo step
    s().setNodeStyle('web-1', [], 'padding', 'space.md');
    expect(s().history.past).toHaveLength(2); // different key → a new step
  });
});

// ADR-0017 — the AppShell region toggles, the flexible half of the app-shell feature.
describe('toggleRegion — AppShell side panels (ADR-0017)', () => {
  const webRoot = (): Node => {
    const f = s().frames.find((fr) => fr.id === 'web-1');
    if (!f) throw new Error('web-1 missing');
    return f.root;
  };
  function shellAreas(path: NodePath): string[] {
    const node = nodeAt(webRoot(), path);
    return node?.type === 'AppShell' ? node.children.map((c) => c.props.area) : [];
  }
  function seedAppShell(): NodePath {
    s().insertChild('web-1', [], makeAppShell(['header', 'main', 'footer']));
    const r = webRoot();
    return 'children' in r ? [r.children.length - 1] : [];
  }

  it('adds an absent panel at its canonical position', () => {
    const path = seedAppShell();
    s().toggleRegion('web-1', path, 'left');
    expect(shellAreas(path)).toEqual(['header', 'left', 'main', 'footer']);
    s().toggleRegion('web-1', path, 'right');
    expect(shellAreas(path)).toEqual(['header', 'left', 'main', 'right', 'footer']);
  });
  it('removes a present panel, and is undoable', () => {
    const path = seedAppShell();
    s().toggleRegion('web-1', path, 'header');
    expect(shellAreas(path)).toEqual(['main', 'footer']);
    s().undo();
    expect(shellAreas(path)).toEqual(['header', 'main', 'footer']);
  });
  it('never toggles main (the required region) — a no-op with no history entry', () => {
    const path = seedAppShell();
    const before = s().history.past.length;
    s().toggleRegion('web-1', path, 'main');
    expect(shellAreas(path)).toEqual(['header', 'main', 'footer']);
    expect(s().history.past).toHaveLength(before);
  });
});
