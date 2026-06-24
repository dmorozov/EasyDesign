import { type Node } from '../ir/types';

import { DESCRIPTORS } from './descriptors';
import { type NodePath } from './paths';

/** A human label for one node in the Frame tree — the per-type label (RP-2 descriptor) plus a
 *  distinguishing detail where one exists (a Text/Button's content, an Image's alt, a Radio's label, a
 *  Region's area). The ONE home for these labels, shared by the canvas a11y tree (useCanvasA11y) and the
 *  Structure panel, so the two never drift. The root node is prefixed with "root ". */
export function nodeLabel(node: Node, path: NodePath): string {
  const where = path.length === 0 ? 'root ' : '';
  const label = DESCRIPTORS[node.type].label;
  if (node.type === 'Text' || node.type === 'Button') {
    const content = node.props.content.trim();
    return content ? `${where}${label}: ${content}` : `${where}${label}`;
  }
  if (node.type === 'Image') return `${where}${label}: ${node.props.alt || 'image'}`;
  if (node.type === 'Radio') return `${where}${label}: ${node.props.label}`;
  if (node.type === 'Region') return `${where}${label}: ${node.props.area}`;
  return `${where}${label}`;
}
