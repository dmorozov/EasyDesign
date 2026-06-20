**PaletteItem** — a draggable component tile/row in the left Component Palette. Users drag these onto the board (or click to add). Greys out with a lock when the component isn't valid for the current frame medium (e.g. Grid in an Email frame).

```jsx
{/* Layout group — square tiles */}
<PaletteItem layout="card" icon={<StackIcon/>} label="Stack" />
<PaletteItem layout="card" icon={<GridIcon/>} label="Grid" disabled disabledNote="Not available in email" />

{/* Content group — full-width rows */}
<PaletteItem icon={<HeadingIcon/>} label="Heading" />
<PaletteItem icon={<ButtonIcon/>} label="Primary Button" dragging />
```

`layout`: `row` (Content) or `card` (Layout). `dragging` shows the drag-ghost. `disabled` + `disabledNote` for medium restrictions. Use a monochrome icon.
