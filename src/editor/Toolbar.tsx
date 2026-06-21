import { useRef, type ReactElement } from 'react';

import { Button, Icon, IconButton } from '../design-system';
import logoGlyph from '../design-system/assets/logo-glyph.svg';

import { downloadDocument, readDocumentFile, toDocument } from './document';
import { useEditor } from './store';
import { useDarkMode } from './useDarkMode';

/** The top toolbar: brand, global actions (undo/redo, document export/import/reset, dark mode,
 *  Export Code) and the auto-save status (rendered from the store's `saveStatus`; the debounced
 *  persistence itself lives in `usePersistence`). */
export function Toolbar(): ReactElement {
  const frames = useEditor((s) => s.frames);
  const overrides = useEditor((s) => s.themeOverrides);
  const loadDocument = useEditor((s) => s.loadDocument);
  const resetDocument = useEditor((s) => s.resetDocument);
  const setRightTab = useEditor((s) => s.setRightTab);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const canUndo = useEditor((s) => s.history.past.length > 0);
  const canRedo = useEditor((s) => s.history.future.length > 0);
  const saveStatus = useEditor((s) => s.saveStatus);
  const { isDark, toggle: toggleDark } = useDarkMode();
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = (file: File | undefined) => {
    if (!file) return;
    void readDocumentFile(file).then((doc) => {
      if (doc) loadDocument(doc);
      else window.alert('That file is not a valid EasyDesign document.');
    });
  };

  return (
    <header className="ed-toolbar">
      <div className="ed-brand">
        <img src={logoGlyph} width={26} height={26} alt="" aria-hidden="true" />
        <span className="ed-wordmark">
          Easy<span className="ed-wordmark-accent">Design</span>
        </span>
      </div>

      <span className="ed-divider" aria-hidden="true" />

      <div className="ed-toolbar-group">
        <IconButton aria-label="Undo" title="Undo (Ctrl/⌘+Z)" onClick={undo} disabled={!canUndo}>
          <Icon.undo />
        </IconButton>
        <IconButton
          aria-label="Redo"
          title="Redo (Ctrl/⌘+Shift+Z)"
          onClick={redo}
          disabled={!canRedo}
        >
          <Icon.redo />
        </IconButton>
      </div>

      <span className="ed-save-status">
        {saveStatus === 'saved' ? (
          <>
            <span className="ed-save-check">
              <Icon.check size={15} />
            </span>
            All changes saved
          </>
        ) : (
          <>
            <span className="ed-spinner" aria-hidden="true" />
            Saving…
          </>
        )}
      </span>

      <span className="ed-toolbar-spacer" />

      <IconButton
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
        onClick={toggleDark}
      >
        {isDark ? <Icon.sun /> : <Icon.moon />}
      </IconButton>

      <span className="ed-divider" aria-hidden="true" />

      <div className="ed-toolbar-group">
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon.upload />}
          onClick={() => fileRef.current?.click()}
        >
          Import
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon.download />}
          onClick={() => {
            downloadDocument(toDocument({ frames, themeOverrides: overrides }));
          }}
        >
          Export JSON
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (window.confirm('Reset to the starter document? This replaces your current work.')) {
              resetDocument();
            }
          }}
        >
          Reset
        </Button>
        <Button
          variant="primary"
          size="md"
          icon={<Icon.code />}
          onClick={() => {
            setRightTab('export');
          }}
        >
          Export Code
        </Button>
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
