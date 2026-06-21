import { type ReactElement } from 'react';

import { Badge, Button, Icon, Input, PanelSection, SegmentedControl } from '../design-system';
import { type Align, type Distribute, type Justify, type Wrap } from '../ir/types';

import { TARGET_PROFILES } from './frames';
import { nodeAt } from './paths';
import { useEditor } from './store';

const DISTRIBUTE_OPTS = [
  { value: 'fit', label: 'Fit' },
  { value: 'fill', label: 'Fill' },
];
const JUSTIFY_OPTS = [
  { value: 'start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'End' },
  { value: 'space-between', label: 'Between' },
  { value: 'space-around', label: 'Around' },
];
const ALIGN_OPTS = [
  { value: 'start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'End' },
  { value: 'stretch', label: 'Stretch' },
];
const WRAP_OPTS = [
  { value: 'nowrap', label: 'No wrap' },
  { value: 'wrap', label: 'Wrap' },
];

/** Edits the selected node: text content, container layout (distribute/justify/align/wrap),
 *  and delete. Rendered as the Inspector tab body in the right rail. */
export function Inspector(): ReactElement {
  const selectedFrameId = useEditor((s) => s.selectedFrameId);
  const selectedPath = useEditor((s) => s.selectedPath);
  const frames = useEditor((s) => s.frames);
  const updateText = useEditor((s) => s.updateText);
  const setLayout = useEditor((s) => s.setLayout);
  const deleteNode = useEditor((s) => s.deleteNode);
  const renameFrame = useEditor((s) => s.renameFrame);
  const removeFrame = useEditor((s) => s.removeFrame);

  const frame = frames.find((f) => f.id === selectedFrameId);
  const node = frame && selectedPath ? nodeAt(frame.root, selectedPath) : undefined;

  // Frame-level selection (the title label was clicked, or a Frame was just added): the Frame panel.
  // Its medium is READ-ONLY (fixed at creation); this is the only place a Frame is deleted.
  if (frame && selectedFrameId && !selectedPath) {
    return (
      <div className="ed-inspector">
        <div className="ed-inspector-head">
          <span className="ed-inspector-type">Frame</span>
          <Badge tone="accent">{TARGET_PROFILES[frame.target].label}</Badge>
        </div>
        <PanelSection title="Frame">
          <Input
            label="Title"
            value={frame.title}
            onChange={(e) => {
              renameFrame(frame.id, e.target.value);
            }}
          />
          <div className="ed-field">
            <span className="eds-label">Medium</span>
            <span className="ed-inspector-note">{TARGET_PROFILES[frame.target].label} · fixed</span>
          </div>
        </PanelSection>
        <div className="ed-rail-actions">
          <Button
            variant="danger"
            size="sm"
            block
            icon={<Icon.trash />}
            onClick={() => {
              removeFrame(frame.id);
            }}
          >
            Delete frame
          </Button>
        </div>
      </div>
    );
  }

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
  const container =
    node.type === 'Stack' || node.type === 'Row' || node.type === 'Column' || node.type === 'Grid'
      ? node
      : null;

  // A Row in 'fill' mode gives every child flex:1 (equal columns), so justify and
  // wrap have no free space to act on — hide them to avoid a control that does nothing.
  const rowDistribute = container?.type === 'Row' ? (container.props?.distribute ?? 'fit') : null;
  const isFillRow = rowDistribute === 'fill';

  return (
    <div className="ed-inspector">
      <div className="ed-inspector-head">
        <span className="ed-inspector-type">{node.type}</span>
        <Badge tone="accent">{TARGET_PROFILES[frame.target].label}</Badge>
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

      {container && (
        <PanelSection title="Layout">
          {container.type === 'Row' && (
            <div className="ed-field">
              <span className="eds-label">Distribute</span>
              <SegmentedControl
                options={DISTRIBUTE_OPTS}
                value={rowDistribute ?? 'fit'}
                onChange={(v) => {
                  setLayout(selectedFrameId, selectedPath, { distribute: v as Distribute });
                }}
              />
            </div>
          )}
          {!isFillRow && (
            <div className="ed-field">
              <span className="eds-label">Justify</span>
              <SegmentedControl
                options={JUSTIFY_OPTS}
                value={container.props?.justify ?? 'start'}
                onChange={(v) => {
                  setLayout(selectedFrameId, selectedPath, { justify: v as Justify });
                }}
              />
            </div>
          )}
          <div className="ed-field">
            <span className="eds-label">Align</span>
            <SegmentedControl
              options={ALIGN_OPTS}
              value={container.props?.align ?? 'stretch'}
              onChange={(v) => {
                setLayout(selectedFrameId, selectedPath, { align: v as Align });
              }}
            />
          </div>
          {container.type !== 'Grid' && !isFillRow && (
            <div className="ed-field">
              <span className="eds-label">Wrap</span>
              <SegmentedControl
                options={WRAP_OPTS}
                value={container.props?.wrap ?? 'nowrap'}
                onChange={(v) => {
                  setLayout(selectedFrameId, selectedPath, { wrap: v as Wrap });
                }}
              />
            </div>
          )}
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
