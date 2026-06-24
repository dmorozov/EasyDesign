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
import { CANONICAL_AREAS, type RegionArea } from '../ir/appshell';
import { type Node, type RegionNode } from '../ir/types';
import { type StyleKey } from '../theme/design-tokens';

type NodeType = Node['type'];
type NodeOf<T extends NodeType> = Extract<Node, { type: T }>;
/** The editable prop keys of a node type — `never` for a type with no `props` (e.g. AppShell), so such
 *  a type simply can't declare `textFields`. */
type PropKeys<T extends NodeType> = NodeOf<T> extends { props: infer P } ? keyof P & string : never;

/** The Inspector control kinds a type *can* expose — a static spec. RP-6 renders these and owns the
 *  *dynamic* visibility (a Row in `fill` hides justify/wrap; an email root limits style keys).
 *  `heading` = the named Text-style (variant) picker. Free-text props are declared separately, as
 *  `textFields` (so the editable prop *keys* stay type-checked against the node), not as a control. */
export type ControlKind = 'heading' | 'distribute' | 'justify' | 'align' | 'wrap' | 'regions';

/** A free-text prop the Inspector edits as a labelled text input. `key` is type-checked to be a real
 *  prop of *this* node type (so Radio can only expose `value`/`label`, Text only `content`, …); the
 *  Inspector renders each in order and writes back via the generic `setTextProp` store action. */
export interface TextFieldSpec<T extends NodeType> {
  readonly key: PropKeys<T>;
  readonly label: string;
}

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
  /** Free-text props the Inspector edits (in order), each type-checked to a real prop of this type. */
  readonly textFields?: readonly TextFieldSpec<T>[];
  /** For a COMPOUND container (RP-10 / ADR-0016): the node types it may hold — a "slot" rule, e.g.
   *  RadioGroup → `['Radio']`. Omitted = an OPEN container (admits any non-slot child). Every type
   *  listed here becomes a *restricted* child (it may ONLY go where explicitly allowed). Read by the
   *  drag-drop validator (`canContain`, via drop-intent) and the import audit (`isFrameValid`). */
  readonly allowedChildren?: readonly NodeType[];
}

/** A mapped type over the node union — a missing row is a COMPILE error (the §1 "locality ≠ safety" lever). */
export type Descriptors = { [T in NodeType]: Descriptor<T> };

// A tiny neutral placeholder so a dropped Image renders something (email needs a hosted URL in real use).
const imagePlaceholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120'%3E" +
  "%3Crect width='200' height='120' fill='%23e5e7eb'/%3E%3C/svg%3E";

// The token-bound style keys every container exposes (web superset; RP-6 filters per medium/state).
const CONTAINER_STYLE_KEYS: readonly StyleKey[] = ['background', 'padding', 'borderRadius', 'gap'];

// A Region box — a surface card the user fills. Per-area sizing is baked into the AppShell grid
// (ir/appshell.ts), so a Region only carries its `area` + content styling. Exported so the store's
// `toggleRegion` mints a panel with the same default styling as the presets.
export function makeRegion(area: RegionArea): RegionNode {
  return {
    type: 'Region',
    props: { area },
    style: { background: 'color.surface', padding: 'space.md', gap: 'space.md' },
    children: [],
  };
}

/** Build an AppShell with one Region per area, in canonical visual order (header, left, main, right,
 *  footer). `main` is always present. Used by the descriptor `create()` AND the palette presets — so a
 *  preset is just a different area set (ADR-0017). */
export function makeAppShell(areas: readonly RegionArea[]): NodeOf<'AppShell'> {
  const present = new Set<RegionArea>([...areas, 'main']); // main is required
  return {
    type: 'AppShell',
    children: CANONICAL_AREAS.filter((a) => present.has(a)).map(makeRegion),
  };
}

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
    controls: ['heading'], // RP-6: the named-style (variant) picker; the text itself is a textField
    textFields: [{ key: 'content', label: 'Text' }],
  },
  Button: {
    label: 'Button',
    icon: 'button',
    group: 'content',
    emailSafe: true,
    create: () => ({ type: 'Button', props: { content: 'Button', variant: 'primary' } }),
    styleKeys: [],
    controls: [],
    textFields: [{ key: 'content', label: 'Label' }],
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
  // RP-10 / ADR-0016 — the first COMPOUND Component. RadioGroup is a component container (renders as a
  // RAC RadioGroup, not a layout box) constrained to Radio children; Radio is its slot leaf. Both are
  // email-unsafe (interactive form controls — MJML can't render them, ADR-0006). A fresh RadioGroup
  // mints two Radios so it reads as a real control; the user drags more Radios in (and ONLY into a
  // RadioGroup — `allowedChildren` + canContain reject a Radio dropped anywhere else).
  RadioGroup: {
    label: 'Radio group',
    icon: 'layers',
    group: 'content',
    emailSafe: false,
    create: () => ({
      type: 'RadioGroup',
      props: { label: 'Choose one' },
      children: [
        { type: 'Radio', props: { value: 'option-1', label: 'Option 1' } },
        { type: 'Radio', props: { value: 'option-2', label: 'Option 2' } },
      ],
    }),
    styleKeys: [],
    controls: [],
    allowedChildren: ['Radio'],
    textFields: [{ key: 'label', label: 'Group label' }],
  },
  Radio: {
    label: 'Radio',
    icon: 'check',
    group: 'content',
    emailSafe: false,
    create: () => ({ type: 'Radio', props: { value: 'option', label: 'Option' } }),
    styleKeys: [],
    controls: [],
    textFields: [
      { key: 'label', label: 'Label' },
      { key: 'value', label: 'Value' },
    ],
  },
  // ADR-0017 — the application-shell layout. AppShell is a COMPOUND layout Component (a CSS-grid box
  // whose template is computed from its Region children) constrained to Region children; Region is its
  // slot. Both are web-only (a grid app shell can't flatten to MJML, ADR-0006/0017). A fresh AppShell
  // mints header + main + footer; the `regions` control toggles the side panels, and the palette ships
  // preset area-sets. Region is NOT a free palette item — it exists only inside an AppShell.
  AppShell: {
    label: 'App layout',
    icon: 'layout',
    group: 'layout',
    emailSafe: false,
    create: () => makeAppShell(['header', 'main', 'footer']),
    styleKeys: ['background', 'padding', 'gap'],
    controls: ['regions'],
    allowedChildren: ['Region'],
  },
  Region: {
    label: 'Region',
    icon: 'stack',
    group: 'layout',
    emailSafe: false,
    create: () => makeRegion('main'),
    styleKeys: CONTAINER_STYLE_KEYS,
    controls: ['justify', 'align'],
  },
};

/** Node types that may ONLY appear where a descriptor explicitly lists them in `allowedChildren` —
 *  "slot" children (Radio inside RadioGroup). DERIVED from the descriptors, so the set has one source
 *  and a new slot child (a future data-grid Cell, etc.) joins it automatically (RP-10 / ADR-0016). */
export const RESTRICTED_CHILD_TYPES: ReadonlySet<NodeType> = new Set(
  (Object.keys(DESCRIPTORS) as NodeType[]).flatMap((t) => DESCRIPTORS[t].allowedChildren ?? []),
);

/** May a `parent`-type container hold a `child`-type node? (RP-10 / ADR-0016). A CONSTRAINED parent
 *  (its `allowedChildren` is set) admits only its listed types; an OPEN parent admits anything that is
 *  not a slot-restricted child (so a Radio can't land in a Stack/Grid). Structural only — email-safety
 *  is a separate, orthogonal rule (frames.ts). The two compose in `isFrameValid` + the drop validator. */
export function canContain(parent: NodeType, child: NodeType): boolean {
  const allowed = DESCRIPTORS[parent].allowedChildren;
  return allowed ? allowed.includes(child) : !RESTRICTED_CHILD_TYPES.has(child);
}
