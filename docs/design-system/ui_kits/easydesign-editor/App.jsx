/* EasyDesign editor — App: state, tree ops, drag-and-drop, undo/redo, zoom. */
const NS = window.EasyDesignDesignSystem_95eb6c;
const { IconButton, Badge, Button } = NS;
const { Icon, EDS_DATA, EDS_Toolbar, EDS_Palette, EDS_Frame, EDS_Inspector, EDS_DesignPalette, EDS_ExportPanel } = window;
const { makeNode, isContainer, sampleFrame, DEFAULT_THEME, uid } = EDS_DATA;

const clone = (o) => JSON.parse(JSON.stringify(o));

/* ---- immutable-ish tree ops on a frame ---- */
function nodeAtPath(children, path) {
  let list = children, node = null;
  for (const i of path) { node = list[i]; if (!node) return null; list = node.children || []; }
  return node;
}
function updateById(children, id, patch) {
  return children.map((n) => {
    if (n.id === id) return { ...n, ...patch };
    if (n.children) return { ...n, children: updateById(n.children, id, patch) };
    return n;
  });
}
function removeById(children, id) {
  return children.filter((n) => n.id !== id).map((n) => (n.children ? { ...n, children: removeById(n.children, id) } : n));
}
function insertAt(frame, path, position, newNode) {
  const f = clone(frame);
  if (position === 'inside') {
    const target = nodeAtPath(f.children, path);
    if (target && isContainer(target.type)) { target.children = target.children || []; target.children.push(newNode); }
    else { f.children.push(newNode); }
    return f;
  }
  // before / after relative to node at path
  const parentPath = path.slice(0, -1);
  let list = f.children;
  for (const i of parentPath) list = list[i].children;
  const idx = path[path.length - 1];
  list.splice(position === 'before' ? idx : idx + 1, 0, newNode);
  return f;
}

function App() {
  const [frames, setFrames] = React.useState([sampleFrame()]);
  const [theme, setTheme] = React.useState(DEFAULT_THEME);
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedFrameId, setSelectedFrameId] = React.useState(null);
  const [dark, setDark] = React.useState(false);
  const [tab, setTab] = React.useState('inspector');
  const [target, setTarget] = React.useState('react');
  const [query, setQuery] = React.useState('');
  const [group, setGroup] = React.useState('all');
  const [zoom, setZoom] = React.useState(100);
  const [tool, setTool] = React.useState('cursor');
  const [save, setSave] = React.useState('saved');
  const [dragType, setDragType] = React.useState(null);
  const [drop, setDrop] = React.useState(null); // {frameId, key, position}
  const hist = React.useRef({ past: [], future: [] });
  const saveTimer = React.useRef(null);

  const activeFrame = frames[0];
  const medium = activeFrame ? activeFrame.medium : 'web';
  const selectedFrame = React.useMemo(() => frames.find((f) => f.id === selectedFrameId) || null, [frames, selectedFrameId]);

  const selectElement = (id) => { setSelectedId(id); if (id) setSelectedFrameId(null); };
  const selectFrame = (id) => { setSelectedFrameId(id); setSelectedId(null); setTab('inspector'); };
  const toggleDark = () => { const v = !dark; setDark(v); document.documentElement.dataset.theme = v ? 'dark' : ''; };

  const selectedNode = React.useMemo(() => {
    if (!selectedId) return null;
    const find = (list) => { for (const n of list) { if (n.id === selectedId) return n; if (n.children) { const r = find(n.children); if (r) return r; } } return null; };
    return activeFrame ? find(activeFrame.children) : null;
  }, [selectedId, frames]);

  function commit(nextFrames, nextTheme) {
    hist.current.past.push({ frames: clone(frames), theme: clone(theme) });
    if (hist.current.past.length > 50) hist.current.past.shift();
    hist.current.future = [];
    if (nextFrames) setFrames(nextFrames);
    if (nextTheme) setTheme(nextTheme);
    flashSave();
  }
  function flashSave() {
    setSave('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSave('saved'), 900);
  }
  function undo() {
    const p = hist.current.past.pop(); if (!p) return;
    hist.current.future.push({ frames: clone(frames), theme: clone(theme) });
    setFrames(p.frames); setTheme(p.theme); flashSave();
  }
  function redo() {
    const n = hist.current.future.pop(); if (!n) return;
    hist.current.past.push({ frames: clone(frames), theme: clone(theme) });
    setFrames(n.frames); setTheme(n.theme); flashSave();
  }

  /* ---- mutations ---- */
  const updateFrame0 = (fn) => commit(frames.map((f, i) => (i === 0 ? fn(f) : f)));
  const updateNode = (patch) => updateFrame0((f) => ({ ...f, children: updateById(f.children, selectedId, patch) }));
  const deleteNode = () => { updateFrame0((f) => ({ ...f, children: removeById(f.children, selectedId) })); setSelectedId(null); };
  const renameFrame = (id, name) => commit(frames.map((f) => (f.id === id ? { ...f, name } : f)));
  const setFrameMedium = (id, m) => commit(frames.map((f) => (f.id === id ? { ...f, medium: m } : f)));
  const setThemeCommit = (t) => commit(null, t);
  const addNew = (type) => {
    const node = makeNode(type);
    updateFrame0((f) => ({ ...f, children: [...f.children, node] }));
    setSelectedId(node.id); setTab('inspector');
  };
  const newFrame = () => { const f = { id: uid(), name: `Frame ${frames.length + 1}`, medium: 'web', children: [] }; commit([...frames, f]); };
  const reset = () => { if (!window.confirm('Start over with an empty canvas? This clears all frames.')) return; commit([{ id: uid(), name: 'Untitled Frame', medium: 'web', children: [] }]); setSelectedId(null); };

  /* ---- drag handlers factory (per frame) ---- */
  const keyOf = (path) => path.join('-');
  function makeHandlers(frame) {
    const overNode = (node, path) => (e) => {
      if (!dragType) return;
      e.preventDefault(); e.stopPropagation();
      const r = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientY - r.top) < r.height / 2 ? 'before' : 'after';
      setDrop({ frameId: frame.id, key: keyOf(path), position: pos });
    };
    const overContainer = (node, path) => (e) => {
      if (!dragType || !isContainer(node.type)) return;
      e.preventDefault(); e.stopPropagation();
      setDrop({ frameId: frame.id, key: keyOf(path), position: 'inside' });
    };
    const doDrop = (e) => {
      if (!dragType || !drop || drop.frameId !== frame.id) { setDrop(null); return; }
      e.preventDefault(); e.stopPropagation();
      const path = drop.key === '' ? [0] : drop.key.split('-').map(Number);
      const node = makeNode(dragType);
      const blocked = frame.medium === 'email' && (node.type === 'grid');
      if (!blocked) {
        const nf = insertAt(frame, frame.children.length ? path : [0], frame.children.length ? drop.position : 'inside', node);
        commit(frames.map((f) => (f.id === frame.id ? nf : f)));
        setSelectedId(node.id);
      }
      setDrop(null); setDragType(null);
    };
    return {
      node: (node, path) => ({ onDragOver: overNode(node, path), onDrop: doDrop }),
      container: (node, path) => ({ onDragOver: overContainer(node, path), onDrop: doDrop }),
      frameBody: () => ({ onDragOver: (e) => { if (dragType && frame.children.length === 0) { e.preventDefault(); setDrop({ frameId: frame.id, key: '', position: 'inside' }); } }, onDrop: doDrop }),
      indicatorFor: (path) => (drop && drop.frameId === frame.id && drop.key === keyOf(path) ? drop.position : (drop && drop.frameId === frame.id && drop.key === '' && keyOf(path) === '0' && frame.children.length === 0 ? 'inside' : null)),
    };
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--app-bg)' }}>
      <EDS_Toolbar saveState={save} canUndo={hist.current.past.length > 0} canRedo={hist.current.future.length > 0}
        onUndo={undo} onRedo={redo} onExport={() => setTab('export')} onImport={() => {}} onReset={reset}
        dark={dark} onToggleDark={toggleDark} />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <EDS_Palette medium={medium} query={query} onQuery={setQuery} group={group} onGroup={setGroup}
          onDragStart={setDragType} onDragEnd={() => { setDragType(null); setDrop(null); }} onAdd={addNew} />

        {/* Center canvas */}
        <main className="eds-dotgrid" style={{ flex: 1, position: 'relative', overflow: 'auto' }}
          onDragOver={(e) => { if (dragType) e.preventDefault(); }}>
          <div style={{ minWidth: 'max-content', minHeight: '100%', padding: '56px 64px 120px', display: 'flex', gap: 44, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 44, transform: `scale(${zoom / 100})`, transformOrigin: 'top left', transition: 'transform 150ms var(--ease-out)' }}>
              {frames.map((f) => (
                <EDS_Frame key={f.id} frame={f} theme={theme} selectedId={selectedId} selectedFrameId={selectedFrameId}
                  onSelect={selectElement} onSelectFrame={selectFrame}
                  onRename={renameFrame} onMedium={setFrameMedium} dragHandlers={makeHandlers(f)} />
              ))}
              <button onClick={newFrame} style={{ alignSelf: 'flex-start', marginTop: 4, width: 200, minHeight: 160, border: '1.5px dashed var(--border-strong)', borderRadius: 'var(--radius-xl)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 13.5, fontWeight: 600 }}>
                <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon.plus size={20} /></span>
                New Frame
              </button>
            </div>
          </div>

          {/* Floating drag ghost */}
          {dragType && <DragGhost type={dragType} />}

          {/* Floating zoom / tool control */}
          <ZoomBar zoom={zoom} setZoom={setZoom} tool={tool} setTool={setTool} />
        </main>

        {/* Right rail */}
        <aside style={{ width: 'var(--rail-right-w)', flex: 'none', background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-ink)' }}>
              {tab === 'inspector' ? 'Properties' : tab === 'design' ? 'Design Palette' : 'Export'}
            </div>
            <IconButton aria-label="Panel options" size="sm"><Icon.dots size={16} /></IconButton>
          </div>
          <div style={{ padding: '8px 16px 0' }}>
            <NS.Tabs value={tab} onChange={setTab}
              tabs={[{ value: 'inspector', label: 'Inspector' }, { value: 'design', label: 'Design' }, { value: 'export', label: 'Export' }]} />
          </div>
          <div style={{ flex: 1, overflowY: tab === 'export' ? 'hidden' : 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {tab === 'inspector' && <EDS_Inspector node={selectedNode} frame={selectedFrame} onUpdate={updateNode} onDelete={deleteNode} onRenameFrame={renameFrame} onFrameMedium={setFrameMedium} />}
            {tab === 'design' && <EDS_DesignPalette theme={theme} onTheme={setThemeCommit} />}
            {tab === 'export' && <EDS_ExportPanel frame={activeFrame} theme={theme} target={target} onTarget={setTarget} />}
          </div>
        </aside>
      </div>
    </div>
  );
}

function DragGhost({ type }) {
  const [pos, setPos] = React.useState({ x: -999, y: -999 });
  React.useEffect(() => {
    const m = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('dragover', m);
    return () => window.removeEventListener('dragover', m);
  }, []);
  const label = { stack: 'Stack', row: 'Row', column: 'Column', grid: 'Grid', heading: 'Heading', text: 'Text', button: 'Primary Button', button2: 'Secondary Button', image: 'Image' }[type] || type;
  const icon = { button2: 'button' }[type] || type;
  return (
    <div style={{ position: 'fixed', left: pos.x + 14, top: pos.y + 12, pointerEvents: 'none', zIndex: 100, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lift)', fontSize: 13, fontWeight: 600, color: 'var(--text-ink)' }}>
      <span style={{ color: 'var(--accent-press)', display: 'flex' }}>{React.createElement(Icon[icon] || Icon.stack, { size: 16 })}</span>
      {label}
    </div>
  );
}

function ZoomBar({ zoom, setZoom, tool, setTool }) {
  return (
    <div style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 4, padding: 5, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-lg)' }}>
      <IconButton aria-label="Cursor" active={tool === 'cursor'} onClick={() => setTool('cursor')}><Icon.cursor size={16} /></IconButton>
      <IconButton aria-label="Pan" active={tool === 'pan'} onClick={() => setTool('pan')}><Icon.hand size={16} /></IconButton>
      <span style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />
      <IconButton aria-label="Zoom out" onClick={() => setZoom(Math.max(25, zoom - 10))}><Icon.zoomOut size={16} /></IconButton>
      <span style={{ minWidth: 46, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text-body)', fontVariantNumeric: 'tabular-nums' }}>{zoom}%</span>
      <IconButton aria-label="Zoom in" onClick={() => setZoom(Math.min(200, zoom + 10))}><Icon.zoomIn size={16} /></IconButton>
      <span style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />
      <IconButton aria-label="Fit to screen" onClick={() => setZoom(100)}><Icon.fit size={16} /></IconButton>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
