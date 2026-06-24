import { type KeyboardEvent } from 'react';

import { type Node } from '../ir/types';

import { nodeLabel } from './node-label';
import { flattenPaths, isContainer, samePath, type NodePath } from './paths';
import { useEditor } from './store';

export interface CanvasA11yProps {
  role: 'treeitem';
  tabIndex: number;
  'aria-label': string;
  'aria-level': number;
  /** Present only on container nodes (always expanded in this editor) and on the selected node. */
  'aria-expanded'?: boolean | undefined;
  'aria-selected'?: boolean | undefined;
  'data-ed-path': string;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}

function focusNode(frameId: string, path: NodePath): void {
  const selector = `.react-flow__node[data-id="${frameId}"] [data-ed-path="${path.join('.')}"]`;
  document.querySelector<HTMLElement>(selector)?.focus();
}

/** Keyboard + ARIA for one canvas node (the EditableShell wrapper): a `treeitem` (owned by the Frame
 *  body's `role="tree"`) with a roving tabindex, Enter/Space to select, Delete/Backspace to remove
 *  (non-root, then land focus on the parent), Escape to deselect, and Arrow Up/Down to walk the Frame's
 *  tree in document order, Left/Right to step to parent/first child. The real keyboard a11y that lets
 *  the editor drop its `jsx-a11y` relaxation — the click handler stays for the mouse. */
export function useCanvasA11y(frameId: string, path: NodePath, node: Node): CanvasA11yProps {
  const selected = useEditor(
    (s) => s.selectedFrameId === frameId && samePath(s.selectedPath, path),
  );
  // The root is the keyboard entry point for its Frame whenever no node in that Frame is selected.
  const noNodeSelected = useEditor(
    (s) => !(s.selectedFrameId === frameId && s.selectedPath !== null),
  );
  const selectNode = useEditor((s) => s.selectNode);
  const deleteNode = useEditor((s) => s.deleteNode);
  const clearSelection = useEditor((s) => s.clearSelection);
  const isRoot = path.length === 0;
  const container = isContainer(node);
  const hasChildren = 'children' in node && node.children.length > 0;

  const goTo = (target: NodePath): void => {
    selectNode(frameId, target);
    focusNode(frameId, target);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        e.stopPropagation();
        selectNode(frameId, path);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault(); // also stops Backspace from navigating the browser back
        e.stopPropagation();
        if (!isRoot) {
          deleteNode(frameId, path);
          goTo(path.slice(0, -1)); // land on the surviving parent so keyboard nav continues
        }
        break;
      case 'Escape':
        e.stopPropagation();
        clearSelection();
        break;
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        e.stopPropagation();
        const frame = useEditor.getState().frames.find((f) => f.id === frameId);
        if (!frame) break;
        const order = flattenPaths(frame.root);
        const index = order.findIndex((p) => samePath(p, path));
        const next = order[index + (e.key === 'ArrowDown' ? 1 : -1)];
        if (next) goTo(next);
        break;
      }
      case 'ArrowRight':
        e.preventDefault();
        e.stopPropagation();
        if (hasChildren) goTo([...path, 0]); // step into the first child
        break;
      case 'ArrowLeft':
        e.preventDefault();
        e.stopPropagation();
        if (!isRoot) goTo(path.slice(0, -1)); // step out to the parent
        break;
      default:
        break;
    }
  };

  return {
    role: 'treeitem',
    tabIndex: selected || (isRoot && noNodeSelected) ? 0 : -1,
    'aria-label': nodeLabel(node, path),
    'aria-level': path.length + 1,
    'aria-expanded': container ? true : undefined,
    'aria-selected': selected ? true : undefined,
    'data-ed-path': path.join('.'),
    onKeyDown,
  };
}
