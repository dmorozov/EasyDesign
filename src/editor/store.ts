import { create } from 'zustand';

import { sampleCard } from '../ir/sample';
import { type Align, type Distribute, type Justify, type Node, type Wrap } from '../ir/types';
import { type StyleKey } from '../theme/design-tokens';
import { type TextStyle } from '../theme/generated/typography';

import { DESCRIPTORS } from './descriptors';
import {
  loadFromLocal,
  type DocumentBody,
  type EditorDocument,
  type EditorFrame,
} from './document';
import * as Frames from './frames';
import {
  emptyHistory,
  record,
  redo as historyRedo,
  undo as historyUndo,
  type History,
} from './history';
import * as NodeTree from './node-tree';
import { nodeAt, type NodePath } from './paths';

export type { EditorFrame };

export type ExportTarget = 'html' | 'react' | 'angular' | 'mjml';
export type SaveStatus = 'saved' | 'saving';

/** Which right-rail panel is showing (chrome UI state — not part of the document/undo). */
export type RightTab = 'inspector' | 'design' | 'export';

export type DropMode = 'before' | 'after' | 'inside';
export interface DropTarget {
  frameId: string;
  path: NodePath;
  mode: DropMode;
}

interface EditorState {
  // ── Denormalised present (the live document body; top-level so component selectors stay simple) ──
  frames: EditorFrame[];
  themeOverrides: Record<string, string>;
  // ── Transient UI state (never enters history) ──
  selectedFrameId: string | null;
  selectedPath: NodePath | null;
  exportTarget: ExportTarget;
  rightTab: RightTab;
  dropTarget: DropTarget | null;
  pendingFocusFrameId: string | null; // id of a just-added Frame the Board should pan into view
  saveStatus: SaveStatus;
  docKey: number;
  // ── Undo/redo (D4): the pure history reducer over the document body ──
  history: History;
  // ── Actions ──
  selectNode: (frameId: string, path: NodePath) => void;
  setRightTab: (tab: RightTab) => void;
  clearSelection: () => void;
  insertChild: (frameId: string, parentPath: NodePath, node: Node) => void;
  insertAt: (frameId: string, parentPath: NodePath, index: number, node: Node) => void;
  moveNode: (frameId: string, fromPath: NodePath, parentPath: NodePath, index: number) => void;
  setDropTarget: (target: DropTarget | null) => void;
  updateText: (frameId: string, path: NodePath, content: string) => void;
  setVariant: (frameId: string, path: NodePath, variant: TextStyle) => void;
  setLayout: (
    frameId: string,
    path: NodePath,
    patch: { justify?: Justify; align?: Align; wrap?: Wrap; distribute?: Distribute },
  ) => void;
  setNodeStyle: (frameId: string, path: NodePath, key: StyleKey, ref: string) => void;
  deleteNode: (frameId: string, path: NodePath) => void;
  addFrame: (target: Frames.FrameTarget) => void;
  removeFrame: (frameId: string) => void;
  renameFrame: (frameId: string, title: string) => void;
  selectFrame: (frameId: string) => void;
  clearPendingFocus: () => void;
  setThemeOverride: (name: string, value: string) => void;
  setExportTarget: (target: ExportTarget) => void;
  setSaveStatus: (status: SaveStatus) => void;
  moveFrame: (frameId: string, x: number, y: number) => void;
  setFrameWidth: (frameId: string, width: number) => void;
  loadDocument: (doc: EditorDocument) => void;
  resetDocument: () => void;
  undo: () => void;
  redo: () => void;
}

const bodyOf = (s: Pick<EditorState, 'frames' | 'themeOverrides'>): DocumentBody => ({
  frames: s.frames,
  themeOverrides: s.themeOverrides,
});

// A document mutation returns the next body plus any UI side-effects (selection, rightTab, pan focus);
// null means "no-op" (invalid target, or a same-position move) → no history entry, no state change.
type DocEdit = { body: DocumentBody; ui?: Partial<EditorState> } | null;

// Apply a structural tree op (RP-1, node-tree.ts) to one Frame's root: look up the Frame, run the
// op (which clones + edits the tree), and reassemble the body. Returns the next body + the op's
// resolved path (the store maps it to Selection), or null if the Frame is missing or the op no-ops.
function applyTreeEdit(
  doc: DocumentBody,
  frameId: string,
  op: (root: Node) => NodeTree.TreeEdit | null,
): { body: DocumentBody; path: NodePath } | null {
  const frame = doc.frames.find((f) => f.id === frameId);
  if (!frame) return null;
  const result = op(frame.root);
  if (!result) return null;
  return {
    body: {
      ...doc,
      frames: doc.frames.map((f) => (f.id === frameId ? { ...f, root: result.root } : f)),
    },
    path: result.path,
  };
}

const webRoot: Node = {
  type: 'Stack',
  style: {
    background: 'color.surface',
    padding: 'space.lg',
    borderRadius: 'radius.lg',
    gap: 'space.md',
  },
  children: [
    { type: 'Text', props: { content: 'Web screen', variant: 'h2' } },
    {
      type: 'Grid',
      props: { columns: 2 },
      style: { gap: 'space.md' },
      children: [
        { type: 'Text', props: { content: 'Cell A', variant: 'body' } },
        { type: 'Text', props: { content: 'Cell B', variant: 'body' } },
      ],
    },
  ],
};

function createInitialFrames(): EditorFrame[] {
  return [
    {
      id: 'web-1',
      title: 'Web screen',
      target: 'web',
      x: 40,
      y: 40,
      width: Frames.TARGET_PROFILES.web.defaultWidth,
      root: structuredClone(webRoot),
    },
    {
      id: 'email-1',
      title: 'Welcome email',
      target: 'email',
      // Clear the web Frame's Preview width (1280) so the two seed Frames don't overlap (ADR-0013).
      x: 1360,
      y: 40,
      width: Frames.TARGET_PROFILES.email.defaultWidth,
      root: structuredClone(sampleCard.root),
    },
  ];
}

const saved = loadFromLocal();

export const useEditor = create<EditorState>()((set) => {
  // The ONE funnel for document mutations: every edit computes a pure `doc → {body, ui?}` transform;
  // this records history (coalescing) + clears redo + applies the present + UI in a single set(). An
  // action that returns null is a no-op. Whole-document ops (load/reset) and undo/redo use the history
  // reducer directly below, because they replace/restore the body wholesale.
  const mutate = (
    coalesceKey: string | null,
    edit: (doc: DocumentBody, state: EditorState) => DocEdit,
  ): void =>
    set((state) => {
      const prev = bodyOf(state);
      const result = edit(prev, state);
      if (result === null) return {};
      return { ...result.body, ...result.ui, history: record(state.history, prev, coalesceKey) };
    });

  return {
    frames: saved?.frames ?? createInitialFrames(),
    themeOverrides: saved?.themeOverrides ?? {},
    selectedFrameId: null,
    selectedPath: null,
    exportTarget: 'react',
    rightTab: 'inspector',
    dropTarget: null,
    pendingFocusFrameId: null,
    saveStatus: 'saved',
    docKey: 0,
    history: emptyHistory,

    // ── UI actions (no history) ──
    selectNode: (frameId, path) =>
      set({ selectedFrameId: frameId, selectedPath: path, rightTab: 'inspector' }),
    setRightTab: (tab) => set({ rightTab: tab }),
    clearSelection: () => set({ selectedFrameId: null, selectedPath: null }),
    setDropTarget: (target) => set({ dropTarget: target }),
    selectFrame: (frameId) =>
      set({ selectedFrameId: frameId, selectedPath: null, rightTab: 'inspector' }),
    clearPendingFocus: () => set({ pendingFocusFrameId: null }),
    setExportTarget: (target) => set({ exportTarget: target }),
    setSaveStatus: (status) => set({ saveStatus: status }),

    // ── Document mutations (structural edits via node-tree.ts → through the mutate funnel,
    //    so every one is undoable + persisted; the ops own clone + correctness, the store owns
    //    the Frame lookup, node-type gates, Selection, and history). ──
    insertChild: (frameId, parentPath, node) =>
      mutate(null, (doc) => {
        const r = applyTreeEdit(doc, frameId, (root) => NodeTree.insert(root, parentPath, node));
        if (!r) return null;
        return {
          body: r.body,
          ui: { selectedFrameId: frameId, rightTab: 'inspector', selectedPath: r.path },
        };
      }),

    insertAt: (frameId, parentPath, index, node) =>
      mutate(null, (doc) => {
        const r = applyTreeEdit(doc, frameId, (root) =>
          NodeTree.insert(root, parentPath, node, index),
        );
        if (!r) return null;
        return {
          body: r.body,
          ui: { selectedFrameId: frameId, rightTab: 'inspector', selectedPath: r.path },
        };
      }),

    moveNode: (frameId, fromPath, parentPath, index) =>
      mutate(null, (doc) => {
        const r = applyTreeEdit(doc, frameId, (root) =>
          NodeTree.move(root, fromPath, parentPath, index),
        );
        if (!r) return null;
        return {
          body: r.body,
          ui: { selectedFrameId: frameId, rightTab: 'inspector', selectedPath: r.path },
        };
      }),

    // The node-TYPE gate (Text/Button only) stays here as store sanitization (→ descriptor in RP-2);
    // node-tree's updateProps does the blind props merge + clone.
    updateText: (frameId, path, content) =>
      mutate(`text:${frameId}:${path.join('.')}`, (doc) => {
        const r = applyTreeEdit(doc, frameId, (root) => {
          const target = nodeAt(root, path);
          if (!target || (target.type !== 'Text' && target.type !== 'Button')) return null;
          return NodeTree.updateProps(root, path, { content });
        });
        return r ? { body: r.body } : null;
      }),

    // Set a Text node's named style (its `variant` — the heading-style picker, RP-6). The Text gate is
    // node-type sanitization (stays here → descriptor); node-tree's updateProps does the blind merge.
    // Coalesced per node so a flurry of picks is one undo step.
    setVariant: (frameId, path, variant) =>
      mutate(`variant:${frameId}:${path.join('.')}`, (doc) => {
        const r = applyTreeEdit(doc, frameId, (root) => {
          const target = nodeAt(root, path);
          if (target?.type !== 'Text') return null;
          return NodeTree.updateProps(root, path, { variant });
        });
        return r ? { body: r.body } : null;
      }),

    // Set a container's layout properties (justify/align/wrap/distribute). The container gate and the
    // Grid-has-no-wrap rule are node-type sanitization (stay here → descriptor in RP-2/RP-4); the
    // blind merge is node-tree's. Coalesced per node so a flurry of changes is one undo step.
    setLayout: (frameId, path, patch) =>
      mutate(`layout:${frameId}:${path.join('.')}`, (doc) => {
        const r = applyTreeEdit(doc, frameId, (root) => {
          const target = nodeAt(root, path);
          if (!target || !('children' in target)) return null; // only containers carry layout props
          // Grid has no flex-wrap: drop it from the patch (undefined deletes the key in updateProps).
          const effective = target.type === 'Grid' ? { ...patch, wrap: undefined } : patch;
          return NodeTree.updateProps(root, path, effective);
        });
        return r ? { body: r.body } : null;
      }),

    // Bind/clear a container's token-bound style key (background/padding/borderRadius/gap → a Design
    // Token ref, or '' to clear). The container gate stays here (→ RP-4 relaxes it for Text leaves);
    // node-tree's setStyle owns the set/clear + the no-change no-op. Coalesced per node + key.
    setNodeStyle: (frameId, path, key, ref) =>
      mutate(`style:${frameId}:${path.join('.')}:${key}`, (doc) => {
        const r = applyTreeEdit(doc, frameId, (root) => {
          const target = nodeAt(root, path);
          // RP-4: the style-key gate is descriptor-driven — containers honour bg/padding/radius/gap,
          // a Text leaf honours fontSize/fontWeight. (Was a blanket container-only gate.)
          if (!target || !DESCRIPTORS[target.type].styleKeys.includes(key)) return null;
          return NodeTree.setStyle(root, path, key, ref);
        });
        return r ? { body: r.body } : null;
      }),

    deleteNode: (frameId, path) =>
      mutate(null, (doc) => {
        const r = applyTreeEdit(doc, frameId, (root) => NodeTree.remove(root, path));
        if (!r) return null;
        return { body: r.body, ui: { selectedFrameId: null, selectedPath: null } };
      }),

    // Add a Frame (medium FIXED at creation, ADR-0006) and select it so the Palette reflects its medium.
    addFrame: (target) =>
      mutate(null, (doc) => {
        const { frames, created } = Frames.createFrame(doc.frames, target);
        return {
          body: { ...doc, frames },
          ui: {
            selectedFrameId: created.id,
            selectedPath: null,
            rightTab: 'inspector',
            pendingFocusFrameId: created.id, // ask the Board to pan the new Frame into view
          },
        };
      }),

    removeFrame: (frameId) =>
      mutate(null, (doc, state) => {
        const { frames, removed } = Frames.deleteFrame(doc.frames, frameId);
        if (!removed) return null;
        const cleared = state.selectedFrameId === frameId; // drop a Selection on the dead Frame
        return {
          body: { ...doc, frames },
          ui: {
            ...(cleared ? { selectedFrameId: null, selectedPath: null } : {}),
            dropTarget: null,
          },
        };
      }),

    // Rename a Frame (its title is the top-left label that identifies it). Coalesced like text edits;
    // a no-op (unknown id or unchanged title) records nothing.
    renameFrame: (frameId, title) =>
      mutate(`rename:${frameId}`, (doc) => {
        const frame = doc.frames.find((f) => f.id === frameId);
        if (!frame || frame.title === title) return null;
        return {
          body: { ...doc, frames: doc.frames.map((f) => (f.id === frameId ? { ...f, title } : f)) },
        };
      }),

    // Bind/clear a Theme token override (re-themes the canvas + email export). A blank value is NOT an
    // override — it's a clear back to the base token; persisting '' would leave withOverrides resolving
    // '' (→ `--x: ;` on the canvas, `font-size=""`/`line-height="NaNpx"` in MJML), so delete the key.
    setThemeOverride: (name, value) =>
      mutate(`theme:${name}`, (doc) => {
        if (value.trim() === '') {
          if (!(name in doc.themeOverrides)) return null; // clearing an unset token: nothing to do
          const rest = { ...doc.themeOverrides };
          delete rest[name];
          return { body: { ...doc, themeOverrides: rest } };
        }
        return { body: { ...doc, themeOverrides: { ...doc.themeOverrides, [name]: value } } };
      }),

    moveFrame: (frameId, x, y) =>
      mutate(null, (doc) => {
        const frames = Frames.moveFrame(doc.frames, frameId, x, y);
        return frames === doc.frames ? null : { body: { ...doc, frames } }; // same position → no entry
      }),

    // Set a Frame's Preview width (ADR-0013) — undoable + persisted like a move; a same-width set is a no-op.
    setFrameWidth: (frameId, width) =>
      mutate(null, (doc) => {
        const frames = Frames.resizeFrame(doc.frames, frameId, width);
        return frames === doc.frames ? null : { body: { ...doc, frames } }; // same width → no entry
      }),

    // ── Whole-document + history ops (use the reducer directly: they replace/restore the body) ──
    loadDocument: (doc) =>
      set((state) => ({
        frames: doc.frames,
        themeOverrides: doc.themeOverrides,
        history: record(state.history, bodyOf(state), null),
        selectedFrameId: null,
        selectedPath: null,
        dropTarget: null,
        docKey: state.docKey + 1,
      })),

    resetDocument: () =>
      set((state) => ({
        frames: createInitialFrames(),
        themeOverrides: {},
        history: record(state.history, bodyOf(state), null),
        selectedFrameId: null,
        selectedPath: null,
        dropTarget: null,
        docKey: state.docKey + 1,
      })),

    undo: () =>
      set((state) => {
        const result = historyUndo(state.history, bodyOf(state));
        if (!result) return {};
        return {
          ...result.body,
          history: result.history,
          selectedFrameId: null,
          selectedPath: null,
          dropTarget: null,
        };
      }),

    redo: () =>
      set((state) => {
        const result = historyRedo(state.history, bodyOf(state));
        if (!result) return {};
        return {
          ...result.body,
          history: result.history,
          selectedFrameId: null,
          selectedPath: null,
          dropTarget: null,
        };
      }),
  };
});
