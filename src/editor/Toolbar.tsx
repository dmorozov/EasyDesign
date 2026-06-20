import { useEffect, useRef, useState, type ReactElement } from 'react';

import { downloadDocument, readDocumentFile, saveToLocal, toDocument } from './document';
import { useEditor } from './store';

/** The top toolbar: global actions (undo/redo, document export/import/reset) and the
 *  auto-save status. Owns the debounced localStorage persistence. */
export function Toolbar(): ReactElement {
  const frames = useEditor((s) => s.frames);
  const overrides = useEditor((s) => s.themeOverrides);
  const loadDocument = useEditor((s) => s.loadDocument);
  const resetDocument = useEditor((s) => s.resetDocument);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const [status, setStatus] = useState<'saved' | 'saving'>('saved');
  const fileRef = useRef<HTMLInputElement>(null);
  const firstRender = useRef(true);

  // Debounced auto-save. Skip the first render so we don't re-save what we just loaded.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setStatus('saving');
    const timer = setTimeout(() => {
      saveToLocal(toDocument(frames, overrides));
      setStatus('saved');
    }, 400);
    return () => {
      clearTimeout(timer);
    };
  }, [frames, overrides]);

  const onImport = (file: File | undefined) => {
    if (!file) return;
    void readDocumentFile(file).then((doc) => {
      if (doc) loadDocument(doc);
      else window.alert('That file is not a valid EasyDesign document.');
    });
  };

  return (
    <header className="ed-toolbar">
      <span className="ed-brand">◆ EasyDesign</span>
      <div className="ed-toolbar-group">
        <button
          type="button"
          className="ed-tbtn"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl/⌘+Z)"
          aria-label="Undo"
        >
          ↶ Undo
        </button>
        <button
          type="button"
          className="ed-tbtn"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl/⌘+Shift+Z)"
          aria-label="Redo"
        >
          ↷ Redo
        </button>
      </div>

      <span className="ed-toolbar-spacer" />

      <span className="ed-save-status">{status === 'saved' ? 'Saved ✓' : 'Saving…'}</span>
      <div className="ed-toolbar-group">
        <button
          type="button"
          className="ed-tbtn"
          onClick={() => {
            downloadDocument(toDocument(frames, overrides));
          }}
        >
          Export JSON
        </button>
        <button
          type="button"
          className="ed-tbtn"
          onClick={() => {
            fileRef.current?.click();
          }}
        >
          Import
        </button>
        <button
          type="button"
          className="ed-tbtn ed-danger"
          onClick={() => {
            if (window.confirm('Reset to the starter document? This replaces your current work.')) {
              resetDocument();
            }
          }}
        >
          Reset
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          onImport(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </header>
  );
}
