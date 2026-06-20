/* EasyDesign editor — the Board: dot-grid canvas, frames, theme-driven node renderer,
   selection outline + drag handle, drop indicators, empty states. */
const { Badge, SegmentedControl } = window.EasyDesignDesignSystem_95eb6c;
const { Icon } = window;

/* ---- Render one design node using the USER theme (not chrome tokens) ---- */
function NodeView({ node, theme, selectedId, onSelect, dragHandlers, path }) {
  const sel = node.id === selectedId;
  const t = theme;
  const stop = (e) => { e.stopPropagation(); onSelect(node.id); };

  let inner = null;
  if (node.type === 'heading') {
    inner = <h1 style={{ margin: 0, color: t.text, fontFamily: `${t.headingFont}, sans-serif`, fontSize: t.headingSize, fontWeight: 700, lineHeight: 1.1, textAlign: node.align, letterSpacing: '-0.02em' }}>{node.text}</h1>;
  } else if (node.type === 'text') {
    inner = <p style={{ margin: 0, color: t.muted, fontFamily: `${t.bodyFont}, sans-serif`, fontSize: t.bodySize, lineHeight: 1.6, textAlign: node.align }}>{node.text}</p>;
  } else if (node.type === 'button') {
    const primary = node.variant === 'primary';
    inner = <button style={{
      background: primary ? t.primary : 'transparent',
      color: primary ? '#fff' : t.text,
      border: primary ? 'none' : `1px solid ${t.text}22`,
      borderRadius: t.radius, padding: '12px 22px', fontWeight: 600, fontSize: 15,
      fontFamily: `${t.bodyFont}, sans-serif`, cursor: 'pointer',
    }}>{node.text}</button>;
  } else if (node.type === 'image') {
    inner = (
      <div style={{ width: '100%', aspectRatio: '16/7', borderRadius: t.radius, overflow: 'hidden', background: `linear-gradient(135deg, ${t.primary}22, ${t.primary}0d)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${t.primary}40` }}>
        <span style={{ color: t.primary, opacity: 0.7, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
          <Icon.image size={26} /> {node.alt || 'Image'}
        </span>
      </div>
    );
  } else if (window.EDS_DATA.isContainer(node.type)) {
    const dir = node.type === 'row' ? 'row' : 'column';
    const isGrid = node.type === 'grid';
    const empty = !node.children || node.children.length === 0;
    inner = (
      <div
        style={{
          display: isGrid ? 'grid' : 'flex',
          gridTemplateColumns: isGrid ? `repeat(${node.columns || 2}, 1fr)` : undefined,
          flexDirection: dir, gap: t.gap, width: '100%',
          minHeight: empty ? 64 : undefined,
          ...(empty ? { border: `1.5px dashed ${t.text}22`, borderRadius: t.radius, alignItems: 'center', justifyContent: 'center' } : {}),
        }}
        {...dragHandlers.container(node, path)}
      >
        {empty
          ? <span style={{ color: t.muted, fontSize: 13, opacity: 0.7 }}>Drop components inside this {node.type}</span>
          : node.children.map((c, i) => (
              <NodeView key={c.id} node={c} theme={theme} selectedId={selectedId} onSelect={onSelect} dragHandlers={dragHandlers} path={[...path, i]} />
            ))}
      </div>
    );
  }

  return (
    <div
      className="eds-node"
      onClick={stop}
      style={{ position: 'relative', outline: sel ? '2px solid var(--selection)' : '2px solid transparent', outlineOffset: 2, borderRadius: 3, transition: 'outline-color 120ms' }}
      {...dragHandlers.node(node, path)}
    >
      {inner}
      {sel && (
        <span style={{ position: 'absolute', top: -11, left: -2, height: 20, padding: '0 7px', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--selection)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 10, fontWeight: 600, letterSpacing: '.02em', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ display: 'flex', cursor: 'grab' }}><Icon.dots size={12} /></span>
          {labelFor(node)}
        </span>
      )}
      <DropLine show={dragHandlers.indicatorFor(path)} />
    </div>
  );
}

function labelFor(n) {
  return ({ heading: 'Heading', text: 'Text', button: n.variant === 'primary' ? 'Primary Button' : 'Secondary Button', image: 'Image', row: 'Row', column: 'Column', stack: 'Stack', grid: 'Grid' })[n.type] || n.type;
}

function DropLine({ show }) {
  if (!show) return null;
  const horizontal = show === 'before' || show === 'after';
  if (!horizontal) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, [show === 'before' ? 'top' : 'bottom']: -7, height: 3, background: 'var(--drop-indicator)', borderRadius: 3, pointerEvents: 'none', zIndex: 5 }}>
      <span style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 9, height: 9, borderRadius: '50%', background: 'var(--drop-indicator)' }} />
    </div>
  );
}

/* ---- One frame (card on the canvas) ---- */
function Frame({ frame, theme, selectedId, selectedFrameId, onSelect, onSelectFrame, onRename, onMedium, dragHandlers }) {
  const empty = frame.children.length === 0;
  const isSel = frame.id === selectedFrameId;
  return (
    <div style={{ position: 'relative', flex: 'none' }}>
      {isSel && (
        <span style={{ position: 'absolute', top: -26, left: 0, display: 'inline-flex', alignItems: 'center', gap: 5, height: 20, padding: '0 8px', background: 'var(--selection)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 600, letterSpacing: '.01em', boxShadow: 'var(--shadow-sm)', whiteSpace: 'nowrap' }}>
          <span style={{ display: 'flex' }}><Icon.web size={12} /></span>{frame.name}
        </span>
      )}
    <div style={{ width: 520, background: 'var(--surface)', borderRadius: 'var(--radius-xl)', boxShadow: isSel ? 'var(--shadow-frame), 0 0 0 2px var(--selection)' : 'var(--shadow-frame)', border: '1px solid var(--border-faint)', overflow: 'hidden', transition: 'box-shadow 150ms var(--ease-out)' }}>
      <header
        onClick={(e) => { e.stopPropagation(); onSelectFrame(frame.id); }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-faint)', background: isSel ? 'var(--accent-soft)' : 'var(--surface)', cursor: 'pointer', transition: 'background 150ms' }}>
        <span style={{ color: isSel ? 'var(--accent-press)' : 'var(--text-faint)', display: 'flex' }}><Icon.web size={16} /></span>
        <input value={frame.name} onClick={(e) => e.stopPropagation()} onChange={(e) => onRename(frame.id, e.target.value)}
          style={{ flex: 1, border: 'none', background: 'transparent', font: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--text-ink)', outline: 'none', padding: '2px 4px', borderRadius: 4 }} />
        <span onClick={(e) => e.stopPropagation()} style={{ display: 'flex' }}>
        <SegmentedControl value={frame.medium} onChange={(v) => onMedium(frame.id, v)}
          options={[{ value: 'web', label: 'Web', icon: <Icon.web size={14} /> }, { value: 'email', label: 'Email', icon: <Icon.mail size={14} /> }]} />
        </span>
      </header>
      <div
        onClick={() => onSelect(null)}
        {...dragHandlers.frameBody(frame)}
        style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: theme.gap, minHeight: 160, background: theme.background }}
      >
        {empty ? (
          <div style={{ flex: 1, minHeight: 150, border: '1.5px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)', background: dragHandlers.indicatorFor([0]) === 'inside' ? 'var(--drop-inside)' : 'transparent', borderColor: dragHandlers.indicatorFor([0]) === 'inside' ? 'var(--drop-indicator)' : 'var(--border-strong)' }}>
            <span style={{ color: 'var(--accent)', opacity: 0.7 }}><Icon.plus size={26} /></span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-body)' }}>Drag a component here to start</span>
            <span style={{ fontSize: 12.5 }}>Anything from the left panel works.</span>
          </div>
        ) : frame.children.map((c, i) => (
          <NodeView key={c.id} node={c} theme={theme} selectedId={selectedId} onSelect={onSelect} dragHandlers={dragHandlers} path={[i]} />
        ))}
      </div>
    </div>
    </div>
  );
}

Object.assign(window, { EDS_Frame: Frame, EDS_NodeView: NodeView });
