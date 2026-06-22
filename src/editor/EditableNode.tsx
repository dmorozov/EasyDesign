// The editor's node tree, built on the shared Node Walk (src/ir/walk) — the seam's
// hardest adapter. Per-NODE chrome (drop target + drag handle + selection + the
// node's OWN before/after drop lines) is applied via the path context; Row's flex:1
// comes from shape.wrapChildren; the empty-hint is just children.length === 0; β is
// delegated to the component layer (ADR-0005). design-system (chrome) imports are
// allowed here — but the walk + leaf-style never touch it (ADR-0007).
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { type CSSProperties, Fragment, type ReactElement, type ReactNode } from 'react';

import { Button } from '../components/Button';
import { layoutElement } from '../components/layoutElement';
import { Image, Text } from '../components/primitives';
import { Icon } from '../design-system';
import { type Node } from '../ir/types';
import { type Emitter, walkNode } from '../ir/walk';

import { type NodePath, samePath } from './paths';
import { useEditor } from './store';
import { useCanvasA11y } from './useCanvasA11y';

// Selection + drop indicators use CHROME tokens (NOT the user's --color-brand), so they stay
// visible and on-brand for the editor regardless of what the user themes their design to.
const selectedOutline: CSSProperties = { outline: '2px solid var(--selection)', outlineOffset: 1 };
const insideOutline: CSSProperties = { outline: '2px dashed var(--accent)', outlineOffset: 1 };
// A drop the email rule forbids (RP-5): the same placement, shown disallowed (danger, not accent).
const blockedOutline: CSSProperties = { outline: '2px dashed var(--danger)', outlineOffset: 1 };

function DragHandle({ frameId, path }: { frameId: string; path: NodePath }): ReactElement {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `move:${frameId}:${path.join('.')}`,
    data: { kind: 'move', frameId, path },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className="ed-node-handle"
      aria-label="Move node"
      onClick={(e) => {
        e.stopPropagation();
      }}
      style={isDragging ? { opacity: 1 } : undefined}
      {...listeners}
      {...attributes}
    >
      <Icon.dots size={12} />
    </button>
  );
}

// Per-node editor chrome — the "decorate each node" wrapper, keyed on its path. A
// child's own before/after drop lines live in the child's wrapper (keyed on the
// child path), so the parent never interleaves anything.
function EditableShell({
  frameId,
  path,
  node,
  children,
}: {
  frameId: string;
  path: NodePath;
  node: Node;
  children: ReactNode;
}): ReactElement {
  const selected = useEditor(
    (s) => s.selectedFrameId === frameId && samePath(s.selectedPath, path),
  );
  const selectNode = useEditor((s) => s.selectNode);
  const a11y = useCanvasA11y(frameId, path, node);
  const { setNodeRef } = useDroppable({
    id: `drop:${frameId}:${path.join('.')}`,
    data: { frameId, path },
  });
  const drop = useEditor((s) =>
    s.dropTarget?.frameId === frameId && samePath(s.dropTarget.path, path) ? s.dropTarget : null,
  );
  const mode = drop?.mode ?? null;
  const blocked = drop?.blocked ?? false;
  const style: CSSProperties = {
    position: 'relative',
    cursor: blocked ? 'not-allowed' : 'pointer',
    ...(selected
      ? selectedOutline
      : mode === 'inside'
        ? blocked
          ? blockedOutline
          : insideOutline
        : {}),
  };
  return (
    <div
      ref={setNodeRef}
      className="ed-node"
      style={style}
      role={a11y.role}
      tabIndex={a11y.tabIndex}
      aria-label={a11y['aria-label']}
      aria-level={a11y['aria-level']}
      aria-expanded={a11y['aria-expanded']}
      aria-selected={a11y['aria-selected']}
      data-ed-path={a11y['data-ed-path']}
      onKeyDown={a11y.onKeyDown}
      onClick={(e) => {
        e.stopPropagation();
        selectNode(frameId, path);
      }}
    >
      {path.length > 0 && <DragHandle frameId={frameId} path={path} />}
      {mode === 'before' && (
        <div className={`ed-drop-line ed-drop-before${blocked ? ' ed-drop-blocked' : ''}`} />
      )}
      {children}
      {mode === 'after' && (
        <div className={`ed-drop-line ed-drop-after${blocked ? ' ed-drop-blocked' : ''}`} />
      )}
    </div>
  );
}

function makeEditableEmitter(frameId: string): Emitter<ReactElement, NodePath> {
  return {
    container(node, shape, children, ctx) {
      const wrapFlex = shape.kind === 'flow' && shape.wrapChildren;
      const body: ReactNode =
        children.length === 0 ? (
          <div className="ed-empty-hint">Drop into {node.type}…</div>
        ) : wrapFlex ? (
          children.map((c, i) => (
            <div key={i} style={{ flex: 1 }}>
              {c}
            </div>
          ))
        ) : (
          children.map((c, i) => <Fragment key={i}>{c}</Fragment>)
        );
      return (
        <EditableShell frameId={frameId} path={ctx} node={node}>
          {layoutElement(node, body)}
        </EditableShell>
      );
    },
    leaf: {
      Text(node, ctx) {
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Text variant={node.props.variant} style={node.style}>
              {node.props.content}
            </Text>
          </EditableShell>
        );
      },
      Button(node, ctx) {
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Button variant={node.props.variant}>{node.props.content}</Button>
          </EditableShell>
        );
      },
      Image(node, ctx) {
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Image src={node.props.src} alt={node.props.alt} width={node.props.width} />
          </EditableShell>
        );
      },
    },
    descend(ctx, index) {
      return [...ctx, index];
    },
  };
}

/** A Frame's editable tree: a drop target with before/after/inside indicators, a
 *  selection click, and (non-root) a drag handle for reordering/moving each node. */
export function EditableNode({
  frameId,
  node,
  path,
}: {
  frameId: string;
  node: Node;
  path: NodePath;
}): ReactElement {
  return walkNode<ReactElement, NodePath>(node, path, makeEditableEmitter(frameId));
}
