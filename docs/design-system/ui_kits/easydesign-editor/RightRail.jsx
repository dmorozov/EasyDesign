/* EasyDesign editor — right rail: Inspector · Design Palette (Theme) · Export. */
const NS = window.EasyDesignDesignSystem_95eb6c;
const { Tabs, PanelHeader, PanelSection, Input, Select, SegmentedControl, Swatch, Button, IconButton, Checkbox } = NS;
const { Icon } = window;

/* ---------------- Inspector ---------------- */
function Inspector({ node, frame, onUpdate, onDelete, onRenameFrame, onFrameMedium }) {
  if (!node && frame) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--accent-soft)', color: 'var(--accent-press)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon.web size={19} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-ink)' }}>{frame.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>frame · {frame.children.length} element{frame.children.length === 1 ? '' : 's'}</div>
          </div>
        </div>
        <PanelSection title="Frame" defaultOpen>
          <Input label="Name" value={frame.name} onChange={(e) => onRenameFrame(frame.id, e.target.value)} />
          <div style={{ height: 14 }} />
          <div className="eds-label" style={{ marginBottom: 8 }}>Medium</div>
          <SegmentedControl value={frame.medium} onChange={(v) => onFrameMedium(frame.id, v)}
            options={[{ value: 'web', label: 'Web', icon: <Icon.web size={14} /> }, { value: 'email', label: 'Email', icon: <Icon.mail size={14} /> }]} />
          <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {frame.medium === 'email' ? 'Only email-safe components are allowed in this frame.' : 'All components are available on web frames.'}
          </div>
        </PanelSection>
        <PanelSection title="Size & Position" defaultOpen>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input label="Width" defaultValue="520" size="sm" trail={<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>px</span>} />
            <Input label="Height" defaultValue="Auto" size="sm" />
          </div>
        </PanelSection>
      </div>
    );
  }
  if (!node) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ width: 46, height: 46, borderRadius: 'var(--radius-lg)', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--text-faint)' }}>
          <Icon.sliders size={22} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-body)', marginBottom: 4 }}>Nothing selected</div>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>Click any element to edit it here, or click a frame’s header to edit the whole frame.</div>
      </div>
    );
  }
  const align = node.align || 'left';
  const isText = node.type === 'heading' || node.type === 'text';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px' }}>
        <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--accent-soft)', color: 'var(--accent-press)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          {React.createElement(Icon[iconFor(node.type)] || Icon.stack, { size: 19 })}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-ink)' }}>{titleFor(node)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>element.{node.type}</div>
        </div>
      </div>

      {(isText) && (
        <PanelSection title="Content" defaultOpen>
          <Input label="Text value" value={node.text} onChange={(e) => onUpdate({ text: e.target.value })} />
          <div style={{ height: 14 }} />
          <div className="eds-label" style={{ marginBottom: 8 }}>Alignment</div>
          <SegmentedControl iconOnly value={align} onChange={(v) => onUpdate({ align: v })}
            options={[
              { value: 'left', ariaLabel: 'Align left', icon: <Icon.alignL size={15} /> },
              { value: 'center', ariaLabel: 'Align center', icon: <Icon.alignC size={15} /> },
              { value: 'right', ariaLabel: 'Align right', icon: <Icon.alignR size={15} /> },
              { value: 'justify', ariaLabel: 'Justify', icon: <Icon.alignJ size={15} /> },
            ]} />
        </PanelSection>
      )}

      {node.type === 'button' && (
        <PanelSection title="Content" defaultOpen>
          <Input label="Label" value={node.text} onChange={(e) => onUpdate({ text: e.target.value })} />
          <div style={{ height: 12 }} />
          <Select label="Variant" value={node.variant} onChange={(e) => onUpdate({ variant: e.target.value })}
            options={[{ value: 'primary', label: 'Primary (filled)' }, { value: 'secondary', label: 'Secondary (outline)' }]} />
        </PanelSection>
      )}

      {node.type === 'image' && (
        <PanelSection title="Content" defaultOpen>
          <Input label="Alt text" value={node.alt} onChange={(e) => onUpdate({ alt: e.target.value })} hint="Describe the image for accessibility & email." />
        </PanelSection>
      )}

      {window.EDS_DATA.isContainer(node.type) && (
        <PanelSection title="Layout" defaultOpen>
          {node.type === 'grid' && (
            <><Select label="Columns" value={String(node.columns || 2)} onChange={(e) => onUpdate({ columns: Number(e.target.value) })}
              options={[{ value: '2', label: '2 columns' }, { value: '3', label: '3 columns' }, { value: '4', label: '4 columns' }]} /><div style={{ height: 12 }} /></>
          )}
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Gap between children is controlled by the shared <strong style={{ color: 'var(--text-body)' }}>Theme spacing</strong>. Edit it in the Design tab.
          </div>
        </PanelSection>
      )}

      <PanelSection title="Size & Position" defaultOpen>
        <div className="eds-label" style={{ marginBottom: 8 }}>Alignment</div>
        <SegmentedControl iconOnly value={align} onChange={(v) => onUpdate({ align: v })}
          options={[
            { value: 'left', ariaLabel: 'Left', icon: <Icon.alignL size={15} /> },
            { value: 'center', ariaLabel: 'Center', icon: <Icon.alignC size={15} /> },
            { value: 'right', ariaLabel: 'Right', icon: <Icon.alignR size={15} /> },
            { value: 'justify', ariaLabel: 'Fill', icon: <Icon.alignJ size={15} /> },
          ]} />
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          <Input label="Width" defaultValue="Fill" size="sm" trail={<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>px</span>} />
          <Input label="Height" defaultValue="Auto" size="sm" />
        </div>
      </PanelSection>

      <div style={{ padding: '12px 16px 20px' }}>
        <Button variant="danger" size="sm" block icon={<Icon.trash size={15} />} onClick={onDelete}>Delete element</Button>
      </div>
    </div>
  );
}

/* ---------------- Design Palette (Theme) ---------------- */
function DesignPalette({ theme, onTheme }) {
  const set = (k) => (v) => onTheme({ ...theme, [k]: v });
  return (
    <div>
      <div style={{ padding: '16px 16px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--accent)', display: 'flex' }}><Icon.palette size={18} /></span>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-ink)' }}>Your style guide</div>
      </div>
      <div style={{ padding: '0 16px 6px', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Edit a value and the whole board re-themes instantly.
      </div>

      <PanelSection title="Brand colors" defaultOpen>
        <Swatch name="Primary" value={theme.primary} onChange={set('primary')} />
        <Swatch name="Background" value={theme.background} onChange={set('background')} />
        <Swatch name="Text" value={theme.text} onChange={set('text')} />
        <Swatch name="Muted text" value={theme.muted} onChange={set('muted')} />
      </PanelSection>

      <PanelSection title="Type scale" defaultOpen>
        <div style={{ display: 'flex', gap: 12 }}>
          <Input label="Heading" type="number" value={theme.headingSize} onChange={(e) => onTheme({ ...theme, headingSize: Number(e.target.value) })} size="sm" trail={<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>px</span>} />
          <Input label="Body" type="number" value={theme.bodySize} onChange={(e) => onTheme({ ...theme, bodySize: Number(e.target.value) })} size="sm" trail={<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>px</span>} />
        </div>
        <div style={{ height: 12 }} />
        <Select label="Font" value={theme.headingFont} onChange={(e) => onTheme({ ...theme, headingFont: e.target.value, bodyFont: e.target.value })}
          options={['Inter', 'Georgia', 'system-ui']} />
      </PanelSection>

      <PanelSection title="Spacing & radius" defaultOpen>
        <ThemeSlider label="Corner radius" value={theme.radius} min={0} max={24} suffix="px" onChange={(v) => onTheme({ ...theme, radius: v })} />
        <div style={{ height: 14 }} />
        <ThemeSlider label="Gap" value={theme.gap} min={4} max={48} suffix="px" onChange={(v) => onTheme({ ...theme, gap: v })} />
      </PanelSection>
    </div>
  );
}

function ThemeSlider({ label, value, min, max, suffix, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-body)' }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)' }} />
    </div>
  );
}

/* ---------------- Export ---------------- */
const TARGETS = [
  { value: 'react', label: 'React', icon: 'react' },
  { value: 'angular', label: 'Angular', icon: 'code' },
  { value: 'html', label: 'HTML', icon: 'web' },
  { value: 'mjml', label: 'Email', icon: 'mail' },
];

function ExportPanel({ frame, theme, target, onTarget }) {
  const [copied, setCopied] = React.useState(false);
  const code = React.useMemo(() => window.EDS_CODE.generate(target, frame, theme), [target, frame, theme]);
  const lines = React.useMemo(() => window.EDS_CODE.highlight(code, target), [code, target]);

  const copy = () => {
    try { navigator.clipboard.writeText(code); } catch (e) {}
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-ink)' }}>Your design, as real code</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>Production-ready. Pick a target and copy.</div>
      </div>
      <div style={{ padding: '12px 16px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
          {TARGETS.map((t) => {
            const active = t.value === target;
            return (
              <button key={t.value} type="button" onClick={() => onTarget(t.value)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 4px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? 'var(--accent-soft)' : 'var(--surface)',
                  color: active ? 'var(--accent-press)' : 'var(--text-muted)', fontWeight: 600, fontSize: 12, transition: 'all 120ms' }}>
                {React.createElement(Icon[t.icon], { size: 17 })}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, margin: '4px 16px 0', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', overflow: 'hidden', background: 'var(--code-bg)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <span style={{ display: 'flex', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }} />
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }} />
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--code-dim)', marginLeft: 4 }}>{fileName(target, frame)}</span>
        </div>
        <pre style={{ margin: 0, flex: 1, overflow: 'auto', padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.65, color: 'var(--code-fg)' }}>
          <code>
            {lines.map((toks, i) => (
              <div key={i} style={{ display: 'flex' }}>
                <span style={{ width: 26, flex: 'none', textAlign: 'right', marginRight: 14, color: 'var(--code-dim)', userSelect: 'none', opacity: 0.6 }}>{i + 1}</span>
                <span style={{ whiteSpace: 'pre' }}>{toks.map((t, j) => <span key={j} style={{ color: codeColor(t.cls) }}>{t.text}</span>)}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
        <Button variant="secondary" size="md" block icon={copied ? <Icon.check size={16} /> : <Icon.copy size={16} />} onClick={copy}>
          {copied ? 'Copied!' : 'Copy code'}
        </Button>
        <Button variant="primary" size="md" block icon={<Icon.download size={16} />} onClick={copy}>Download</Button>
      </div>
    </div>
  );
}

function codeColor(cls) {
  return { cmt: 'var(--code-dim)', str: 'var(--code-str)', tag: 'var(--code-tag)', key: 'var(--code-key)', num: 'var(--code-num)', fg: 'var(--code-fg)' }[cls] || 'var(--code-fg)';
}
function fileName(target, frame) {
  const base = (frame ? frame.name : 'frame').replace(/[^a-z0-9]+/gi, '').replace(/^./, (c) => c.toUpperCase()) || 'Frame';
  return { react: base + '.jsx', angular: dash(frame) + '.component.ts', html: dash(frame) + '.html', mjml: dash(frame) + '.mjml' }[target];
}
function dash(frame) { return (frame ? frame.name : 'frame').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'frame'; }
function iconFor(t) { return { heading: 'heading', text: 'text', button: 'button', image: 'image', row: 'row', column: 'column', stack: 'stack', grid: 'grid' }[t] || 'stack'; }
function titleFor(n) { return { heading: 'Heading', text: 'Text block', button: n.variant === 'primary' ? 'Primary Button' : 'Secondary Button', image: 'Image', row: 'Row', column: 'Column', stack: 'Stack', grid: 'Grid' }[n.type] || n.type; }

Object.assign(window, { EDS_Inspector: Inspector, EDS_DesignPalette: DesignPalette, EDS_ExportPanel: ExportPanel });
