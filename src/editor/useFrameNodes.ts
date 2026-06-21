import { useNodesState, type Node as RFNode, type OnNodesChange } from '@xyflow/react';
import { useEffect } from 'react';

import { type FrameData } from './FrameNode';
import { useEditor, type EditorFrame } from './store';

/** Only the title label drags the Frame (its class is the React Flow `dragHandle` selector). */
const DRAG_HANDLE = '.ed-frame-drag';

function toRFNode(f: EditorFrame): RFNode<FrameData> {
  return {
    id: f.id,
    type: 'frame',
    position: { x: f.x, y: f.y },
    data: { frameId: f.id },
    dragHandle: DRAG_HANDLE,
    selectable: false, // we own Selection via the store (selectedFrameId), not React Flow's
  };
}

/** The Board↔React-Flow seam (D3). React Flow owns transient per-node state (an in-flight drag); the
 *  store owns the SET of Frames and their committed positions. We subscribe to a cheap `id:x:y`
 *  signature, so adding / removing / moving a Frame — and undo/redo of any of those — reconciles the
 *  node list in place WITHOUT remounting the Board (the viewport is preserved). */
export function useFrameNodes(): [RFNode<FrameData>[], OnNodesChange<RFNode<FrameData>>] {
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode<FrameData>>(
    useEditor.getState().frames.map(toRFNode),
  );

  // Changes exactly when a Frame is added, removed, or moved (committed) — not during an in-flight drag.
  const signature = useEditor((s) => s.frames.map((f) => `${f.id}:${f.x}:${f.y}`).join('|'));

  useEffect(() => {
    const { frames } = useEditor.getState();
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
      return frames.map((f) => {
        const existing = byId.get(f.id);
        if (!existing) return toRFNode(f); // freshly added Frame
        // Adopt the store position only when it actually changed (e.g. undo of a move) so we never
        // fight an in-flight drag; otherwise keep the existing node (preserves React Flow's state).
        if (existing.position.x === f.x && existing.position.y === f.y) return existing;
        return { ...existing, position: { x: f.x, y: f.y } };
      });
    });
  }, [signature, setNodes]);

  return [nodes, onNodesChange];
}
