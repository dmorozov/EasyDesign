import {
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

import { type Node } from '../ir/types';
import { catalog } from '../theme/design-tokens';

import { Board } from './Board';
import { canInsertComponent } from './frames';
import { type PaletteItem } from './palette';
import { Palette } from './Palette';
import { isContainer, nodeAt, type NodePath } from './paths';
import { RightRail } from './RightRail';
import { useEditor, type DropMode, type DropTarget, type EditorFrame } from './store';
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

const deepestPointerWithin: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  if (hits.length <= 1) return hits;
  return [...hits].sort((a, b) => collisionDepth(b) - collisionDepth(a));
};

// Turn a drop target (node + before/after/inside) into a parent + insertion index.
function resolveDrop(
  target: DropTarget,
  overNode: Node | undefined,
): { parentPath: NodePath; index: number } | null {
  if (target.mode === 'inside') {
    const len = overNode && 'children' in overNode ? overNode.children.length : 0;
    return { parentPath: target.path, index: len };
  }
  const last = target.path.at(-1);
  if (last === undefined) return null; // root has no siblings
  return {
    parentPath: target.path.slice(0, -1),
    index: target.mode === 'before' ? last : last + 1,
  };
}

type ResolveOver = { rect: { top: number; height: number }; data: { current?: unknown } } | null;

// Compute the drop target (node + before/after/inside) from the live pointer position.
// Called from BOTH drag-move (for the indicator) and drag-end (so a drop works even if
// move events were sparse) — never read transient state set elsewhere.
function computeTarget(
  frames: EditorFrame[],
  over: ResolveOver,
  pointerStartY: number,
  deltaY: number,
): DropTarget | null {
  const data = over?.data.current as DropData | undefined;
  if (!over || !data) return null;
  const frame = frames.find((f) => f.id === data.frameId);
  const node = frame ? nodeAt(frame.root, data.path) : undefined;
  if (!node) return null;
  const container = isContainer(node);
  const empty = container && 'children' in node && node.children.length === 0;
  const y = pointerStartY + deltaY;
  const rel = over.rect.height > 0 ? (y - over.rect.top) / over.rect.height : 0.5;
  let mode: DropMode;
  if (empty) mode = 'inside';
  else if (container) mode = rel < 0.25 ? 'before' : rel > 0.75 ? 'after' : 'inside';
  else mode = rel < 0.5 ? 'before' : 'after';
  if (data.path.length === 0 && mode !== 'inside') mode = 'inside';
  return { frameId: data.frameId, path: data.path, mode };
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
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
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
    setDropTarget(computeTarget(frames, event.over, pointerY.current, event.delta.y));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveLabel(null);
    const target = computeTarget(frames, event.over, pointerY.current, event.delta.y);
    setDropTarget(null);
    const active = event.active.data.current as ActiveData | undefined;
    if (!active || !target) return;
    const frame = frames.find((f) => f.id === target.frameId);
    if (!frame) return;
    const resolved = resolveDrop(target, nodeAt(frame.root, target.path));
    if (!resolved) return;
    if (active.kind === 'insert') {
      if (!active.item) return;
      if (!canInsertComponent(frame, active.item)) return; // email restriction (ADR-0006)
      insertAt(target.frameId, resolved.parentPath, resolved.index, active.item.create());
    } else {
      moveNode(target.frameId, active.path, resolved.parentPath, resolved.index);
    }
  };

  const onDragCancel = () => {
    setActiveLabel(null);
    setDropTarget(null);
  };

  const overrideCss = buildOverrideCss(overrides);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={deepestPointerWithin}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      {overrideCss ? <style>{overrideCss}</style> : null}
      <div className="ed-shell">
        <Toolbar />
        <div className="ed-app">
          <Palette />
          <div className="ed-board">
            <Board key={docKey} />
          </div>
          <RightRail />
        </div>
      </div>
      <DragOverlay>
        {activeLabel ? <div className="ed-drag-overlay">{activeLabel}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}
