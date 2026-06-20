**Switch** — on/off toggle for binary settings (clip content, live preview, snap to grid).

```jsx
<Switch label="Live Preview" defaultChecked />
<Switch checked={dark} onChange={e => setDark(e.target.checked)} />
```

Wraps a native checkbox with `role="switch"`. Use for instant-effect toggles; use Checkbox for form selections.
