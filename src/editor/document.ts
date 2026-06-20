import { type Frame, type Node } from '../ir/types';

// A Frame as the editor holds it: the IR plus its board position (so layout persists).
export interface EditorFrame {
  id: string;
  title: string;
  target: Frame['target'];
  x: number;
  y: number;
  root: Node;
}

// The full saved document. `version` guards against silently loading an old shape.
export interface EditorDocument {
  version: 1;
  frames: EditorFrame[];
  themeOverrides: Record<string, string>;
}

const STORAGE_KEY = 'easydesign:document:v1';

export function toDocument(
  frames: EditorFrame[],
  themeOverrides: Record<string, string>,
): EditorDocument {
  return { version: 1, frames, themeOverrides };
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
    typeof f.root === 'object' &&
    f.root !== null
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

export function saveToLocal(doc: EditorDocument): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    // ignore quota / private-mode errors — persistence is best-effort
  }
}

export function loadFromLocal(): EditorDocument | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isEditorDocument(parsed) ? parsed : null;
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
    const parsed: unknown = JSON.parse(await file.text());
    return isEditorDocument(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
