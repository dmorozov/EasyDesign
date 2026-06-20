import { type Node as RFNode, type NodeProps } from '@xyflow/react';
import { type ReactElement } from 'react';
import {
  Button as AriaButton,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from 'react-aria-components';

import { EditableNode } from './EditableNode';
import { useEditor } from './store';

// Extends Record so it satisfies React Flow's `Node<T extends Record<string, unknown>>`
// constraint (an interface, unlike a type alias, has no implicit index signature).
export interface FrameData extends Record<string, unknown> {
  frameId: string;
}
type FrameRFNode = RFNode<FrameData, 'frame'>;

/** A React Flow node = one Frame: a draggable header + a live, editable IR tree. */
export function FrameNode({ data }: NodeProps<FrameRFNode>): ReactElement | null {
  const frame = useEditor((s) => s.frames.find((f) => f.id === data.frameId));
  const setFrameTarget = useEditor((s) => s.setFrameTarget);
  if (!frame) return null;

  return (
    <div className="ed-frame-shell">
      <header className="ed-frame-header">
        <span>{frame.title}</span>
        {/* React Aria Select — fully styleable (incl. the open popover) + accessible.
            `nodrag` keeps interacting with it from dragging the Frame (ADR-0005). */}
        <Select
          aria-label="Frame target medium"
          selectedKey={frame.target}
          onSelectionChange={(key) => {
            setFrameTarget(frame.id, key === 'email' ? 'email' : 'web');
          }}
        >
          <AriaButton className="ed-select-trigger nodrag">
            <SelectValue />
            <span aria-hidden="true" className="ed-select-caret">
              ▾
            </span>
          </AriaButton>
          <Popover className="ed-select-popover nodrag">
            <ListBox className="ed-select-listbox">
              <ListBoxItem id="web" className="ed-select-item">
                web
              </ListBoxItem>
              <ListBoxItem id="email" className="ed-select-item">
                email
              </ListBoxItem>
            </ListBox>
          </Popover>
        </Select>
      </header>
      <div className="nodrag ed-frame-body">
        <EditableNode frameId={frame.id} node={frame.root} path={[]} />
      </div>
    </div>
  );
}
