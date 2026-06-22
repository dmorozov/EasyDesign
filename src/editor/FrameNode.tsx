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

/** A React Flow node = one Frame: a single thin dashed box (ADR-0013), with its identity + controls on
 *  the top border (fieldset-legend style, no header-over-body window). The left group is a dedicated
 *  GRIP (`ed-frame-grip` → the node's React Flow `dragHandle`, board move) + the title (click = select,
 *  so the Palette reflects this Frame's medium); the right is a READ-ONLY medium label (fixed at
 *  creation). The box's width is the Frame's Preview width. The body carries `ed-board-content` so the
 *  user's design Theme tokens resolve there, not on :root (ADR-0007). */
export function FrameNode({ data }: NodeProps<FrameRFNode>): ReactElement | null {
  const frame = useEditor((s) => s.frames.find((f) => f.id === data.frameId));
  const selectFrame = useEditor((s) => s.selectFrame);
  const selected = useEditor((s) => s.selectedFrameId === data.frameId);
  if (!frame) return null;

  const TypeIcon = TYPE_ICON[frame.target];
  return (
    <div className="ed-frame" data-selected={selected || undefined} style={{ width: frame.width }}>
      <div className="ed-frame-labels">
        <span className="ed-frame-id">
          {/* The grip is the React Flow drag handle (board move) — drag-only, no select. */}
          <button
            type="button"
            className="ed-frame-grip"
            aria-label="Drag to move frame"
            title="Drag to move"
          >
            <Icon.grip size={12} />
          </button>
          {/* The title selects the Frame (so the Palette reflects its medium); it no longer drags. */}
          <button
            type="button"
            className="ed-frame-name"
            onClick={() => {
              selectFrame(frame.id);
            }}
            title="Click to select"
          >
            {frame.title}
          </button>
        </span>
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
