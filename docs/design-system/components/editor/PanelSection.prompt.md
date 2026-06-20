**PanelSection / PanelHeader** — structure for the right rail.

`PanelHeader` is the fixed top block of a panel (title + optional subtitle + action). `PanelSection` is a collapsible section with an ALL-CAPS micro-label header (Alignment, Size & Position, Colors, Typography).

```jsx
<PanelHeader title="Properties" subtitle="No selection" action={<IconButton aria-label="Options"><DotsIcon/></IconButton>} />

<PanelSection title="Size & Position" defaultOpen>
  <Input label="Width" defaultValue="320" />
</PanelSection>
<PanelSection title="Colors" action={<IconButton aria-label="Add swatch"><PlusIcon/></IconButton>}>…</PanelSection>
```

`PanelSection` is controlled (`open`+`onToggle`) or uncontrolled (`defaultOpen`); set `collapsible={false}` for a static section.
