import { useEffect, useRef } from 'react';

import { saveToLocal, toDocument } from './document';
import { useEditor } from './store';

/** Auto-persist the document to localStorage, debounced. Lifts the save out of the Toolbar
 *  (a presentation component) into a hook named for its job, and keeps the store + history.ts pure
 *  (no module-load side effects). Mount ONCE, at the editor root. Reports progress via the store's
 *  transient `saveStatus`, which the Toolbar renders. */
export function usePersistence(delay = 400): void {
  const frames = useEditor((s) => s.frames);
  const themeOverrides = useEditor((s) => s.themeOverrides);
  const setSaveStatus = useEditor((s) => s.setSaveStatus);
  // The last body we've seen, by reference. Comparing against it skips the initial load AND React
  // StrictMode's dev double-invoke of effects (a plain first-run flag is consumed by the first pass and
  // would let the second pass spuriously save the just-loaded document).
  const lastSeen = useRef<{ frames: unknown; themeOverrides: unknown } | null>(null);

  useEffect(() => {
    if (lastSeen.current?.frames === frames && lastSeen.current.themeOverrides === themeOverrides) {
      return; // unchanged document (initial mount re-run, or a no-op set)
    }
    const isInitial = lastSeen.current === null;
    lastSeen.current = { frames, themeOverrides };
    if (isInitial) return; // don't re-save the document we just loaded

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveToLocal(toDocument({ frames, themeOverrides }));
      setSaveStatus('saved');
    }, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [frames, themeOverrides, setSaveStatus, delay]);
}
