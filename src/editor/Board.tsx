import {
  Background,
  Controls,
  ReactFlow,
  useNodesState,
  type Node as RFNode,
  type NodeTypes,
} from '@xyflow/react';
import { useMemo, type ReactElement } from 'react';

import { FrameNode, type FrameData } from './FrameNode';
import { useEditor } from './store';

import '@xyflow/react/dist/style.css';

const nodeTypes: NodeTypes = { frame: FrameNode };

/** The infinite workspace (ADR-0001): pan/zoom over Frames as React Flow nodes.
 *  Positions are seeded from the store (so they persist) and written back on drag.
 *  Board is remounted (keyed on docKey) when a document loads, re-seeding positions. */
export function Board(): ReactElement {
  const clearSelection = useEditor((s) => s.clearSelection);
  const moveFrame = useEditor((s) => s.moveFrame);
  const seed = useMemo<RFNode<FrameData>[]>(
    () =>
      useEditor.getState().frames.map((f) => ({
        id: f.id,
        type: 'frame',
        position: { x: f.x, y: f.y },
        data: { frameId: f.id },
      })),
    [],
  );
  const [nodes, , onNodesChange] = useNodesState<RFNode<FrameData>>(seed);

  return (
    <ReactFlow
      nodes={nodes}
      onNodesChange={onNodesChange}
      onNodeDragStop={(_event, node) => {
        moveFrame(node.id, node.position.x, node.position.y);
      }}
      nodeTypes={nodeTypes}
      onPaneClick={clearSelection}
      minZoom={0.2}
      fitView
    >
      <Background color="var(--dot-color)" bgColor="var(--canvas-bg)" gap={22} />
      <Controls />
    </ReactFlow>
  );
}
