// The Frame lifecycle module (D3) — IN-PROCESS, pure over EditorFrame[]. No React, no React Flow, no
// zustand, so it is unit-testable directly. This is the ONE home for: what a Frame is, what may go in
// it (the email-safe rule, ADR-0006), and create/delete/move. The store actions are thin wrappers that
// call these through the `mutate()` funnel (which records history + persists) + reconcile selection/rightTab.
import { type Node } from '../ir/types';

import { DESCRIPTORS } from './descriptors';
import { type EditorFrame } from './document';
import { type PaletteItem } from './palette';

export type FrameTarget = EditorFrame['target']; // 'web' | 'email'

interface TargetProfile {
  /** Shown on the Frame's read-only type label (top-right). */
  label: string;
  /** Title a freshly-created Frame of this medium gets. */
  defaultTitle: string;
  /** The email-safe rule for this medium: may this Component go in? */
  allows: (item: PaletteItem) => boolean;
  /** The empty IR shell a new Frame of this medium starts from. */
  makeRoot: () => Node;
  /** Preview-width presets offered for this medium (ADR-0013) — a canvas affordance, never exported. */
  widths: { label: string; value: number }[];
  /** Default Preview width a new (and a back-filled legacy) Frame of this medium gets. */
  defaultWidth: number;
}

const emptyStack = (): Node => ({ type: 'Stack', style: { gap: 'space.md' }, children: [] });

// One entry per medium — the two media's facts co-located (a 3rd medium is out of scope, ADR-0002).
// The width presets live here too (ADR-0013): the medium gates both what may go in a Frame and what
// Preview widths it offers (email is canonically a single 600px to mirror MJML's default body).
export const TARGET_PROFILES: Record<FrameTarget, TargetProfile> = {
  web: {
    label: 'Web page',
    defaultTitle: 'New screen',
    allows: () => true,
    makeRoot: emptyStack,
    widths: [
      { label: 'Mobile', value: 375 },
      { label: 'Tablet', value: 768 },
      { label: 'Desktop', value: 1280 },
    ],
    defaultWidth: 1280,
  },
  email: {
    label: 'Email',
    defaultTitle: 'New email',
    allows: (item) => item.emailSafe, // ADR-0006: email Frames take only email-safe Components
    makeRoot: emptyStack,
    widths: [{ label: 'Email', value: 600 }],
    defaultWidth: 600,
  },
};

/** The ONE email-safe predicate (ADR-0006). Consulted by all three sites — the drop guard, the
 *  click-insert guard, and the locked-tile affordance — so the rule can never drift. */
export function canInsertComponent(frame: EditorFrame, item: PaletteItem): boolean {
  return TARGET_PROFILES[frame.target].allows(item);
}

/** Same rule against a bare target — for the Palette tile, which knows the selected Frame's medium
 *  but renders before a specific Frame object is in hand. */
export function canInsertInTarget(target: FrameTarget, item: PaletteItem): boolean {
  return TARGET_PROFILES[target].allows(item);
}

/** The note shown on a locked tile (replaces the hard-coded "Not available in email"). */
export function insertHint(target: FrameTarget): string {
  return `Not available in ${TARGET_PROFILES[target].label}`;
}

// ── Import audit (ADR-0006) ─────────────────────────────────────────────────
// The interactive guards (canInsertComponent) keep email Frames clean as the user builds, but an
// IMPORTED or hand-edited document bypasses them. These give the type-level twin of the rule so the
// document validator can reject an email Frame whose tree holds an email-unsafe node — which would
// otherwise reach the MJML generator and fail (it throws on a Grid; ADR-0006).

// The node TYPES an email Frame may not contain — DERIVED from the Component Descriptor's `emailSafe`
// (RP-2/ADR-0014), so the rule has one source and can't drift from the Palette (Grid is the one blocked
// Component today). `isNodeEmailSafe` keeps its Set-based shape so an unknown imported type is permissive.
export const EMAIL_UNSAFE_TYPES: ReadonlySet<string> = new Set(
  (Object.keys(DESCRIPTORS) as Node['type'][]).filter((type) => !DESCRIPTORS[type].emailSafe),
);

export function isNodeEmailSafe(type: string): boolean {
  return !EMAIL_UNSAFE_TYPES.has(type);
}

/** True iff a Frame's whole tree is email-safe (web Frames are always clean). Defensive over the
 *  untrusted IR of an imported document — never throws on a malformed node. */
export function isEmailFrameClean(target: FrameTarget, root: unknown): boolean {
  if (target !== 'email') return true;
  const ok = (node: unknown): boolean => {
    if (typeof node !== 'object' || node === null) return true;
    const n = node as { type?: unknown; children?: unknown };
    if (typeof n.type === 'string' && !isNodeEmailSafe(n.type)) return false;
    return !Array.isArray(n.children) || n.children.every(ok);
  };
  return ok(root);
}

/** Injected id mint — default in production, a stub in tests (deterministic ids). */
export type MintId = () => string;
export const mintFrameId: MintId = () =>
  `frame-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const SLOT_GAP = 40;
/** A best-effort board slot for the next Frame: cascade right of the most recently added one,
 *  clearing its Preview width (ADR-0013) so wide Frames don't overlap. Not collision-checked — a
 *  user-dragged last Frame can seed an overlap the user then drags away. */
export function nextSlot(frames: EditorFrame[]): { x: number; y: number } {
  const last = frames.at(-1);
  return last ? { x: last.x + last.width + SLOT_GAP, y: last.y } : { x: 40, y: 40 };
}

/** Mint a Frame. Target is FIXED here forever (no setTarget exists — ADR-0006). Pure: returns a new
 *  array + the created Frame (so the caller can select it). */
export function createFrame(
  frames: EditorFrame[],
  target: FrameTarget,
  mint: MintId = mintFrameId,
): { frames: EditorFrame[]; created: EditorFrame } {
  const profile = TARGET_PROFILES[target];
  const slot = nextSlot(frames);
  const created: EditorFrame = {
    id: mint(),
    title: profile.defaultTitle,
    target,
    x: slot.x,
    y: slot.y,
    width: profile.defaultWidth, // Preview width, ADR-0013
    root: profile.makeRoot(),
  };
  return { frames: [...frames, created], created };
}

/** Remove a Frame. Pure; reports the removed Frame so the store can reconcile Selection. Idempotent
 *  on an unknown id (removed === undefined, frames unchanged by reference). */
export function deleteFrame(
  frames: EditorFrame[],
  id: string,
): { frames: EditorFrame[]; removed: EditorFrame | undefined } {
  const removed = frames.find((f) => f.id === id);
  return { frames: removed ? frames.filter((f) => f.id !== id) : frames, removed };
}

/** Reposition a Frame. Pure; a same-position move returns the SAME array (no history churn). */
export function moveFrame(frames: EditorFrame[], id: string, x: number, y: number): EditorFrame[] {
  if (!frames.some((f) => f.id === id && (f.x !== x || f.y !== y))) return frames;
  return frames.map((f) => (f.id === id ? { ...f, x, y } : f));
}

/** Resize a Frame's Preview width (ADR-0013). Pure; a same-width change returns the SAME array (no
 *  history churn), mirroring `moveFrame`. */
export function resizeFrame(frames: EditorFrame[], id: string, width: number): EditorFrame[] {
  if (!frames.some((f) => f.id === id && f.width !== width)) return frames;
  return frames.map((f) => (f.id === id ? { ...f, width } : f));
}
