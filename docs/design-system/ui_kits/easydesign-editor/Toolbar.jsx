/* EasyDesign editor — slim top toolbar. */
const { Button, IconButton, Badge } = window.EasyDesignDesignSystem_95eb6c;
const { Icon } = window;

function Toolbar({ saveState, canUndo, canRedo, onUndo, onRedo, onExport, onImport, onReset, dark, onToggleDark }) {
  return (
    <header style={{
      height: 'var(--toolbar-h)', display: 'flex', alignItems: 'center', gap: 14,
      padding: '0 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flex: 'none', zIndex: 30,
    }}>
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <img src="../../assets/logo-glyph.svg" width="26" height="26" alt="" style={{ display: 'block' }} />
        <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-ink)' }}>
          Easy<span style={{ color: 'var(--accent)' }}>Design</span>
        </span>
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

      {/* Undo / Redo */}
      <div style={{ display: 'flex', gap: 2 }}>
        <IconButton aria-label="Undo" onClick={onUndo} disabled={!canUndo}><Icon.undo size={17} /></IconButton>
        <IconButton aria-label="Redo" onClick={onRedo} disabled={!canRedo}><Icon.redo size={17} /></IconButton>
      </div>

      {/* Auto-save status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 4, fontSize: 13, color: 'var(--text-muted)', minWidth: 130 }}>
        {saveState === 'saving' ? (
          <><Spinner /> <span>Saving…</span></>
        ) : (
          <><span style={{ color: 'var(--success)', display: 'flex' }}><Icon.check size={15} /></span> <span>All changes saved</span></>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <Button variant="ghost" size="sm" icon={<Icon.upload size={15} />} onClick={onImport}>Import</Button>
      <Button variant="ghost" size="sm" icon={<Icon.share size={15} />}>Share</Button>
      <Button variant="danger" size="sm" onClick={onReset}>Reset</Button>
      <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
      <IconButton aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={onToggleDark}>
        {dark ? <Icon.sun size={17} /> : <Icon.moon size={17} />}
      </IconButton>
      <Button variant="primary" size="md" icon={<Icon.code size={16} />} onClick={onExport}>Export Code</Button>
    </header>
  );
}

function Spinner() {
  return (
    <span style={{ width: 14, height: 14, display: 'inline-block', border: '2px solid var(--accent-soft-2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'eds-spin .7s linear infinite' }} />
  );
}

Object.assign(window, { EDS_Toolbar: Toolbar });
