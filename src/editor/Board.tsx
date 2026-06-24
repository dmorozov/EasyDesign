import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  useReactFlow,
  useStore,
  type NodeTypes,
} from '@xyflow/react';
import { useEffect, useRef, type ReactElement } from 'react';

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

/** Initial board view: instead of a fit-all overview, frame the FIRST Frame at roughly its native
 *  width (its Preview width + a side margin) and point the viewport at its top — a "start designing
 *  here" view. The zoom is width-driven (so a desktop Frame fills the board width with margin), capped
 *  so a small Frame can't balloon on a very wide board. Runs ONCE, after the pane has been measured
 *  (store `width` flips from 0); later resizes/pans are left untouched. The Controls "Fit View" button
 *  still frames every Frame. Must live INSIDE <ReactFlow> to read the instance + pane dimensions. */
function InitialView(): null {
  const { setViewport } = useReactFlow();
  const paneWidth = useStore((s) => s.width);
  const done = useRef(false);

  useEffect(() => {
    if (done.current || paneWidth === 0) return;
    const frame = useEditor.getState().frames[0];
    if (!frame) return;
    done.current = true;

    const MARGIN_X = 32; // px of breathing room on each side of the Frame
    const TOP = 120; // px gap above the Frame (so the view starts at its top, not its middle)
    const zoom = Math.min(1.5, Math.max(0.2, (paneWidth - 2 * MARGIN_X) / frame.width));
    void setViewport({
      zoom,
      x: (paneWidth - frame.width * zoom) / 2 - frame.x * zoom, // centre the Frame horizontally
      y: TOP - frame.y * zoom, // anchor the Frame's top near the viewport top
    });
  }, [paneWidth, setViewport]);

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
    >
      <ViewportFocus />
      <InitialView />
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
      {/* The manual "Fit View" frames EVERY Frame (its own options, independent of the initial view) —
          capped at native size so a lone Frame doesn't over-zoom. */}
      <Controls fitViewOptions={{ maxZoom: 1, padding: 0.1 }} />
    </ReactFlow>
  );
}
