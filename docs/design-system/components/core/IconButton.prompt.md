**IconButton** — square, label-less control for toolbar and canvas actions (undo/redo, zoom, settings, pan). Always pass `aria-label`.

```jsx
<IconButton aria-label="Undo"><UndoIcon /></IconButton>
<IconButton aria-label="Pan" active><HandIcon /></IconButton>
<IconButton aria-label="Fit to screen" bordered size="lg"><FitIcon /></IconButton>
```

Sizes `sm`/`md`/`lg`. `bordered` for floating white controls; `active` for toggled (indigo tint). Icon sizes itself to `1em`.
