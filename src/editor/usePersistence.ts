import { useEffect, useRef } from 'react';

import { decideSave, saveToLocal, toDocument } from './document';
import { useEditor } from './store';

/** Auto-persist the document to localStorage, debounced. Lifts the save out of the Toolbar
 *  (a presentation component) into a hook named for its job, and keeps the store + history.ts pure
 *  (no module-load side effects). Mount ONCE, at the editor root. Reports progress via the store's
 *  transient `saveStatus`, which the Toolbar renders. The "should I save?" decision is pure
 *  (`decideSave`, RP-7) — this hook is the thin effect wrapper that runs the debounced side-effect. */
export function usePersistence(delay = 400): void {
  const frames = useEditor((s) => s.frames);
  const themeOverrides = useEditor((s) => s.themeOverrides);
  const setSaveStatus = useEditor((s) => s.setSaveStatus);
  // The last body we've seen, by reference (the input to `decideSave`). Comparing against it skips the
  // initial load AND React StrictMode's dev double-invoke of effects.
  const lastSeen = useRef<{ frames: unknown; themeOverrides: unknown } | null>(null);

  useEffect(() => {
    const body = { frames, themeOverrides };
    const decision = decideSave(lastSeen.current, body);
    if (decision === 'skip') return; // unchanged document (initial mount re-run, or a no-op set)
    lastSeen.current = body;
    if (decision === 'prime') return; // don't re-save the document we just loaded

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveToLocal(toDocument(body));
      setSaveStatus('saved');
    }, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [frames, themeOverrides, setSaveStatus, delay]);
}
