import { useDraggable } from '@dnd-kit/core';
import { useState, type ReactElement } from 'react';

import { Icon, IconButton, Input, PaletteItem as PaletteTile } from '../design-system';

import { canInsertComponent, canInsertInTarget, insertHint } from './frames';
import { PALETTE, type PaletteItem } from './palette';
import { nodeAt, type NodePath } from './paths';
import { useEditor } from './store';

interface PaletteProps {
  /** Whether the palette is folded to its collapsed strip. */
  collapsed: boolean;
  /** Fold / unfold the palette. */
  onToggle: (collapsed: boolean) => void;
}

/** The Component Palette — searchable, grouped, draggable (or click-to-insert) components. Foldable to a
 *  thin strip with a single expand button, handing the width to the Board. Items not available in the
 *  current Frame medium are shown locked (ADR-0006). */
export function Palette({ collapsed, onToggle }: PaletteProps): ReactElement {
  const selectedFrameId = useEditor((s) => s.selectedFrameId);
  const frames = useEditor((s) => s.frames);
  const selectedFrame = frames.find((f) => f.id === selectedFrameId);
  const target = selectedFrame?.target ?? 'web';
  const [query, setQuery] = useState('');

  // Collapsed: just a thin strip with an expand button (the panel content is unmounted).
  if (collapsed) {
    return (
      <aside className="ed-palette" data-collapsed="true">
        <div className="ed-rail-strip">
          <IconButton
            size="sm"
            aria-label="Expand components"
            onClick={() => {
              onToggle(false);
            }}
          >
            <Icon.chevronRight />
          </IconButton>
        </div>
      </aside>
    );
  }

  const q = query.trim().toLowerCase();
  const matches = PALETTE.filter((item) => item.label.toLowerCase().includes(q));
  const layout = matches.filter((item) => item.group === 'layout');
  const content = matches.filter((item) => item.group === 'content');

  return (
    <aside className="ed-palette" data-collapsed="false">
      <div className="ed-rail-head">
        <span className="ed-rail-title">Components</span>
        <IconButton
          size="sm"
          aria-label="Collapse components"
          onClick={() => {
            onToggle(true);
          }}
        >
          <Icon.chevronLeft />
        </IconButton>
      </div>

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
  const disabled = !canInsertInTarget(target, item);
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
    if (!canInsertComponent(frame, item)) return;
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
        disabledNote={insertHint(target)}
        onClick={onClick}
        {...listeners}
        {...attributes}
      />
    </div>
  );
}
