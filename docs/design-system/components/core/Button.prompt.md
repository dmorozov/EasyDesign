**Button** — the primary clickable action in EasyDesign chrome. Use exactly one accent-filled `primary` per region (e.g. the toolbar's Export); everything else is `secondary`, `ghost`, or `soft`.

```jsx
<Button variant="primary" onClick={onExport}>Export Code</Button>
<Button variant="secondary" icon={<ImportIcon />}>Import</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="danger" size="sm">Reset</Button>
```

Variants: `primary` (indigo fill), `secondary` (white + 1px border), `ghost` (transparent, hover tint), `soft` (indigo tint), `danger` (red text, red-tint hover). Sizes: `sm` 28px · `md` 34px · `lg` 40px. Props: `block`, `icon`, `iconRight`, `disabled`, plus native button attrs.
