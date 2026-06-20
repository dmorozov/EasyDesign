**Card** — neutral surface container with a soft 1px border and gentle shadow. The base building block for panels, palette items, and frame bodies.

```jsx
<Card pad="md">…</Card>
<Card variant="sunken" pad="lg">Empty-state content</Card>
<Card interactive selected>Selected swatch row</Card>
```

`variant`: `default` (white + shadow), `sunken` (tinted, no shadow), `flat` (white, no shadow). `pad`: `sm`/`md`/`lg` or `false`. `interactive` adds hover lift; `selected` adds the accent ring.
