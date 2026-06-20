import { type Node as RFNode, type NodeProps } from '@xyflow/react';
import { type ReactElement } from 'react';

import { Icon, SegmentedControl } from '../design-system';

import { EditableNode } from './EditableNode';
import { useEditor } from './store';

// Extends Record so it satisfies React Flow's `Node<T extends Record<string, unknown>>`
// constraint (an interface, unlike a type alias, has no implicit index signature).
export interface FrameData extends Record<string, unknown> {
  frameId: string;
}
type FrameRFNode = RFNode<FrameData, 'frame'>;

const MEDIUM = [
  { value: 'web', label: 'Web', icon: <Icon.web size={14} /> },
  { value: 'email', label: 'Email', icon: <Icon.mail size={14} /> },
];

/** A React Flow node = one Frame: a draggable header (title + Web/Email medium) + a live,
 *  editable IR tree. The body carries `ed-board-content` so the user's design Theme tokens
 *  resolve there (NOT on the global :root, which the chrome owns). */
export function FrameNode({ data }: NodeProps<FrameRFNode>): ReactElement | null {
  const frame = useEditor((s) => s.frames.find((f) => f.id === data.frameId));
  const setFrameTarget = useEditor((s) => s.setFrameTarget);
  if (!frame) return null;

  return (
    <div className="ed-frame-shell">
      <header className="ed-frame-header">
        <span className="ed-frame-title">{frame.title}</span>
        {/* `nodrag` keeps interacting with the medium toggle from dragging the Frame. */}
        <SegmentedControl
          className="ed-frame-medium nodrag"
          options={MEDIUM}
          value={frame.target}
          onChange={(v) => {
            setFrameTarget(frame.id, v === 'email' ? 'email' : 'web');
          }}
        />
      </header>
      <div className="nodrag ed-frame-body ed-board-content">
        <EditableNode frameId={frame.id} node={frame.root} path={[]} />
      </div>
    </div>
  );
}
