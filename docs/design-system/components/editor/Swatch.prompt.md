**Swatch / SwatchChip** — the Design Palette (Theme) color controls. The chip opens the native color picker; changing it re-themes the whole board. These edit the **user's** design theme, never the editor chrome.

```jsx
<Swatch name="Primary" value={theme.primary} onChange={hex => setTheme({...theme, primary:hex})} />
<Swatch name="Background" value={theme.bg} onChange={…} />

<div style={{display:'flex',gap:8}}>
  <SwatchChip value="#5b5bd6" title="Indigo" selected />
  <SwatchChip value="#1f9d57" title="Green" />
</div>
```

`Swatch` is a full row (chip + name + hex). `SwatchChip` is a compact square for grids.
