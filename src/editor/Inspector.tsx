import { type ReactElement } from 'react';

import { nodeAt } from './paths';
import { useEditor } from './store';

/** Edits the selected node's props (content for Text/Button) and deletes nodes. */
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
      <section className="ed-panel">
        <h3>Inspector</h3>
        <p className="ed-hint">Select a node on the canvas.</p>
      </section>
    );
  }

  const editable = node.type === 'Text' || node.type === 'Button';
  return (
    <section className="ed-panel">
      <h3>Inspector</h3>
      <p className="ed-hint">{node.type}</p>
      {editable && (
        <label className="ed-field">
          <span>Content</span>
          <input
            value={node.props.content}
            onChange={(e) => {
              updateText(selectedFrameId, selectedPath, e.target.value);
            }}
          />
        </label>
      )}
      <button
        type="button"
        className="ed-danger"
        onClick={() => {
          deleteNode(selectedFrameId, selectedPath);
        }}
      >
        Delete node
      </button>
    </section>
  );
}
