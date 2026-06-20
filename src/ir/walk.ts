// src/ir/walk.ts — the Node Walk seam (ADR-0008).
//
// The Node Walk seam: ONE traversal owns α — the structural dispatch over the
// Layout-element/Component vocabulary, the Stack/Row/Column/Grid facts, recursion,
// and document order. β (the CSS vocabulary) and formatting stay in the per-target
// Emitter. Pure, in-process (DEEPENING category 1): imports ONLY ir/types, so the
// substrate can never pull in design-system or the component layer (ADR-0007).
import { type Align, type Justify, type Node, type Wrap } from './types';

export type Axis = 'row' | 'column';

/**
 * A container's resolved structural facts — the α decisions, stated ONCE.
 *
 * A DISCRIMINATED UNION on `kind`: every emitter switches on it, so adding a third
 * layout kind (or a new structural property to an existing kind) is a compile error
 * in each target — the layout-feature exhaustiveness gate.
 */
export type ContainerShape =
  | {
      readonly kind: 'flow';
      readonly axis: Axis; // Stack/Column -> 'column', Row -> 'row'
      readonly wrapChildren: boolean; // Row -> true (the flex:1-per-child decision)
      readonly justify: Justify | null;
      readonly align: Align | null;
      readonly wrap: Wrap | null;
    }
  | {
      readonly kind: 'grid';
      readonly columns: number;
      readonly justify: Justify | null;
      readonly align: Align | null;
    };

/** The four container node types (those with `children`). */
export type ContainerNode = Extract<Node, { children: Node[] }>;
export type TextNode = Extract<Node, { type: 'Text' }>;
export type ButtonNode = Extract<Node, { type: 'Button' }>;
export type ImageNode = Extract<Node, { type: 'Image' }>;

/**
 * A target adapter. `T` = output dialect (string | ReactElement). `C` = the
 * per-node context the caller threads down (void for html, NodePath for the
 * editor, a depth number for react/angular).
 *
 * Invariants the walk guarantees its adapters:
 *  - children are walked in document order; `children[i]` is child i's result.
 *  - an empty container is `container(node, shape, [], ctx)` — there is no separate
 *    "empty" path; only the editor cares, and it inspects `children.length`.
 *  - leaves never recurse; the three leaf methods are total over Text|Button|Image.
 */
export interface Emitter<T, C> {
  container(node: ContainerNode, shape: ContainerShape, children: T[], ctx: C): T;
  text(node: TextNode, ctx: C): T;
  button(node: ButtonNode, ctx: C): T;
  image(node: ImageNode, ctx: C): T;
  /** Derive child i's context from the parent's. (void: noop; path: [...ctx, i]) */
  descend(ctx: C, index: number): C;
}

/** Resolve the α facts for a container. The ONLY place these rules live. */
export function shapeOf(node: ContainerNode): ContainerShape {
  switch (node.type) {
    case 'Stack':
    case 'Column':
      return {
        kind: 'flow',
        axis: 'column',
        wrapChildren: false,
        justify: node.props?.justify ?? null,
        align: node.props?.align ?? null,
        wrap: node.props?.wrap ?? null,
      };
    case 'Row':
      return {
        kind: 'flow',
        axis: 'row',
        // 'fill' wraps each child in flex:1 (equal columns); 'fit' (default) lets
        // children size to content so justify/wrap actually do something (ADR-0008).
        wrapChildren: node.props?.distribute === 'fill',
        justify: node.props?.justify ?? null,
        align: node.props?.align ?? null,
        wrap: node.props?.wrap ?? null,
      };
    case 'Grid':
      return {
        kind: 'grid',
        columns: node.props.columns,
        justify: node.props.justify ?? null,
        align: node.props.align ?? null,
      };
  }
}

/** Walk a node, producing T. The deep module: the 7-way dispatch lives here, once. */
export function walkNode<T, C>(node: Node, ctx: C, emit: Emitter<T, C>): T {
  switch (node.type) {
    case 'Stack':
    case 'Column':
    case 'Row':
    case 'Grid': {
      const shape = shapeOf(node);
      const children = node.children.map((child, i) => walkNode(child, emit.descend(ctx, i), emit));
      return emit.container(node, shape, children, ctx);
    }
    case 'Text':
      return emit.text(node, ctx);
    case 'Button':
      return emit.button(node, ctx);
    case 'Image':
      return emit.image(node, ctx);
  }
}
