import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type Collision,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import { catalog } from '../theme/design-tokens';

import { Board } from './Board';
import {
  resolveDropIntent,
  type DragSource,
  type DropGeometry,
  type DropIntent,
  type DropZone,
} from './drop-intent';
import { type PaletteItem } from './palette';
import { Palette } from './Palette';
import { nodeAt, type NodePath } from './paths';
import { RightRail } from './RightRail';
import { useEditor, type EditorFrame } from './store';
import { Toolbar } from './Toolbar';
import { usePersistence } from './usePersistence';

type ActiveData =
  | { kind: 'insert'; item?: PaletteItem }
  | { kind: 'move'; frameId: string; path: NodePath };

interface DropData {
  frameId: string;
  path: NodePath;
}

// Live theme overrides become a stylesheet rendered after the base theme. It targets
// .ed-board-content (the board-content scope) — NOT :root — so user theming stays off the
// global chrome tokens (the golden rule). Matches theme.scoped.css's selector.
function buildOverrideCss(overrides: Record<string, string>): string {
  // Keys are dot refs (post keying-collapse); the catalog gives the SD-correct CSS var name.
  const decls = Object.entries(overrides)
    .map(([ref, value]) => {
      const token = catalog.get(ref);
      return token ? `  ${token.cssVarName}: ${value};` : '';
    })
    .filter(Boolean);
  if (decls.length === 0) return '';
  return `.ed-board-content {\n${decls.join('\n')}\n}`;
}

// When the pointer is over several nested nodes, target the deepest (longest path).
function collisionDepth(collision: Collision): number {
  const container = (
    collision.data as { droppableContainer?: { data?: { current?: unknown } } } | undefined
  )?.droppableContainer;
  const path = (container?.data?.current as { path?: unknown } | undefined)?.path;
  return Array.isArray(path) ? path.length : 0;
}

// Collision detection. `pointerWithin` is precise but returns NOTHING in the blank areas around a
// Frame's content — below the last child, in a Frame's padding-less gaps, or just off the content on
// release — so `over` goes null, no indicator shows, and a drop dispatches nothing. That is the "it
// doesn't show I can drop / works but only after several tries" bug. So: when the pointer is genuinely
// within nodes, keep those hits and prefer the DEEPEST (longest path); otherwise fall back to the single
// CLOSEST droppable, so a drag anywhere over the board always resolves to a target.
const deepestCollision: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  if (within.length > 1) {
    return [...within].sort((a, b) => collisionDepth(b) - collisionDepth(a));
  }
  if (within.length === 1) return within;
  const [closest] = closestCenter(args);
  return closest ? [closest] : [];
};

type ResolveOver = { rect: { top: number; height: number }; data: { current?: unknown } } | null;
type ResolveActive = { data: { current?: unknown } } | null;

// ── dnd-kit → pure adapters ──────────────────────────────────────────────────────────────────
// The framework boundary: drop-intent.ts stays free of dnd-kit shapes, so these tiny readers are
// the ONLY code that knows the event layout. `readZone` does the Frame lookup + `nodeAt` (the hovered
// node + its parent type), so the module receives resolved values and never touches `frames`.
function readSource(frames: EditorFrame[], active: ResolveActive): DragSource | null {
  const data = active?.data.current as ActiveData | undefined;
  if (!data) return null;
  if (data.kind === 'insert') {
    return data.item ? { kind: 'insert', item: data.item, childType: data.item.nodeType } : null;
  }
  // Move: the dragged node's type (for the allowed-children rule) comes from its source location.
  const srcFrame = frames.find((f) => f.id === data.frameId);
  const moved = srcFrame ? nodeAt(srcFrame.root, data.path) : undefined;
  return moved ? { kind: 'move', fromPath: data.path, childType: moved.type } : null;
}

function readZone(frames: EditorFrame[], over: ResolveOver): DropZone | null {
  const data = over?.data.current as DropData | undefined;
  if (!data) return null;
  const frame = frames.find((f) => f.id === data.frameId);
  const node = frame ? nodeAt(frame.root, data.path) : undefined;
  if (!frame || !node) return null;
  // The hovered node's PARENT type (undefined at the root) — for a before/after drop, the parent is
  // what must accept the dragged type, not the hovered node itself (RP-10).
  const parentType =
    data.path.length > 0 ? nodeAt(frame.root, data.path.slice(0, -1))?.type : undefined;
  return {
    frameId: data.frameId,
    path: data.path,
    node,
    medium: frame.target,
    ...(parentType !== undefined ? { parentType } : {}),
  };
}

// Resolve a live drag (over + active + pointer geometry) into an intent — used by BOTH drag-move
// (for the indicator) and drag-end (so a drop works even if move events were sparse). Never reads
// transient state set elsewhere; the email rule + placement maths all live in drop-intent.ts.
function resolveIntent(
  frames: EditorFrame[],
  over: ResolveOver,
  active: ResolveActive,
  pointerStartY: number,
  deltaY: number,
): DropIntent | null {
  const source = readSource(frames, active);
  if (!source) return null;
  const geom: DropGeometry = {
    pointerY: pointerStartY + deltaY,
    rectTop: over?.rect.top ?? 0,
    rectHeight: over?.rect.height ?? 0,
  };
  return resolveDropIntent(readZone(frames, over), source, geom);
}

export function Editor(): ReactElement {
  const frames = useEditor((s) => s.frames);
  const overrides = useEditor((s) => s.themeOverrides);
  const insertAt = useEditor((s) => s.insertAt);
  const moveNode = useEditor((s) => s.moveNode);
  const setDropTarget = useEditor((s) => s.setDropTarget);
  const docKey = useEditor((s) => s.docKey);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  // Foldable panels (give the Board more room). The right inspector's fold lives in the store because
  // selecting a node unfolds it; the left palette's fold is pure local chrome.
  const rightCollapsed = useEditor((s) => s.rightCollapsed);
  const setRightCollapsed = useEditor((s) => s.setRightCollapsed);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const pointerY = useRef(0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  usePersistence(); // debounced localStorage auto-save (lifted out of the Toolbar)

  // Undo/redo keyboard shortcuts — but let inputs keep their native undo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable))
        return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [undo, redo]);

  const onDragStart = (event: DragStartEvent) => {
    if (event.activatorEvent instanceof PointerEvent)
      pointerY.current = event.activatorEvent.clientY;
    const data = event.active.data.current as ActiveData | undefined;
    setActiveLabel(data?.kind === 'insert' ? (data.item?.label ?? null) : 'Move');
  };

  const onDragMove = (event: DragMoveEvent) => {
    const intent = resolveIntent(frames, event.over, event.active, pointerY.current, event.delta.y);
    setDropTarget(intent?.target ?? null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveLabel(null);
    const intent = resolveIntent(frames, event.over, event.active, pointerY.current, event.delta.y);
    setDropTarget(null);
    if (intent?.kind === 'insert') {
      insertAt(intent.target.frameId, intent.parentPath, intent.index, intent.item.create());
    } else if (intent?.kind === 'move') {
      moveNode(intent.target.frameId, intent.fromPath, intent.parentPath, intent.index);
    }
    // null / 'rejected' → dispatch nothing (a rejected drop already showed as blocked).
  };

  const onDragCancel = () => {
    setActiveLabel(null);
    setDropTarget(null);
  };

  const overrideCss = buildOverrideCss(overrides);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={deepestCollision}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      {overrideCss ? <style>{overrideCss}</style> : null}
      <div className="ed-shell">
        <Toolbar />
        <div
          className="ed-app"
          data-left-collapsed={leftCollapsed}
          data-right-collapsed={rightCollapsed}
        >
          <Palette collapsed={leftCollapsed} onToggle={setLeftCollapsed} />
          <div className="ed-board">
            <Board key={docKey} />
          </div>
          <RightRail collapsed={rightCollapsed} onToggle={setRightCollapsed} />
        </div>
      </div>
      <DragOverlay>
        {activeLabel ? <div className="ed-drag-overlay">{activeLabel}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}
