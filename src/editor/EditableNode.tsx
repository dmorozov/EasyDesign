import { useDraggable, useDroppable } from '@dnd-kit/core';
import { type CSSProperties, type MouseEvent, type ReactElement } from 'react';

import { Button } from '../components/Button';
import { Column, Grid, Row, Stack } from '../components/Layout';
import { Image, Text } from '../components/primitives';
import { type Node } from '../ir/types';

import { samePath, type NodePath } from './paths';
import { useEditor } from './store';

interface NodeViewProps {
  frameId: string;
  node: Node;
  path: NodePath;
}

const selectedOutline: CSSProperties = {
  outline: '2px solid var(--color-brand)',
  outlineOffset: 1,
};
const insideOutline: CSSProperties = { outline: '2px dashed var(--color-brand)', outlineOffset: 1 };

function useNodeSelection(frameId: string, path: NodePath) {
  const selected = useEditor(
    (s) => s.selectedFrameId === frameId && samePath(s.selectedPath, path),
  );
  const selectNode = useEditor((s) => s.selectNode);
  const onClick = (event: MouseEvent) => {
    event.stopPropagation();
    selectNode(frameId, path);
  };
  return { selected, onClick };
}

/** A node in the editor: a drop target with before/after/inside indicators, a
 *  selection click, and (non-root) a drag handle for reordering/moving. */
export function EditableNode({ frameId, node, path }: NodeViewProps): ReactElement {
  const { selected, onClick } = useNodeSelection(frameId, path);
  const { setNodeRef } = useDroppable({
    id: `drop:${frameId}:${path.join('.')}`,
    data: { frameId, path },
  });
  const mode = useEditor((s) =>
    s.dropTarget?.frameId === frameId && samePath(s.dropTarget.path, path)
      ? s.dropTarget.mode
      : null,
  );

  const style: CSSProperties = {
    position: 'relative',
    cursor: 'pointer',
    ...(selected ? selectedOutline : mode === 'inside' ? insideOutline : {}),
  };

  return (
    <div ref={setNodeRef} className="ed-node" onClick={onClick} style={style}>
      {path.length > 0 && <DragHandle frameId={frameId} path={path} />}
      {mode === 'before' && <div className="ed-drop-line ed-drop-before" />}
      <NodeInner frameId={frameId} node={node} path={path} />
      {mode === 'after' && <div className="ed-drop-line ed-drop-after" />}
    </div>
  );
}

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
      ⠿
    </button>
  );
}

// Pure render of a node's content; recurses through EditableNode for children.
function NodeInner({ frameId, node, path }: NodeViewProps): ReactElement {
  if ('children' in node) {
    const childEls = node.children.map((child, i) => (
      <EditableNode key={i} frameId={frameId} node={child} path={[...path, i]} />
    ));
    let body: ReactElement;
    if (childEls.length === 0) {
      body = <div className="ed-empty-hint">Drop into {node.type}…</div>;
    } else if (node.type === 'Row') {
      body = (
        <>
          {childEls.map((el, i) => (
            <div key={i} style={{ flex: 1 }}>
              {el}
            </div>
          ))}
        </>
      );
    } else {
      body = <>{childEls}</>;
    }
    switch (node.type) {
      case 'Stack':
        return <Stack style={node.style}>{body}</Stack>;
      case 'Column':
        return <Column style={node.style}>{body}</Column>;
      case 'Row':
        return <Row style={node.style}>{body}</Row>;
      case 'Grid':
        return (
          <Grid columns={node.props.columns} style={node.style}>
            {body}
          </Grid>
        );
      default:
        return body;
    }
  }
  switch (node.type) {
    case 'Text':
      return <Text variant={node.props.variant}>{node.props.content}</Text>;
    case 'Button':
      return <Button variant={node.props.variant}>{node.props.content}</Button>;
    case 'Image':
      return <Image src={node.props.src} alt={node.props.alt} width={node.props.width} />;
    default:
      return <span />;
  }
}
