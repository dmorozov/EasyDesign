import { type Frame, type Node } from '../ir/types';
import { catalog } from '../theme/design-tokens';

import { isEmailFrameClean, TARGET_PROFILES } from './frames';

// A Frame as the editor holds it: the IR plus its board position and Preview width (so both persist).
export interface EditorFrame {
  id: string;
  title: string;
  target: Frame['target'];
  x: number;
  y: number;
  width: number; // Preview width (ADR-0013) — a canvas affordance, never exported
  root: Node;
}

// The undoable + persisted document body — the shape history snapshots and the store's present share.
export interface DocumentBody {
  frames: EditorFrame[];
  themeOverrides: Record<string, string>;
}

// The full saved document. `version` guards against silently loading an old shape.
export interface EditorDocument extends DocumentBody {
  version: 1;
}

const STORAGE_KEY = 'easydesign:document:v1';

export function toDocument(body: DocumentBody): EditorDocument {
  return { version: 1, ...body };
}

/** What the auto-persist effect should do this run (RP-7), decided PURELY from the last body it saw
 *  (by reference) and the current one — so the React effect that owns the side-effect (debounced save,
 *  saveStatus) stays a thin wrapper and this decision is unit-testable:
 *   - `prime` — the initial mount: record the body but DON'T save (we just loaded it).
 *   - `skip`  — unchanged: React StrictMode's dev double-invoke, or a no-op `set` (same refs).
 *   - `save`  — a genuine edit (the store hands out a NEW body object only on a real change).
 *  Reference identity is the signal — a plain "first run" flag would be consumed by StrictMode's first
 *  pass and let the second pass spuriously save the just-loaded document. */
export type SaveDecision = 'prime' | 'skip' | 'save';
interface SeenBody {
  readonly frames: unknown;
  readonly themeOverrides: unknown;
}
export function decideSave(lastSeen: SeenBody | null, current: SeenBody): SaveDecision {
  if (lastSeen === null) return 'prime';
  if (lastSeen.frames === current.frames && lastSeen.themeOverrides === current.themeOverrides) {
    return 'skip';
  }
  return 'save';
}

function isEditorFrame(value: unknown): value is EditorFrame {
  if (typeof value !== 'object' || value === null) return false;
  const f = value as Record<string, unknown>;
  return (
    typeof f.id === 'string' &&
    typeof f.title === 'string' &&
    (f.target === 'web' || f.target === 'email') &&
    typeof f.x === 'number' &&
    typeof f.y === 'number' &&
    // Preview width (ADR-0013) is back-filled on load, so a pre-width document is still valid.
    (f.width === undefined || typeof f.width === 'number') &&
    typeof f.root === 'object' &&
    f.root !== null &&
    // ADR-0006: an email Frame's tree must be email-safe (the interactive guards can't vet imports).
    isEmailFrameClean(f.target, f.root)
  );
}

export function isEditorDocument(value: unknown): value is EditorDocument {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    Array.isArray(v.frames) &&
    v.frames.every(isEditorFrame) &&
    typeof v.themeOverrides === 'object' &&
    v.themeOverrides !== null
  );
}

// Migrate legacy kebab-keyed themeOverrides ('color-brand') to the canonical dot ref ('color.brand')
// on load, so saves from before the D2 keying-collapse still apply. Unknown keys are dropped.
function withMigratedOverrides(doc: EditorDocument): EditorDocument {
  const themeOverrides: Record<string, string> = {};
  for (const [key, value] of Object.entries(doc.themeOverrides)) {
    if (catalog.get(key))
      themeOverrides[key] = value; // already a dot ref
    else {
      const ref = catalog.fromKebab(key); // legacy kebab -> dot
      if (ref) themeOverrides[ref] = value;
    }
  }
  return { ...doc, themeOverrides };
}

// Back-fill a Frame's Preview width (ADR-0013) for documents saved before it existed: a Frame with no
// width adopts its medium's default. Keeps old saves valid without a version bump (additive + migrated).
function withFrameDefaults(doc: EditorDocument): EditorDocument {
  return {
    ...doc,
    frames: doc.frames.map((f) =>
      typeof f.width === 'number' ? f : { ...f, width: TARGET_PROFILES[f.target].defaultWidth },
    ),
  };
}

/** The single load pipeline: validate (shape + the ADR-0006 email audit, via isEditorDocument) then
 *  migrate (D2 legacy kebab overrides → dot; ADR-0013 Preview-width back-fill). Returns null for
 *  anything that isn't a valid document. */
export function parseDocument(raw: unknown): EditorDocument | null {
  return isEditorDocument(raw) ? withFrameDefaults(withMigratedOverrides(raw)) : null;
}

export function saveToLocal(doc: EditorDocument): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    // ignore quota / private-mode errors — persistence is best-effort
  }
}

export function loadFromLocal(): EditorDocument | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return null;
    const raw: unknown = JSON.parse(stored);
    return parseDocument(raw);
  } catch {
    return null;
  }
}

export function downloadDocument(doc: EditorDocument): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'easydesign.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readDocumentFile(file: File): Promise<EditorDocument | null> {
  try {
    const raw: unknown = JSON.parse(await file.text());
    return parseDocument(raw);
  } catch {
    return null;
  }
}
