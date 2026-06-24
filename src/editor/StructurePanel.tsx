import { type ReactElement } from 'react';

import { Icon } from '../design-system';
import { type Node } from '../ir/types';

import { DESCRIPTORS } from './descriptors';
import { nodeLabel } from './node-label';
import { flattenPaths, nodeAt, samePath, type NodePath } from './paths';
import { useEditor } from './store';

interface Row {
  path: NodePath;
  node: Node;
}

/** The Structure (layers) panel: the current Frame's whole component tree, in document order, indented
 *  by depth. Two-way highlight with the canvas — the selected node's row is marked, and clicking a row
 *  selects that node on the board (via the same `selectNode` the canvas uses; selecting keeps the
 *  Structure tab open so it stays a navigator). Rendered as the Structure tab body. */
export function StructurePanel(): ReactElement {
  const selectedFrameId = useEditor((s) => s.selectedFrameId);
  const selectedPath = useEditor((s) => s.selectedPath);
  const frames = useEditor((s) => s.frames);
  const selectNode = useEditor((s) => s.selectNode);

  const frame = frames.find((f) => f.id === selectedFrameId);
  if (!frame || !selectedFrameId) {
    return (
      <div className="ed-rail-empty">
        <div className="ed-rail-empty-icon">
          <Icon.layers size={22} />
        </div>
        <p className="ed-rail-empty-title">No frame selected</p>
        <p className="ed-rail-empty-text">
          Click a frame or any element on the board to see its structure here.
        </p>
      </div>
    );
  }

  // Pre-order paths → rows (the node lookup can't miss for a flattenPaths path, but guard to drop the
  // `!` and stay type-safe).
  const rows: Row[] = flattenPaths(frame.root)
    .map((path) => ({ path, node: nodeAt(frame.root, path) }))
    .filter((r): r is Row => r.node !== undefined);

  return (
    <div className="ed-structure">
      <div className="ed-structure-frame">{frame.title}</div>
      <div className="ed-structure-tree" role="tree" aria-label={`${frame.title} structure`}>
        {rows.map(({ path, node }) => {
          const selected = selectedPath !== null && samePath(selectedPath, path);
          const Glyph = Icon[DESCRIPTORS[node.type].icon];
          return (
            <button
              key={path.join('.') || 'root'}
              type="button"
              className="ed-tree-row"
              data-selected={selected || undefined}
              aria-current={selected ? 'true' : undefined}
              style={{ paddingInlineStart: `calc(var(--space-5) + ${path.length} * 14px)` }}
              onClick={() => {
                selectNode(selectedFrameId, path);
              }}
            >
              <span className="ed-tree-icon">
                <Glyph size={14} />
              </span>
              <span className="ed-tree-label">{nodeLabel(node, path)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
