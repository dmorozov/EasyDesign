import { create } from 'zustand';

import { sampleCard } from '../ir/sample';
import {
  type Align,
  type Distribute,
  type Justify,
  type Node,
  type StyleMap,
  type Wrap,
} from '../ir/types';
import { type StyleKey } from '../theme/design-tokens';

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
import { isPrefix, nodeAt, type NodePath } from './paths';

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
      root: structuredClone(webRoot),
    },
    {
      id: 'email-1',
      title: 'Welcome email',
      target: 'email',
      x: 520,
      y: 40,
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

    // ── Document mutations (through the mutate funnel → always undoable + persisted) ──
    insertChild: (frameId, parentPath, node) =>
      mutate(null, (doc) => {
        const frame = doc.frames.find((f) => f.id === frameId);
        if (!frame) return null;
        const root = structuredClone(frame.root);
        const parent = nodeAt(root, parentPath);
        if (!parent || !('children' in parent)) return null;
        parent.children.push(node);
        return {
          body: { ...doc, frames: doc.frames.map((f) => (f.id === frameId ? { ...f, root } : f)) },
          ui: {
            selectedFrameId: frameId,
            rightTab: 'inspector',
            selectedPath: [...parentPath, parent.children.length - 1],
          },
        };
      }),

    insertAt: (frameId, parentPath, index, node) =>
      mutate(null, (doc) => {
        const frame = doc.frames.find((f) => f.id === frameId);
        if (!frame) return null;
        const root = structuredClone(frame.root);
        const parent = nodeAt(root, parentPath);
        if (!parent || !('children' in parent)) return null;
        const i = Math.max(0, Math.min(index, parent.children.length));
        parent.children.splice(i, 0, node);
        return {
          body: { ...doc, frames: doc.frames.map((f) => (f.id === frameId ? { ...f, root } : f)) },
          ui: { selectedFrameId: frameId, rightTab: 'inspector', selectedPath: [...parentPath, i] },
        };
      }),

    moveNode: (frameId, fromPath, parentPath, index) =>
      mutate(null, (doc) => {
        const fromIndex = fromPath.at(-1);
        if (fromIndex === undefined) return null; // can't move the root
        if (isPrefix(fromPath, parentPath)) return null; // can't move a node into its own subtree
        const frame = doc.frames.find((f) => f.id === frameId);
        if (!frame) return null;
        const root = structuredClone(frame.root);
        const fromParent = nodeAt(root, fromPath.slice(0, -1));
        const targetParent = nodeAt(root, parentPath);
        if (!fromParent || !('children' in fromParent)) return null;
        if (!targetParent || !('children' in targetParent)) return null;
        const moved = fromParent.children[fromIndex];
        if (!moved) return null;
        fromParent.children.splice(fromIndex, 1);
        let i = index;
        if (fromParent === targetParent && fromIndex < i) i -= 1;
        i = Math.max(0, Math.min(i, targetParent.children.length));
        targetParent.children.splice(i, 0, moved);
        return {
          body: { ...doc, frames: doc.frames.map((f) => (f.id === frameId ? { ...f, root } : f)) },
          ui: { selectedFrameId: frameId, rightTab: 'inspector', selectedPath: [...parentPath, i] },
        };
      }),

    updateText: (frameId, path, content) =>
      mutate(`text:${frameId}:${path.join('.')}`, (doc) => {
        const frame = doc.frames.find((f) => f.id === frameId);
        if (!frame) return null;
        const root = structuredClone(frame.root);
        const target = nodeAt(root, path);
        if (!target || (target.type !== 'Text' && target.type !== 'Button')) return null;
        target.props.content = content;
        return {
          body: { ...doc, frames: doc.frames.map((f) => (f.id === frameId ? { ...f, root } : f)) },
        };
      }),

    // Set a container's layout properties (justify/align/wrap). Coalesced per node so a flurry of
    // changes is one undo step; persisted like every document mutation.
    setLayout: (frameId, path, patch) =>
      mutate(`layout:${frameId}:${path.join('.')}`, (doc) => {
        const frame = doc.frames.find((f) => f.id === frameId);
        if (!frame) return null;
        const root = structuredClone(frame.root);
        const target = nodeAt(root, path);
        if (!target || !('children' in target)) return null; // only containers carry layout props
        const next: Record<string, unknown> = {
          ...(target.props as Record<string, unknown> | undefined),
        };
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined) delete next[k];
          else next[k] = v;
        }
        if (target.type === 'Grid') delete next.wrap; // Grid has no flex-wrap
        (target as { props?: unknown }).props = next;
        return {
          body: { ...doc, frames: doc.frames.map((f) => (f.id === frameId ? { ...f, root } : f)) },
        };
      }),

    // Bind/clear a container's token-bound style key (background/padding/borderRadius/gap → a Design
    // Token ref, or '' to clear). Coalesced per node + key.
    setNodeStyle: (frameId, path, key, ref) =>
      mutate(`style:${frameId}:${path.join('.')}:${key}`, (doc) => {
        const frame = doc.frames.find((f) => f.id === frameId);
        if (!frame) return null;
        const root = structuredClone(frame.root);
        const target = nodeAt(root, path);
        if (!target || !('children' in target)) return null; // only containers honour style keys
        const current = target.style?.[key];
        const nextRef = ref || undefined;
        if (current === nextRef) return null; // no change → no history entry
        const style: StyleMap = { ...target.style };
        if (nextRef) style[key] = nextRef;
        else delete style[key];
        target.style = style;
        return {
          body: { ...doc, frames: doc.frames.map((f) => (f.id === frameId ? { ...f, root } : f)) },
        };
      }),

    deleteNode: (frameId, path) =>
      mutate(null, (doc) => {
        const last = path.at(-1);
        if (last === undefined) return null; // can't delete the root
        const frame = doc.frames.find((f) => f.id === frameId);
        if (!frame) return null;
        const root = structuredClone(frame.root);
        const parent = nodeAt(root, path.slice(0, -1));
        if (!parent || !('children' in parent)) return null;
        parent.children.splice(last, 1);
        return {
          body: { ...doc, frames: doc.frames.map((f) => (f.id === frameId ? { ...f, root } : f)) },
          ui: { selectedFrameId: null, selectedPath: null },
        };
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

    setThemeOverride: (name, value) =>
      mutate(`theme:${name}`, (doc) => ({
        body: { ...doc, themeOverrides: { ...doc.themeOverrides, [name]: value } },
      })),

    moveFrame: (frameId, x, y) =>
      mutate(null, (doc) => {
        const frames = Frames.moveFrame(doc.frames, frameId, x, y);
        return frames === doc.frames ? null : { body: { ...doc, frames } }; // same position → no entry
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
