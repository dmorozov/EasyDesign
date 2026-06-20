**Tabs** — horizontal view switcher. Drives the right-rail (Inspector · Design · Export), palette groups (Layout · Content · Assets), and export targets (React · Angular · HTML · Email).

```jsx
<Tabs value={tab} onChange={setTab}
  tabs={[{value:'inspector',label:'Inspector'},{value:'design',label:'Design'},{value:'export',label:'Export'}]} />

<Tabs variant="pill" value={g} onChange={setG} tabs={['Layout','Content','Assets']} />
```

`variant`: `underline` (default) or `pill`. Items support `icon` and a `count` pill.
