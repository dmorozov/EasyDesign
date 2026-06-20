/* EasyDesign editor — left rail Component Palette (searchable, grouped, draggable). */
const { Input, Tabs, PaletteItem } = window.EasyDesignDesignSystem_95eb6c;
const { Icon } = window;

function Palette({ medium, query, onQuery, group, onGroup, onDragStart, onDragEnd, onAdd }) {
  const { CATALOG } = window.EDS_DATA;
  const match = (item) => item.label.toLowerCase().includes(query.trim().toLowerCase());

  const renderItem = (item, layout) => {
    const blocked = medium === 'email' && !item.email;
    return (
      <PaletteItem
        key={item.type}
        layout={layout}
        icon={React.createElement(Icon[item.icon], { size: layout === 'card' ? 22 : 20 })}
        label={item.label}
        disabled={blocked}
        disabledNote={blocked ? 'Not available in email' : undefined}
        onDragStart={(e) => { e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/eds', item.type); onDragStart(item.type); }}
        onDragEnd={onDragEnd}
        onClick={() => !blocked && onAdd(item.type)}
        title={blocked ? 'Not available in email' : 'Drag onto the board, or click to add'}
      />
    );
  };

  const layoutItems = CATALOG.layout.filter(match);
  const contentItems = CATALOG.content.filter(match);

  return (
    <aside style={{ width: 'var(--rail-left-w)', flex: 'none', background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 14px 10px' }}>
        <Input lead={<Icon.search size={16} />} placeholder="Search components…" value={query} onChange={(e) => onQuery(e.target.value)} size="md" />
      </div>
      <div style={{ padding: '0 14px 12px' }}>
        <Tabs variant="pill" value={group} onChange={onGroup}
          tabs={[{ value: 'all', label: 'All' }, { value: 'layout', label: 'Layout' }, { value: 'content', label: 'Content' }]} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {(group === 'all' || group === 'layout') && layoutItems.length > 0 && (
          <section>
            <div className="eds-label" style={{ marginBottom: 9 }}>Layout</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {layoutItems.map((i) => renderItem(i, 'card'))}
            </div>
          </section>
        )}
        {(group === 'all' || group === 'content') && contentItems.length > 0 && (
          <section>
            <div className="eds-label" style={{ marginBottom: 9 }}>Content</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {contentItems.map((i) => renderItem(i, 'row'))}
            </div>
          </section>
        )}
        {layoutItems.length === 0 && contentItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '28px 8px', color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={{ color: 'var(--text-faint)', display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Icon.search size={22} /></div>
            No components match “{query}”.
          </div>
        )}
        {medium === 'email' && (
          <div style={{ background: 'var(--warning-soft)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 12, color: 'var(--text-body)', lineHeight: 1.45 }}>
            <strong style={{ color: 'var(--warning)' }}>Email mode.</strong> Some layout components are hidden because they aren’t email-safe.
          </div>
        )}
      </div>
    </aside>
  );
}

Object.assign(window, { EDS_Palette: Palette });
