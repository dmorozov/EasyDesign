// src/editor/edit-model.ts — RP-6: the Inspector's selection-editing MODEL.
//
// "Given a Selection, what can I edit?" used to be computed inline in Inspector.tsx JSX —
// `editable = Text||Button`, the Row-`fill` justify/wrap hiding, the email-root style narrowing, and
// the per-key option lists — untested, interleaved with rendering, and container-gated so leaves
// never got a style section. This module is the one home for those DECISIONS: a pure
// `resolveEditModel(medium, node, path) → EditModel` whose every *present* field means "editable for
// this selection", carrying the dynamic bits (current value, resolved token options). The Inspector
// becomes a thin presenter that renders each present field with its typed control — no domain logic.
//
// Four layers compose here (none re-encoded): RP-2's descriptor = static per-type availability
// (`controls`/`styleKeys`); RP-4's `STYLE_KEY_CATEGORY` + the Catalog `byCategory` = the token-option
// source; RP-3's `TextStyle` = the named-style domain; and THIS resolver = the dynamic medium/state
// filtering + option/value resolution. Invariant enum option lists (justify/align/wrap/distribute) and
// the named-style list stay as presenter constants — only the *dynamic* token options live in the model.
import { type Align, type Distribute, type Justify, type Node, type Wrap } from '../ir/types';
import { catalog, STYLE_KEY_CATEGORY, type Category, type StyleKey } from '../theme/design-tokens';
import { type TextStyle } from '../theme/generated/typography';

import { DESCRIPTORS } from './descriptors';
import { type NodePath } from './paths';

export type Medium = 'web' | 'email';

/** One token-bound field (a container style key, or a free-form Text size/weight): the current ref
 *  ('' = unset/Default) plus the Design-Token options for its category, resolved from the Catalog. */
export interface TokenOption {
  readonly value: string; // a token ref, or '' for the "Default" (clear) row
  readonly label: string; // e.g. 'lg · 24px'
}
export interface TokenField {
  readonly key: StyleKey;
  readonly value: string;
  readonly options: readonly TokenOption[];
}

/** Container layout — each present field carries only its resolved current value; the option lists are
 *  invariant enums the presenter owns. Absence of a key = that control is hidden for this selection. */
export interface LayoutModel {
  readonly distribute?: Distribute;
  readonly justify?: Justify;
  readonly align?: Align;
  readonly wrap?: Wrap;
}

/** A Text node's typography: the named style (`heading`, value only — the option list is the static
 *  `TextStyle` set the presenter owns) and the two free-form Type-scale fields. */
export interface TypographyModel {
  readonly heading?: TextStyle;
  readonly size?: TokenField;
  readonly weight?: TokenField;
}

/** The structured, typed editing model. A present top-level field = an editable section. */
export interface EditModel {
  readonly type: Node['type'];
  readonly content?: string;
  readonly layout?: LayoutModel;
  readonly typography?: TypographyModel;
  readonly style?: readonly TokenField[];
}

// The font-ish categories whose style keys belong in the Typography section (not the generic Style
// section). Derived from the Catalog Category so a new typographic key sorts itself.
const TYPOGRAPHIC: ReadonlySet<Category> = new Set<Category>([
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
]);
const isTypographic = (key: StyleKey): boolean => TYPOGRAPHIC.has(STYLE_KEY_CATEGORY[key]);

const leaf = (ref: string): string => ref.split('.').pop() ?? ref;

// Built once per category (the Catalog is static): the option list for a token field, with a leading
// "Default" (value '') that clears the binding. Mirrors the old Inspector STYLE_OPTIONS, now per-category.
const optionsByCategory = new Map<Category, readonly TokenOption[]>();
function tokenOptions(category: Category): readonly TokenOption[] {
  let opts = optionsByCategory.get(category);
  if (!opts) {
    opts = [
      { value: '', label: 'Default' },
      ...catalog
        .byCategory(category)
        .map((t) => ({ value: t.ref, label: `${leaf(t.ref)} · ${t.literal}` })),
    ];
    optionsByCategory.set(category, opts);
  }
  return opts;
}

const tokenField = (node: Node, key: StyleKey): TokenField => ({
  key,
  value: node.style?.[key] ?? '',
  options: tokenOptions(STYLE_KEY_CATEGORY[key]),
});

/**
 * The single decision for "what can I edit about this Selection". Pure: no store, no React, no
 * catalog mutation. `medium` is the Frame's target (web/email) — the only thing outside the node that
 * changes the answer (email narrows a container's style keys; ADR-0006). `path` is the node's location
 * (only its depth matters — an email *root* keeps background/padding, deeper containers keep none).
 */
export function resolveEditModel(medium: Medium, node: Node, path: NodePath): EditModel {
  const { controls, styleKeys } = DESCRIPTORS[node.type];

  // Content (Text/Button) — the descriptor declares it; the value is read structurally.
  const content = controls.includes('content') ? contentOf(node) : undefined;

  // Layout (containers only). Each control is per-type (descriptor) and per-state (Row-`fill` hides
  // justify/wrap, because every child grows equally so there is no free space for them to act on).
  let layout: LayoutModel | undefined;
  if ('children' in node) {
    const distribute = node.type === 'Row' ? (node.props?.distribute ?? 'fit') : undefined;
    const isFillRow = distribute === 'fill';
    layout = {
      ...(controls.includes('distribute') && distribute !== undefined ? { distribute } : {}),
      ...(controls.includes('justify') && !isFillRow
        ? { justify: node.props?.justify ?? 'start' }
        : {}),
      ...(controls.includes('align') ? { align: node.props?.align ?? 'stretch' } : {}),
      ...(controls.includes('wrap') && !isFillRow && node.type !== 'Grid'
        ? { wrap: node.props?.wrap ?? 'nowrap' }
        : {}),
    };
  }

  // Typography (Text): the named-style picker + the free-form size/weight Type-scale fields. Honoured
  // in every medium — unlike container style keys, these survive into MJML export (RP-3 binding).
  const heading =
    controls.includes('heading') && node.type === 'Text' ? node.props.variant : undefined;
  const size = styleKeys.includes('fontSize') ? tokenField(node, 'fontSize') : undefined;
  const weight = styleKeys.includes('fontWeight') ? tokenField(node, 'fontWeight') : undefined;
  const typography: TypographyModel | undefined =
    heading !== undefined || size || weight
      ? {
          ...(heading !== undefined ? { heading } : {}),
          ...(size ? { size } : {}),
          ...(weight ? { weight } : {}),
        }
      : undefined;

  // Style: the container token keys (background/padding/borderRadius/gap), medium-narrowed. MJML only
  // honours background/padding, and only on the root Stack (mjml.ts renderCardSections) — so an email
  // container exposes just those at the root, none deeper. Typographic keys are handled above and excluded.
  const containerKeys = styleKeys.filter((k) => !isTypographic(k));
  const visibleKeys =
    medium === 'email' && 'children' in node
      ? path.length === 0
        ? containerKeys.filter((k) => k === 'background' || k === 'padding')
        : []
      : containerKeys;
  const style = visibleKeys.length ? visibleKeys.map((k) => tokenField(node, k)) : undefined;

  return {
    type: node.type,
    ...(content !== undefined ? { content } : {}),
    ...(layout ? { layout } : {}),
    ...(typography ? { typography } : {}),
    ...(style ? { style } : {}),
  };
}

/** The `content` prop, read structurally (only Text/Button carry one — the descriptor gates presence). */
function contentOf(node: Node): string | undefined {
  return node.props && 'content' in node.props ? node.props.content : undefined;
}
