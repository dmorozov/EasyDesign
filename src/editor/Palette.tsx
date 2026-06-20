import { useDraggable } from '@dnd-kit/core';
import { type ReactElement } from 'react';

import { paletteFor, type PaletteItem } from './palette';
import { nodeAt, type NodePath } from './paths';
import { useEditor } from './store';

/** The Component Palette — draggable (or click-to-insert) components, filtered by Frame target. */
export function Palette(): ReactElement {
  const selectedFrameId = useEditor((s) => s.selectedFrameId);
  const frames = useEditor((s) => s.frames);
  const selectedFrame = frames.find((f) => f.id === selectedFrameId);
  const target = selectedFrame?.target ?? 'web';
  const items = paletteFor(target);

  return (
    <aside className="ed-palette ed-panel">
      <h3>Components</h3>
      <p className="ed-hint">{selectedFrame ? `${target} frame` : 'select a frame'}</p>
      {items.map((item) => (
        <PaletteEntry key={item.id} item={item} />
      ))}
      {target === 'email' && <p className="ed-hint">Grid hidden — not email-safe (ADR-0006)</p>}
    </aside>
  );
}

function PaletteEntry({ item }: { item: PaletteItem }): ReactElement {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${item.id}`,
    data: { kind: 'insert', item },
  });
  const insertChild = useEditor((s) => s.insertChild);
  const selectedFrameId = useEditor((s) => s.selectedFrameId);
  const selectedPath = useEditor((s) => s.selectedPath);
  const frames = useEditor((s) => s.frames);

  // Click inserts into the selected container (else the Frame root).
  const onClick = () => {
    if (!selectedFrameId) return;
    const frame = frames.find((f) => f.id === selectedFrameId);
    if (!frame) return;
    if (frame.target === 'email' && !item.emailSafe) return;
    const selected = selectedPath ? nodeAt(frame.root, selectedPath) : undefined;
    const parentPath: NodePath = selected && 'children' in selected ? (selectedPath ?? []) : [];
    insertChild(selectedFrameId, parentPath, item.create());
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...listeners}
      {...attributes}
    >
      {item.label}
    </button>
  );
}
