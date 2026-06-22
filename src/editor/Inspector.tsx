import { type ReactElement } from 'react';

import {
  Badge,
  Button,
  Icon,
  Input,
  PanelSection,
  SegmentedControl,
  Select,
} from '../design-system';
import { type Align, type Distribute, type Justify, type Wrap } from '../ir/types';
import { type TextStyle } from '../theme/generated/typography';

import { resolveEditModel, type TokenField } from './edit-model';
import { TARGET_PROFILES } from './frames';
import {
  ALIGN_OPTS,
  DISTRIBUTE_OPTS,
  HEADING_OPTS,
  JUSTIFY_OPTS,
  STYLE_LABEL,
  WRAP_OPTS,
} from './inspector-options';
import { nodeAt, type NodePath } from './paths';
import { useEditor } from './store';

/** One token-bound Select (a container style key or a free-form Text size/weight) — value + options are
 *  resolved by the edit-model; binding/clearing routes through `setNodeStyle` (RP-1/RP-4 gate). */
function TokenSelect({
  frameId,
  path,
  field,
}: {
  frameId: string;
  path: NodePath;
  field: TokenField;
}): ReactElement {
  const setNodeStyle = useEditor((s) => s.setNodeStyle);
  return (
    <Select
      label={STYLE_LABEL[field.key]}
      value={field.value}
      options={[...field.options]}
      onChange={(e) => {
        setNodeStyle(frameId, path, field.key, e.target.value);
      }}
    />
  );
}

/** Edits the selected node, driven entirely by `resolveEditModel` (RP-6): a present model field is a
 *  rendered section — Content, Typography (named style + free-form size/weight), Layout, and the
 *  token-bound Style keys — plus delete. A Frame-level Selection shows the Frame panel (rename /
 *  read-only medium / Preview width / delete). All the "what can I edit" logic lives in the resolver;
 *  this is a thin presenter. Rendered as the Inspector tab body. */
export function Inspector(): ReactElement {
  const selectedFrameId = useEditor((s) => s.selectedFrameId);
  const selectedPath = useEditor((s) => s.selectedPath);
  const frames = useEditor((s) => s.frames);
  const updateText = useEditor((s) => s.updateText);
  const setVariant = useEditor((s) => s.setVariant);
  const setLayout = useEditor((s) => s.setLayout);
  const deleteNode = useEditor((s) => s.deleteNode);
  const renameFrame = useEditor((s) => s.renameFrame);
  const removeFrame = useEditor((s) => s.removeFrame);
  const setFrameWidth = useEditor((s) => s.setFrameWidth);

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
          {(() => {
            // Preview width presets (ADR-0013) — a canvas affordance; the medium gates which are offered.
            // A medium with a single preset (email) shows it as a read-only note, like the Medium row.
            const widths = TARGET_PROFILES[frame.target].widths;
            const single = widths.length === 1 ? widths[0] : undefined;
            return (
              <div className="ed-field">
                <span className="eds-label">Size</span>
                {single ? (
                  <span className="ed-inspector-note">
                    {single.label} · {single.value}px · fixed
                  </span>
                ) : (
                  <SegmentedControl
                    options={widths.map((w) => ({ value: String(w.value), label: w.label }))}
                    value={String(frame.width)}
                    onChange={(v) => {
                      setFrameWidth(frame.id, Number(v));
                    }}
                  />
                )}
              </div>
            );
          })()}
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

  const model = resolveEditModel(frame.target, node, selectedPath);

  return (
    <div className="ed-inspector">
      <div className="ed-inspector-head">
        <span className="ed-inspector-type">{model.type}</span>
        <Badge tone="accent">{TARGET_PROFILES[frame.target].label}</Badge>
      </div>

      {model.content !== undefined && (
        <PanelSection title="Content">
          <Input
            label="Text"
            value={model.content}
            onChange={(e) => {
              updateText(selectedFrameId, selectedPath, e.target.value);
            }}
          />
        </PanelSection>
      )}

      {model.typography && (
        <PanelSection title="Typography">
          {model.typography.heading !== undefined && (
            <Select
              label="Style"
              value={model.typography.heading}
              options={HEADING_OPTS}
              onChange={(e) => {
                setVariant(selectedFrameId, selectedPath, e.target.value as TextStyle);
              }}
            />
          )}
          {model.typography.size && (
            <TokenSelect
              frameId={selectedFrameId}
              path={selectedPath}
              field={model.typography.size}
            />
          )}
          {model.typography.weight && (
            <TokenSelect
              frameId={selectedFrameId}
              path={selectedPath}
              field={model.typography.weight}
            />
          )}
        </PanelSection>
      )}

      {model.layout && (
        <PanelSection title="Layout">
          {model.layout.distribute !== undefined && (
            <div className="ed-field">
              <span className="eds-label">Distribute</span>
              <SegmentedControl
                options={DISTRIBUTE_OPTS}
                value={model.layout.distribute}
                onChange={(v) => {
                  setLayout(selectedFrameId, selectedPath, { distribute: v as Distribute });
                }}
              />
            </div>
          )}
          {model.layout.justify !== undefined && (
            <div className="ed-field">
              <span className="eds-label">Justify</span>
              <SegmentedControl
                options={JUSTIFY_OPTS}
                value={model.layout.justify}
                onChange={(v) => {
                  setLayout(selectedFrameId, selectedPath, { justify: v as Justify });
                }}
              />
            </div>
          )}
          {model.layout.align !== undefined && (
            <div className="ed-field">
              <span className="eds-label">Align</span>
              <SegmentedControl
                options={ALIGN_OPTS}
                value={model.layout.align}
                onChange={(v) => {
                  setLayout(selectedFrameId, selectedPath, { align: v as Align });
                }}
              />
            </div>
          )}
          {model.layout.wrap !== undefined && (
            <div className="ed-field">
              <span className="eds-label">Wrap</span>
              <SegmentedControl
                options={WRAP_OPTS}
                value={model.layout.wrap}
                onChange={(v) => {
                  setLayout(selectedFrameId, selectedPath, { wrap: v as Wrap });
                }}
              />
            </div>
          )}
        </PanelSection>
      )}

      {model.style && (
        <PanelSection title="Style">
          {model.style.map((field) => (
            <TokenSelect
              key={field.key}
              frameId={selectedFrameId}
              path={selectedPath}
              field={field}
            />
          ))}
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
