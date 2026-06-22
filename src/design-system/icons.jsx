/* EasyDesign editor — Lucide-style icon set (2px rounded stroke). Shared across kit files. */
const _s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
function Svg({ children, size = 18, fill, ...p }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...(fill ? { fill, stroke: 'none' } : _s)} {...p}>{children}</svg>
  );
}

const Icon = {
  diamond:  (p) => <Svg {...p}><path d="M12 3l8 8-8 8-8-8 8-8Z"/></Svg>,
  undo:     (p) => <Svg {...p}><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/></Svg>,
  redo:     (p) => <Svg {...p}><path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h1"/></Svg>,
  search:   (p) => <Svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Svg>,
  stack:    (p) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16"/></Svg>,
  row:      (p) => <Svg {...p}><rect x="3" y="6" width="5" height="12" rx="1"/><rect x="10" y="6" width="5" height="12" rx="1"/><rect x="17" y="6" width="4" height="12" rx="1"/></Svg>,
  column:   (p) => <Svg {...p}><rect x="6" y="3" width="12" height="5" rx="1"/><rect x="6" y="10" width="12" height="5" rx="1"/><rect x="6" y="17" width="12" height="4" rx="1"/></Svg>,
  grid:     (p) => <Svg {...p}><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></Svg>,
  heading:  (p) => <Svg {...p}><path d="M6 4v16M18 4v16M6 12h12"/></Svg>,
  text:     (p) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h10"/></Svg>,
  button:   (p) => <Svg {...p}><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 12h6"/></Svg>,
  image:    (p) => <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5L5 20"/></Svg>,
  code:     (p) => <Svg {...p}><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></Svg>,
  layers:   (p) => <Svg {...p}><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/></Svg>,
  settings: (p) => <Svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/></Svg>,
  help:     (p) => <Svg {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01"/></Svg>,
  folder:   (p) => <Svg {...p}><path d="M4 5h5l2 2h9v11H4z"/></Svg>,
  puzzle:   (p) => <Svg {...p}><path d="M9 4a2 2 0 0 1 4 0c0 .7-.3 1 .5 1H17v3.5c0 .8.3.5 1 .5a2 2 0 0 1 0 4c-.7 0-1-.3-1 .5V18h-3.5c-.8 0-.5.3-.5 1a2 2 0 0 1-4 0c0-.7.3-1-.5-1H5v-3.5c0-.8-.3-.5-1-.5a2 2 0 0 1 0-4c.7 0 1 .3 1-.5V5h3.5c.8 0 .5-.3.5-1Z"/></Svg>,
  copy:     (p) => <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></Svg>,
  download: (p) => <Svg {...p}><path d="M12 3v12M7 11l5 5 5-5M5 21h14"/></Svg>,
  upload:   (p) => <Svg {...p}><path d="M12 21V9M7 13l5-5 5 5M5 3h14"/></Svg>,
  plus:     (p) => <Svg {...p}><path d="M12 5v14M5 12h14"/></Svg>,
  trash:    (p) => <Svg {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></Svg>,
  check:    (p) => <Svg {...p}><path d="M5 12l5 5L20 7"/></Svg>,
  hand:     (p) => <Svg {...p}><path d="M9 11V5a1.5 1.5 0 0 1 3 0v6M12 11V4a1.5 1.5 0 0 1 3 0v7M15 11V6a1.5 1.5 0 0 1 3 0v9a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.6L9 13"/></Svg>,
  cursor:   (p) => <Svg {...p}><path d="M5 3l7 17 2.5-7L21 11 5 3Z"/></Svg>,
  zoomIn:   (p) => <Svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></Svg>,
  zoomOut:  (p) => <Svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6"/></Svg>,
  fit:      (p) => <Svg {...p}><path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/></Svg>,
  play:     (p) => <Svg {...p}><path d="M7 4v16l13-8L7 4Z"/></Svg>,
  web:      (p) => <Svg {...p}><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></Svg>,
  mail:     (p) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></Svg>,
  alignL:   (p) => <Svg {...p}><path d="M3 6h18M3 12h12M3 18h15"/></Svg>,
  alignC:   (p) => <Svg {...p}><path d="M3 6h18M6 12h12M5 18h14"/></Svg>,
  alignR:   (p) => <Svg {...p}><path d="M3 6h18M9 12h12M6 18h15"/></Svg>,
  alignJ:   (p) => <Svg {...p}><path d="M3 6h18M3 12h18M3 18h18"/></Svg>,
  dots:     (p) => <Svg {...p}><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></Svg>,
  grip:     (p) => <Svg {...p}><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></Svg>,
  sliders:  (p) => <Svg {...p}><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="15" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="17" cy="18" r="2"/></Svg>,
  palette:  (p) => <Svg {...p}><path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-.4-.2-.7-.4-1-.2-.2-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/></Svg>,
  react:    (p) => <Svg {...p}><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></Svg>,
  share:    (p) => <Svg {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></Svg>,
  sun:      (p) => <Svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></Svg>,
  moon:     (p) => <Svg {...p}><path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z"/></Svg>,
};

export { Icon, Svg };
