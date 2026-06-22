// src/editor/descriptors.ts — RP-2: the Component Descriptor (ADR-0014).
//
// THE one home for "what is a Component" — every per-node-TYPE fact that isn't structural
// traversal (that stays in the Node Walk, walk.ts / ADR-0008) and isn't theming (the Catalog,
// design-tokens.ts / ADR-0004). Before this, those facts smeared across ~12 sites that each
// re-encoded the type list (palette label/icon/group, the email-safe rule, the a11y label, the
// Inspector controls, the style keys), 8 of them SILENT — adding a Component meant a scavenger hunt.
//
// SAFETY comes from keying off the union as a MAPPED TYPE: `{ [T in Node['type']]: Descriptor<T> }`
// makes a missing row a *compile* error, and each row's `create: () => Extract<Node,{type:T}>` is
// per-type-checked — so create()/union parity holds *by construction*, no test required.
//
// Boundary (ADR-0014): the descriptor owns only facts the type system *cannot* express. Container-ness
// is NOT a field — it stays union-derived (`'children' in node`), never a hand-authored `kind` that
// could drift from walk.ts. The per-target RENDERERS are a separate library registry (RP-9), not here.
// This module lives in src/editor (not the dependency-free src/ir) because it carries editor-runtime
// chrome facts — `icon` and `controls` (ADR-0008).
import { type IconName } from '../design-system';
import { type Node } from '../ir/types';
import { type StyleKey } from '../theme/design-tokens';

type NodeType = Node['type'];
type NodeOf<T extends NodeType> = Extract<Node, { type: T }>;

/** The Inspector control kinds a type *can* expose — a static spec. RP-6 renders these and owns the
 *  *dynamic* visibility (a Row in `fill` hides justify/wrap; an email root limits style keys). */
export type ControlKind = 'content' | 'distribute' | 'justify' | 'align' | 'wrap';

/** Per-node-type facts. `T` ties `create` to the exact node variant so the row can't drift from the union. */
export interface Descriptor<T extends NodeType> {
  /** Human label (a11y describe(), default palette label). Equals the type name today. */
  readonly label: string;
  /** Chrome icon for the palette tile / row (editor-runtime — why this can't live in src/ir). */
  readonly icon: IconName;
  /** Palette grouping: layout cards vs content rows. */
  readonly group: 'layout' | 'content';
  /** ADR-0006 email-safety — the ONE home; the Palette projection and frames.ts both read this. */
  readonly emailSafe: boolean;
  /** Mint a fresh, default node of this type. Per-type-checked → create/union parity by construction. */
  readonly create: () => NodeOf<T>;
  /** Token-bound style keys this type exposes (read by RP-6; RP-4 grows the Text set). */
  readonly styleKeys: readonly StyleKey[];
  /** Static Inspector control spec (read by RP-6, which filters it dynamically). */
  readonly controls: readonly ControlKind[];
}

/** A mapped type over the node union — a missing row is a COMPILE error (the §1 "locality ≠ safety" lever). */
export type Descriptors = { [T in NodeType]: Descriptor<T> };

// A tiny neutral placeholder so a dropped Image renders something (email needs a hosted URL in real use).
const imagePlaceholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120'%3E" +
  "%3Crect width='200' height='120' fill='%23e5e7eb'/%3E%3C/svg%3E";

// The token-bound style keys every container exposes (web superset; RP-6 filters per medium/state).
const CONTAINER_STYLE_KEYS: readonly StyleKey[] = ['background', 'padding', 'borderRadius', 'gap'];

export const DESCRIPTORS: Descriptors = {
  Stack: {
    label: 'Stack',
    icon: 'stack',
    group: 'layout',
    emailSafe: true,
    create: () => ({ type: 'Stack', style: { gap: 'space.md' }, children: [] }),
    styleKeys: CONTAINER_STYLE_KEYS,
    controls: ['justify', 'align', 'wrap'],
  },
  Row: {
    label: 'Row',
    icon: 'row',
    group: 'layout',
    emailSafe: true,
    create: () => ({ type: 'Row', style: { gap: 'space.md' }, children: [] }),
    styleKeys: CONTAINER_STYLE_KEYS,
    controls: ['distribute', 'justify', 'align', 'wrap'],
  },
  Column: {
    label: 'Column',
    icon: 'column',
    group: 'layout',
    emailSafe: true,
    create: () => ({ type: 'Column', style: { gap: 'space.md' }, children: [] }),
    styleKeys: CONTAINER_STYLE_KEYS,
    controls: ['justify', 'align', 'wrap'],
  },
  Grid: {
    label: 'Grid',
    icon: 'grid',
    group: 'layout',
    emailSafe: false, // ADR-0006: MJML can't represent a grid → email Frames lock it
    create: () => ({
      type: 'Grid',
      props: { columns: 2 },
      style: { gap: 'space.md' },
      children: [],
    }),
    styleKeys: CONTAINER_STYLE_KEYS,
    controls: ['justify', 'align'], // no wrap, no distribute
  },
  Text: {
    label: 'Text',
    icon: 'text',
    group: 'content',
    emailSafe: true,
    create: () => ({ type: 'Text', props: { content: 'Body text', variant: 'body' } }),
    styleKeys: ['fontSize', 'fontWeight'], // RP-4: free-form text picks size/weight from the Type scale
    controls: ['content'],
  },
  Button: {
    label: 'Button',
    icon: 'button',
    group: 'content',
    emailSafe: true,
    create: () => ({ type: 'Button', props: { content: 'Button', variant: 'primary' } }),
    styleKeys: [],
    controls: ['content'],
  },
  Image: {
    label: 'Image',
    icon: 'image',
    group: 'content',
    emailSafe: true,
    create: () => ({ type: 'Image', props: { src: imagePlaceholder, alt: 'image', width: 200 } }),
    styleKeys: [],
    controls: [],
  },
};
