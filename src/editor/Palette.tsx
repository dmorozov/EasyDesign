import { useDraggable } from '@dnd-kit/core';
import { useState, type ReactElement } from 'react';

import { Icon, Input, PaletteItem as PaletteTile } from '../design-system';

import { PALETTE, type PaletteItem } from './palette';
import { nodeAt, type NodePath } from './paths';
import { useEditor } from './store';

/** The Component Palette — searchable, grouped, draggable (or click-to-insert) components.
 *  Items not available in the current Frame medium are shown locked (ADR-0006). */
export function Palette(): ReactElement {
  const selectedFrameId = useEditor((s) => s.selectedFrameId);
  const frames = useEditor((s) => s.frames);
  const selectedFrame = frames.find((f) => f.id === selectedFrameId);
  const target = selectedFrame?.target ?? 'web';
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const matches = PALETTE.filter((item) => item.label.toLowerCase().includes(q));
  const layout = matches.filter((item) => item.group === 'layout');
  const content = matches.filter((item) => item.group === 'content');

  return (
    <aside className="ed-palette">
      <div className="ed-palette-search">
        <Input
          aria-label="Search components"
          lead={<Icon.search size={16} />}
          placeholder="Search components…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
        />
      </div>

      <div className="ed-palette-body">
        {matches.length === 0 ? (
          <div className="ed-palette-empty">
            <Icon.search size={22} />
            <p>No components match “{query}”.</p>
          </div>
        ) : (
          <>
            {layout.length > 0 && (
              <section className="ed-palette-group">
                <div className="eds-label">Layout</div>
                <div className="ed-palette-grid">
                  {layout.map((item) => (
                    <PaletteEntry key={item.id} item={item} target={target} tile="card" />
                  ))}
                </div>
              </section>
            )}
            {content.length > 0 && (
              <section className="ed-palette-group">
                <div className="eds-label">Content</div>
                <div className="ed-palette-list">
                  {content.map((item) => (
                    <PaletteEntry key={item.id} item={item} target={target} tile="row" />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {target === 'email' && (
          <p className="ed-palette-note">
            <strong>Email mode.</strong> Some components are locked because they aren’t email-safe.
          </p>
        )}
      </div>
    </aside>
  );
}

interface PaletteEntryProps {
  item: PaletteItem;
  target: 'web' | 'email';
  tile: 'card' | 'row';
}

function PaletteEntry({ item, target, tile }: PaletteEntryProps): ReactElement {
  const disabled = target === 'email' && !item.emailSafe;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${item.id}`,
    data: { kind: 'insert', item },
    disabled,
  });
  const insertChild = useEditor((s) => s.insertChild);
  const selectedFrameId = useEditor((s) => s.selectedFrameId);
  const selectedPath = useEditor((s) => s.selectedPath);
  const frames = useEditor((s) => s.frames);

  // Click inserts into the selected container (else the Frame root). Blocked when locked.
  const onClick = () => {
    if (disabled || !selectedFrameId) return;
    const frame = frames.find((f) => f.id === selectedFrameId);
    if (!frame) return;
    if (frame.target === 'email' && !item.emailSafe) return;
    const selected = selectedPath ? nodeAt(frame.root, selectedPath) : undefined;
    const parentPath: NodePath = selected && 'children' in selected ? (selectedPath ?? []) : [];
    insertChild(selectedFrameId, parentPath, item.create());
  };

  const Glyph = Icon[item.icon];

  // setNodeRef lives on a native wrapper (DS components don't forward ref under React 19);
  // the drag listeners/attributes + click go on the DS PaletteItem itself (typed via rest).
  return (
    <div ref={setNodeRef} className="ed-pal-drag">
      <PaletteTile
        layout={tile}
        icon={<Glyph />}
        label={item.label}
        dragging={isDragging}
        disabled={disabled}
        disabledNote="Not available in email"
        onClick={onClick}
        {...listeners}
        {...attributes}
      />
    </div>
  );
}
