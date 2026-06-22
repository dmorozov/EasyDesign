// src/editor/inspector-options.ts — RP-6: the Inspector presenter's INVARIANT option lists + labels.
//
// The resolver (edit-model.ts) owns the DYNAMIC bits (which fields are editable, their current value,
// the token options). What's left — the fixed option lists for the enum controls (justify/align/wrap/
// distribute), the named-style list, and the style-key labels — are the presenter's. They live in this
// pure, React-free module for two reasons:
//   1. COMPILE-FORCED off the unions. Each list is derived from a `Record<Union, string>` label map, so
//      a new IR enum member (a future Justify, a new TextStyle) is a missing-key BUILD error and the
//      value can never silently vanish from a picker — the same guard the token catalog uses. (The
//      review found these were hand-authored arrays with no such tie; this closes that drift seam.)
//   2. UNIT-TESTABLE without jsdom. React components are E2E-only here, but this data is pure, so the
//      "every option list covers exactly its union" contract is a plain assertion (inspector-options.test.ts).
import { type Align, type Distribute, type Justify, type Wrap } from '../ir/types';
import { type StyleKey } from '../theme/design-tokens';
import { type TextStyle } from '../theme/generated/typography';

export interface Opt {
  readonly value: string;
  readonly label: string;
}

// A label per union member → `Object.keys` yields a complete, ordered option list, and a NEW union
// member is a missing-key compile error in the map below (parity by construction, no test required).
const optsFrom = <T extends string>(labels: Record<T, string>): Opt[] =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

const DISTRIBUTE_LABEL: Record<Distribute, string> = { fit: 'Fit', fill: 'Fill' };
const JUSTIFY_LABEL: Record<Justify, string> = {
  start: 'Start',
  center: 'Center',
  end: 'End',
  'space-between': 'Between',
  'space-around': 'Around',
};
const ALIGN_LABEL: Record<Align, string> = {
  start: 'Start',
  center: 'Center',
  end: 'End',
  stretch: 'Stretch',
};
const WRAP_LABEL: Record<Wrap, string> = { nowrap: 'No wrap', wrap: 'Wrap' };
// The named Text styles (RP-3); the option order follows this map (h1 → label).
const HEADING_LABEL: Record<TextStyle, string> = {
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  body: 'Body',
  caption: 'Caption',
  label: 'Label',
};

export const DISTRIBUTE_OPTS = optsFrom(DISTRIBUTE_LABEL);
export const JUSTIFY_OPTS = optsFrom(JUSTIFY_LABEL);
export const ALIGN_OPTS = optsFrom(ALIGN_LABEL);
export const WRAP_OPTS = optsFrom(WRAP_LABEL);
export const HEADING_OPTS = optsFrom(HEADING_LABEL);

/** Friendly label per token-bound style key (presentation; the keys themselves come from the model). */
export const STYLE_LABEL: Record<StyleKey, string> = {
  background: 'Background',
  padding: 'Padding',
  borderRadius: 'Border radius',
  gap: 'Gap',
  fontSize: 'Font size',
  fontWeight: 'Font weight',
};
