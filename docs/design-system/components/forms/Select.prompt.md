**Select** — native dropdown styled to match chrome controls. Used in the Inspector (variant, rounding).

```jsx
<Select label="Variant" options={['Filled','Outline','Ghost']} />
<Select label="Rounding" options={[{value:'8',label:'8px'},{value:'12',label:'12px'}]} size="sm" />
```

Pass `options` (strings or `{value,label}`) or your own `<option>` children. `size` `sm`/`md`.
