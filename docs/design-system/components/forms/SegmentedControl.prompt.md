**SegmentedControl** — compact pill of mutually-exclusive options. Used for the frame medium switch (Web ↔ Email) and Inspector alignment row.

```jsx
<SegmentedControl value={medium} onChange={setMedium}
  options={[{value:'web',label:'Web',icon:<WebIcon/>},{value:'email',label:'Email',icon:<MailIcon/>}]} />

<SegmentedControl iconOnly value={align} onChange={setAlign}
  options={[{value:'left',icon:<AlignLeft/>,ariaLabel:'Align left'}, …]} />
```

`iconOnly` renders icon-only square segments. Each option can be a string or `{value,label,icon,ariaLabel,disabled}`.
