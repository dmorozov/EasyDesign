import { type Node as RFNode, type NodeProps } from '@xyflow/react';
import { type ReactElement } from 'react';

import { Icon } from '../design-system';

import { EditableNode } from './EditableNode';
import { TARGET_PROFILES } from './frames';
import { useEditor } from './store';

// Extends Record so it satisfies React Flow's `Node<T extends Record<string, unknown>>`
// constraint (an interface, unlike a type alias, has no implicit index signature).
export interface FrameData extends Record<string, unknown> {
  frameId: string;
}
type FrameRFNode = RFNode<FrameData, 'frame'>;

const TYPE_ICON = { web: Icon.web, email: Icon.mail } as const;

/** A React Flow node = one Frame. The chrome is deliberately minimal (ADR-0006): a thin dashed body,
 *  a title label top-left that doubles as the drag handle (`ed-frame-drag` → the node's React Flow
 *  `dragHandle`) and the Frame-select affordance, and a READ-ONLY medium label top-right. The medium
 *  is fixed at creation — it only needs to be shown (it drives the Component Palette), never toggled.
 *  The body carries `ed-board-content` so the user's design Theme tokens resolve there, not on :root. */
export function FrameNode({ data }: NodeProps<FrameRFNode>): ReactElement | null {
  const frame = useEditor((s) => s.frames.find((f) => f.id === data.frameId));
  const selectFrame = useEditor((s) => s.selectFrame);
  const selected = useEditor((s) => s.selectedFrameId === data.frameId);
  if (!frame) return null;

  const TypeIcon = TYPE_ICON[frame.target];
  return (
    <div className="ed-frame" data-selected={selected || undefined}>
      <div className="ed-frame-labels">
        {/* The title is BOTH the drag handle and the Frame-select affordance: a click selects (so the
            Palette reflects this Frame's medium), a drag moves the Frame. */}
        <button
          type="button"
          className="ed-frame-name ed-frame-drag"
          onClick={() => {
            selectFrame(frame.id);
          }}
          title="Drag to move · click to select"
        >
          {frame.title}
        </button>
        <span className="ed-frame-type">
          <TypeIcon size={12} />
          {TARGET_PROFILES[frame.target].label}
        </span>
      </div>
      <div
        className="nodrag ed-frame-body ed-board-content"
        role="tree"
        aria-label={`${frame.title} layers`}
      >
        <EditableNode frameId={frame.id} node={frame.root} path={[]} />
      </div>
    </div>
  );
}
