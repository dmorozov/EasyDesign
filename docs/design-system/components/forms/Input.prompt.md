**Input** — labeled single-line text field. The workhorse of the Inspector (text content, alt text, width/height).

```jsx
<Input label="Text Value" defaultValue="Get Started" />
<Input label="Width" defaultValue="320" trail={<span style={{fontSize:12}}>px</span>} size="sm" />
<Input lead={<SearchIcon />} placeholder="Search components…" />
```

Props: `label`, `hint`, `lead`/`trail` adornments, `size` (`sm`/`md`), `invalid`, plus native input attrs.
