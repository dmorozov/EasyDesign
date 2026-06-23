import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  useReactFlow,
  type NodeTypes,
} from '@xyflow/react';
import { useEffect, type ReactElement } from 'react';

import { Button, Icon } from '../design-system';

import { FrameNode } from './FrameNode';
import { useEditor } from './store';
import { useFrameNodes } from './useFrameNodes';

import '@xyflow/react/dist/style.css';

const nodeTypes: NodeTypes = { frame: FrameNode };

// Approx height of a Frame node (varies with content) — close enough to pull a newly-added Frame into
// view; the width is exact (the Frame's Preview width, ADR-0013).
const NODE_H = 300;

/** Pans the viewport to a just-added Frame (store.pendingFocusFrameId), preserving the current zoom.
 *  Must live INSIDE <ReactFlow> to read the React Flow instance. */
function ViewportFocus(): null {
  const pending = useEditor((s) => s.pendingFocusFrameId);
  const clearPendingFocus = useEditor((s) => s.clearPendingFocus);
  const { setCenter, getZoom } = useReactFlow();

  useEffect(() => {
    if (!pending) return;
    const frame = useEditor.getState().frames.find((f) => f.id === pending);
    if (frame) {
      void setCenter(frame.x + frame.width / 2, frame.y + NODE_H / 2, {
        zoom: getZoom(),
        duration: 350,
      });
    }
    clearPendingFocus();
  }, [pending, setCenter, getZoom, clearPendingFocus]);

  return null;
}

/** The infinite workspace (ADR-0001): pan/zoom over Frames as React Flow nodes. The node list is kept
 *  reconciled with the store by `useFrameNodes` (add/remove/move/undo, no remount); a drag writes the
 *  committed position back via `moveFrame`. A top-left Panel mints new Frames (medium fixed at creation,
 *  ADR-0006), and `ViewportFocus` pans each new Frame into view. */
export function Board(): ReactElement {
  const clearSelection = useEditor((s) => s.clearSelection);
  const moveFrame = useEditor((s) => s.moveFrame);
  const addFrame = useEditor((s) => s.addFrame);
  const [nodes, onNodesChange] = useFrameNodes();

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
      // Cap the initial fit so a single small Frame doesn't fill the viewport (default maxZoom 2 felt
      // way too zoomed-in on load); 0.6 gives a comfortable zoomed-out overview. With many/spread Frames
      // fitView already computes a lower zoom, so the cap only bites the few-Frames case.
      fitViewOptions={{ maxZoom: 0.6 }}
    >
      <ViewportFocus />
      <Panel position="top-left" className="ed-add-frame">
        <span className="eds-label">New frame</span>
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon.web />}
          onClick={() => {
            addFrame('web');
          }}
        >
          Web page
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon.mail />}
          onClick={() => {
            addFrame('email');
          }}
        >
          Email
        </Button>
      </Panel>
      <Background color="var(--dot-color)" bgColor="var(--canvas-bg)" gap={22} />
      <Controls />
    </ReactFlow>
  );
}
