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

/** Every container node type (those with a `children` array). */
export type ContainerNode = Extract<Node, { children: readonly Node[] }>;
/** The container type names — derived from the union, so adding a container type grows it. MJML's
 *  bespoke flattener keys its card-child dispatch off this to stay compile-exhaustive (RP-8). */
export type ContainerType = ContainerNode['type'];

/**
 * COMPONENT containers (RP-10 / ADR-0016, ADR-0017): containers that render bespoke — a RAC RadioGroup,
 * or an AppShell's computed CSS grid — rather than via a shared layout *shape*, so they bypass
 * `shapeOf`/`container()` and dispatch through `emit.component`, exactly parallel to how leaves dispatch
 * through `emit.leaf`. The rest are LAYOUT containers (Stack/Row/Column/Grid/Region), which share the
 * one shape-driven `container()` renderer.
 */
export type ComponentContainerType = 'RadioGroup' | 'AppShell';
export type ComponentContainerNode = Extract<Node, { type: ComponentContainerType }>;
export type LayoutContainerNode = Exclude<ContainerNode, ComponentContainerNode>;
export type LayoutContainerType = LayoutContainerNode['type'];

/** Which container types are component-containers — a Record (not a Set) so adding one is a compile
 *  error here AND at every walk adapter's `component` record (the §1 "locality ≠ safety" lever). */
export const COMPONENT_CONTAINERS: Record<ComponentContainerType, true> = {
  RadioGroup: true,
  AppShell: true,
};

/** A container that renders via a layout shape (Stack/Row/Column/Grid), not as a Component. A real type
 *  guard so consumers that read layout props (e.g. the Inspector model) narrow without a cast, and stay
 *  correct as more component containers are added (a future data grid joins by union, not by edit here). */
export function isLayoutContainer(node: Node): node is LayoutContainerNode {
  return 'children' in node && !(node.type in COMPONENT_CONTAINERS);
}

/** The leaf node types — those WITHOUT children. DERIVED from the union, so adding a leaf grows it;
 *  every target's `leaf` renderer record then fails to compile until the new leaf is handled (RP-9). */
export type LeafNode = Exclude<Node, ContainerNode>;
export type LeafType = LeafNode['type'];
export type TextNode = Extract<Node, { type: 'Text' }>;
export type ButtonNode = Extract<Node, { type: 'Button' }>;
export type ImageNode = Extract<Node, { type: 'Image' }>;

/**
 * Per-leaf-type renderers — a Record over the LeafType union, each narrowed to its own node variant.
 * Keying off the union is what makes a forgotten leaf a COMPILE error in every Export Target (RP-9),
 * instead of a runtime throw or a blank render: a target that omits a key fails to satisfy `Emitter`.
 */
export type LeafRenderers<T, C> = {
  [K in LeafType]: (node: Extract<Node, { type: K }>, ctx: C) => T;
};

/**
 * Per-component-container renderers — a Record over `ComponentContainerType`, each given its already-
 * walked children. Same compile-time guarantee as `leaf`: a target that omits one fails to satisfy
 * `Emitter`. Children are the rendered `T[]` (the walk has already recursed), so the renderer only
 * supplies the Component wrapper (a `<RadioGroup>`/`<fieldset>` around the rendered Radios).
 */
export type ComponentRenderers<T, C> = {
  [K in ComponentContainerType]: (node: Extract<Node, { type: K }>, children: T[], ctx: C) => T;
};

/**
 * A target adapter. `T` = output dialect (string | ReactElement). `C` = the
 * per-node context the caller threads down (void for html, NodePath for the
 * editor, a depth number for react/angular).
 *
 * Invariants the walk guarantees its adapters:
 *  - children are walked in document order; `children[i]` is child i's result.
 *  - an empty container is `container(node, shape, [], ctx)` — there is no separate
 *    "empty" path; only the editor cares, and it inspects `children.length`.
 *  - leaves never recurse; `leaf` is total over the LeafType union by construction.
 */
export interface Emitter<T, C> {
  /** LAYOUT containers (Stack/Row/Column/Grid) → a styled box driven by `shape`. */
  container(node: LayoutContainerNode, shape: ContainerShape, children: T[], ctx: C): T;
  /** COMPONENT containers (RadioGroup) → a specific Component wrapper, keyed off the union (RP-10). */
  component: ComponentRenderers<T, C>;
  /** Per-leaf-type renderers, keyed off the LeafType union (RP-9). */
  leaf: LeafRenderers<T, C>;
  /** Derive child i's context from the parent's. (void: noop; path: [...ctx, i]) */
  descend(ctx: C, index: number): C;
}

/** Resolve the α facts for a LAYOUT container. The ONLY place these rules live. (Component containers
 *  bypass this — they render via `emit.component`, not a layout shape.) */
export function shapeOf(node: LayoutContainerNode): ContainerShape {
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
    case 'Region':
      // A Region is a flow column (like Stack); its grid placement is applied by its AppShell parent.
      return {
        kind: 'flow',
        axis: 'column',
        wrapChildren: false,
        justify: node.props.justify ?? null,
        align: node.props.align ?? null,
        wrap: node.props.wrap ?? null,
      };
  }
}

/** Walk a node, producing T. The deep module: the container/component/leaf dispatch lives here, once. */
export function walkNode<T, C>(node: Node, ctx: C, emit: Emitter<T, C>): T {
  if ('children' in node) {
    const children = node.children.map((child, i) => walkNode(child, emit.descend(ctx, i), emit));
    // Component container (RadioGroup) → its own renderer; layout container → the shared shape renderer.
    // The casts bridge TS's correlated-union gap (the `in` check narrows the value, not the type).
    if (node.type in COMPONENT_CONTAINERS) {
      // The cast collapses the per-key renderer union to one signature: `node` and the looked-up
      // renderer are both narrowed to the same component container, but TS can't prove they align.
      const render = emit.component[node.type as ComponentContainerType] as (
        n: ComponentContainerNode,
        children: T[],
        ctx: C,
      ) => T;
      return render(node as ComponentContainerNode, children, ctx);
    }
    const layout = node as LayoutContainerNode;
    return emit.container(layout, shapeOf(layout), children, ctx);
  }
  // Leaf: keyed dispatch over the LeafType union (RP-9). The cast bridges TS's correlated-union gap —
  // `node` and `emit.leaf[node.type]` are both narrowed to the same leaf, but TS can't prove they align.
  return (emit.leaf[node.type] as (n: LeafNode, c: C) => T)(node, ctx);
}
