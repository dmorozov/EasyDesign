import { type ReactElement } from 'react';

import { Badge, Button, Icon, Input, PanelSection } from '../design-system';

import { nodeAt } from './paths';
import { useEditor } from './store';

/** Edits the selected node's props (content for Text/Button) and deletes nodes.
 *  Rendered as the Inspector tab body in the right rail. */
export function Inspector(): ReactElement {
  const selectedFrameId = useEditor((s) => s.selectedFrameId);
  const selectedPath = useEditor((s) => s.selectedPath);
  const frames = useEditor((s) => s.frames);
  const updateText = useEditor((s) => s.updateText);
  const deleteNode = useEditor((s) => s.deleteNode);

  const frame = frames.find((f) => f.id === selectedFrameId);
  const node = frame && selectedPath ? nodeAt(frame.root, selectedPath) : undefined;

  if (!frame || !selectedFrameId || !selectedPath || !node) {
    return (
      <div className="ed-rail-empty">
        <div className="ed-rail-empty-icon">
          <Icon.sliders size={22} />
        </div>
        <p className="ed-rail-empty-title">Nothing selected</p>
        <p className="ed-rail-empty-text">
          Click any element on the board to edit its properties here.
        </p>
      </div>
    );
  }

  const editable = node.type === 'Text' || node.type === 'Button';
  return (
    <div className="ed-inspector">
      <div className="ed-inspector-head">
        <span className="ed-inspector-type">{node.type}</span>
        <Badge tone="accent">{frame.target === 'email' ? 'Email' : 'Web'}</Badge>
      </div>

      {editable && (
        <PanelSection title="Content">
          <Input
            label="Text"
            value={node.props.content}
            onChange={(e) => {
              updateText(selectedFrameId, selectedPath, e.target.value);
            }}
          />
        </PanelSection>
      )}

      <div className="ed-rail-actions">
        <Button
          variant="danger"
          size="sm"
          block
          icon={<Icon.trash />}
          onClick={() => {
            deleteNode(selectedFrameId, selectedPath);
          }}
        >
          Delete element
        </Button>
      </div>
    </div>
  );
}
