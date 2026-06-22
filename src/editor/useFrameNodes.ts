import { useNodesState, type Node as RFNode, type OnNodesChange } from '@xyflow/react';
import { useEffect } from 'react';

import { framesSignature, reconcileNodes, toRFNode } from './frame-nodes';
import { type FrameData } from './FrameNode';
import { useEditor } from './store';

/** The Board↔React-Flow seam (D3). React Flow owns transient per-node state (an in-flight drag); the
 *  store owns the SET of Frames and their committed positions. We subscribe to a cheap `id:x:y`
 *  signature (`framesSignature`), so adding / removing / moving a Frame — and undo/redo of any of those
 *  — reconciles the node list in place (`reconcileNodes`) WITHOUT remounting the Board (viewport
 *  preserved). Both the projection and the reconcile decision are pure (frame-nodes.ts); this is the
 *  thin effect wrapper. */
export function useFrameNodes(): [RFNode<FrameData>[], OnNodesChange<RFNode<FrameData>>] {
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode<FrameData>>(
    useEditor.getState().frames.map(toRFNode),
  );

  const signature = useEditor((s) => framesSignature(s.frames));

  useEffect(() => {
    const { frames } = useEditor.getState();
    setNodes((prev) => reconcileNodes(prev, frames));
  }, [signature, setNodes]);

  return [nodes, onNodesChange];
}
