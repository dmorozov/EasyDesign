import { create } from 'zustand';

import { sampleCard } from '../ir/sample';
import { type Frame, type Node } from '../ir/types';

import { loadFromLocal, type EditorDocument, type EditorFrame } from './document';
import { isPrefix, nodeAt, type NodePath } from './paths';

export type { EditorFrame };

export type ExportTarget = 'html' | 'react' | 'angular' | 'mjml';

export type DropMode = 'before' | 'after' | 'inside';
export interface DropTarget {
  frameId: string;
  path: NodePath;
  mode: DropMode;
}

// One undoable point: the document fields only (not transient UI like selection).
interface Snapshot {
  frames: EditorFrame[];
  themeOverrides: Record<string, string>;
}

interface EditorState {
  frames: EditorFrame[];
  selectedFrameId: string | null;
  selectedPath: NodePath | null;
  themeOverrides: Record<string, string>;
  exportTarget: ExportTarget;
  dropTarget: DropTarget | null;
  docKey: number;
  past: Snapshot[];
  future: Snapshot[];
  lastCommitKey: string | null;
  selectNode: (frameId: string, path: NodePath) => void;
  clearSelection: () => void;
  insertChild: (frameId: string, parentPath: NodePath, node: Node) => void;
  insertAt: (frameId: string, parentPath: NodePath, index: number, node: Node) => void;
  moveNode: (frameId: string, fromPath: NodePath, parentPath: NodePath, index: number) => void;
  setDropTarget: (target: DropTarget | null) => void;
  updateText: (frameId: string, path: NodePath, content: string) => void;
  deleteNode: (frameId: string, path: NodePath) => void;
  setFrameTarget: (frameId: string, target: Frame['target']) => void;
  setThemeOverride: (name: string, value: string) => void;
  setExportTarget: (target: ExportTarget) => void;
  moveFrame: (frameId: string, x: number, y: number) => void;
  loadDocument: (doc: EditorDocument) => void;
  resetDocument: () => void;
  undo: () => void;
  redo: () => void;
}

const HISTORY_LIMIT = 100;

// Record the pre-change snapshot for undo and clear the redo stack. Consecutive
// edits sharing a coalesceKey (e.g. typing in one field, dragging one swatch)
// collapse into a single undo step. Pass null for discrete, always-pushed edits.
function commit(
  state: EditorState,
  coalesceKey: string | null,
  changes: Partial<EditorState>,
): Partial<EditorState> {
  const coalesce = coalesceKey !== null && coalesceKey === state.lastCommitKey;
  const snapshot: Snapshot = { frames: state.frames, themeOverrides: state.themeOverrides };
  const past = coalesce ? state.past : [...state.past, snapshot].slice(-HISTORY_LIMIT);
  return { ...changes, past, future: [], lastCommitKey: coalesceKey };
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

export const useEditor = create<EditorState>()((set) => ({
  frames: saved?.frames ?? createInitialFrames(),
  selectedFrameId: null,
  selectedPath: null,
  themeOverrides: saved?.themeOverrides ?? {},
  exportTarget: 'react',
  dropTarget: null,
  docKey: 0,
  past: [],
  future: [],
  lastCommitKey: null,

  selectNode: (frameId, path) => set({ selectedFrameId: frameId, selectedPath: path }),
  clearSelection: () => set({ selectedFrameId: null, selectedPath: null }),

  insertChild: (frameId, parentPath, node) =>
    set((state) => {
      const frame = state.frames.find((f) => f.id === frameId);
      if (!frame) return {};
      const root = structuredClone(frame.root);
      const parent = nodeAt(root, parentPath);
      if (!parent || !('children' in parent)) return {};
      parent.children.push(node);
      return commit(state, null, {
        frames: state.frames.map((f) => (f.id === frameId ? { ...f, root } : f)),
        selectedFrameId: frameId,
        selectedPath: [...parentPath, parent.children.length - 1],
      });
    }),

  insertAt: (frameId, parentPath, index, node) =>
    set((state) => {
      const frame = state.frames.find((f) => f.id === frameId);
      if (!frame) return {};
      const root = structuredClone(frame.root);
      const parent = nodeAt(root, parentPath);
      if (!parent || !('children' in parent)) return {};
      const i = Math.max(0, Math.min(index, parent.children.length));
      parent.children.splice(i, 0, node);
      return commit(state, null, {
        frames: state.frames.map((f) => (f.id === frameId ? { ...f, root } : f)),
        selectedFrameId: frameId,
        selectedPath: [...parentPath, i],
      });
    }),

  moveNode: (frameId, fromPath, parentPath, index) =>
    set((state) => {
      const fromIndex = fromPath.at(-1);
      if (fromIndex === undefined) return {}; // can't move the root
      if (isPrefix(fromPath, parentPath)) return {}; // can't move a node into its own subtree
      const frame = state.frames.find((f) => f.id === frameId);
      if (!frame) return {};
      const root = structuredClone(frame.root);
      const fromParent = nodeAt(root, fromPath.slice(0, -1));
      const targetParent = nodeAt(root, parentPath);
      if (!fromParent || !('children' in fromParent)) return {};
      if (!targetParent || !('children' in targetParent)) return {};
      const moved = fromParent.children[fromIndex];
      if (!moved) return {};
      fromParent.children.splice(fromIndex, 1);
      let i = index;
      if (fromParent === targetParent && fromIndex < i) i -= 1;
      i = Math.max(0, Math.min(i, targetParent.children.length));
      targetParent.children.splice(i, 0, moved);
      return commit(state, null, {
        frames: state.frames.map((f) => (f.id === frameId ? { ...f, root } : f)),
        selectedFrameId: frameId,
        selectedPath: [...parentPath, i],
      });
    }),

  setDropTarget: (target) => set({ dropTarget: target }),

  updateText: (frameId, path, content) =>
    set((state) => {
      const frame = state.frames.find((f) => f.id === frameId);
      if (!frame) return {};
      const root = structuredClone(frame.root);
      const target = nodeAt(root, path);
      if (!target || (target.type !== 'Text' && target.type !== 'Button')) return {};
      target.props.content = content;
      return commit(state, `text:${frameId}:${path.join('.')}`, {
        frames: state.frames.map((f) => (f.id === frameId ? { ...f, root } : f)),
      });
    }),

  deleteNode: (frameId, path) =>
    set((state) => {
      const last = path.at(-1);
      if (last === undefined) return {}; // can't delete the root
      const frame = state.frames.find((f) => f.id === frameId);
      if (!frame) return {};
      const root = structuredClone(frame.root);
      const parent = nodeAt(root, path.slice(0, -1));
      if (!parent || !('children' in parent)) return {};
      parent.children.splice(last, 1);
      return commit(state, null, {
        frames: state.frames.map((f) => (f.id === frameId ? { ...f, root } : f)),
        selectedFrameId: null,
        selectedPath: null,
      });
    }),

  setFrameTarget: (frameId, target) =>
    set((state) =>
      commit(state, null, {
        frames: state.frames.map((f) => (f.id === frameId ? { ...f, target } : f)),
      }),
    ),

  setThemeOverride: (name, value) =>
    set((state) =>
      commit(state, `theme:${name}`, {
        themeOverrides: { ...state.themeOverrides, [name]: value },
      }),
    ),

  setExportTarget: (target) => set({ exportTarget: target }),

  moveFrame: (frameId, x, y) =>
    set((state) =>
      commit(state, null, {
        frames: state.frames.map((f) => (f.id === frameId ? { ...f, x, y } : f)),
      }),
    ),

  loadDocument: (doc) =>
    set((state) =>
      commit(state, null, {
        frames: doc.frames,
        themeOverrides: doc.themeOverrides,
        selectedFrameId: null,
        selectedPath: null,
        dropTarget: null,
        docKey: state.docKey + 1,
      }),
    ),

  resetDocument: () =>
    set((state) =>
      commit(state, null, {
        frames: createInitialFrames(),
        themeOverrides: {},
        selectedFrameId: null,
        selectedPath: null,
        dropTarget: null,
        docKey: state.docKey + 1,
      }),
    ),

  undo: () =>
    set((state) => {
      const prev = state.past.at(-1);
      if (!prev) return {};
      return {
        frames: prev.frames,
        themeOverrides: prev.themeOverrides,
        past: state.past.slice(0, -1),
        future: [{ frames: state.frames, themeOverrides: state.themeOverrides }, ...state.future],
        selectedFrameId: null,
        selectedPath: null,
        dropTarget: null,
        lastCommitKey: null,
        docKey: state.docKey + 1,
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next) return {};
      return {
        frames: next.frames,
        themeOverrides: next.themeOverrides,
        past: [...state.past, { frames: state.frames, themeOverrides: state.themeOverrides }],
        future: state.future.slice(1),
        selectedFrameId: null,
        selectedPath: null,
        dropTarget: null,
        lastCommitKey: null,
        docKey: state.docKey + 1,
      };
    }),
}));
