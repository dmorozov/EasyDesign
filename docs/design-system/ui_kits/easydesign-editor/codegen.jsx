/* EasyDesign editor — code generators (React / Angular / HTML / MJML) + tiny syntax highlighter. */

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
const pad = (n) => '  '.repeat(n);

/* ---------- React (JSX + inline theme) ---------- */
function genReact(frame, theme) {
  const t = theme;
  const node = (n, d) => {
    const p = pad(d);
    switch (n.type) {
      case 'heading': return `${p}<h1 style={s.heading}>${esc(n.text)}</h1>`;
      case 'text':    return `${p}<p style={s.text}>${esc(n.text)}</p>`;
      case 'button':  return `${p}<button style={s.${n.variant === 'primary' ? 'btnPrimary' : 'btnSecondary'}}>${esc(n.text)}</button>`;
      case 'image':   return `${p}<img src="/placeholder.jpg" alt="${esc(n.alt)}" style={s.image} />`;
      case 'row':     return `${p}<div style={s.row}>\n${(n.children || []).map((c) => node(c, d + 1)).join('\n')}\n${p}</div>`;
      case 'column':
      case 'stack':   return `${p}<div style={s.stack}>\n${(n.children || []).map((c) => node(c, d + 1)).join('\n')}\n${p}</div>`;
      case 'grid':    return `${p}<div style={s.grid}>\n${(n.children || []).map((c) => node(c, d + 1)).join('\n')}\n${p}</div>`;
      default:        return '';
    }
  };
  const body = frame.children.map((c) => node(c, 3)).join('\n');
  return `export function ${cn(frame.name)}() {
  return (
    <section style={s.frame}>
${body}
    </section>
  );
}

const s = {
  frame: { background: '${t.background}', display: 'flex', flexDirection: 'column', gap: ${t.gap}, padding: 32, fontFamily: '${t.bodyFont}, sans-serif' },
  heading: { color: '${t.text}', fontSize: ${t.headingSize}, fontWeight: 700, lineHeight: 1.1, margin: 0 },
  text: { color: '${t.muted}', fontSize: ${t.bodySize}, lineHeight: 1.6, margin: 0 },
  btnPrimary: { background: '${t.primary}', color: '#fff', border: 'none', borderRadius: ${t.radius}, padding: '12px 20px', fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { background: 'transparent', color: '${t.text}', border: '1px solid ${t.text}22', borderRadius: ${t.radius}, padding: '12px 20px', fontWeight: 600, cursor: 'pointer' },
  image: { width: '100%', borderRadius: ${t.radius}, display: 'block' },
  row: { display: 'flex', gap: ${t.gap} },
  stack: { display: 'flex', flexDirection: 'column', gap: ${t.gap} },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: ${t.gap} },
};`;
}

/* ---------- Angular (component template) ---------- */
function genAngular(frame, theme) {
  const t = theme;
  const node = (n, d) => {
    const p = pad(d);
    switch (n.type) {
      case 'heading': return `${p}<h1 class="heading">${esc(n.text)}</h1>`;
      case 'text':    return `${p}<p class="text">${esc(n.text)}</p>`;
      case 'button':  return `${p}<button class="btn ${n.variant}">${esc(n.text)}</button>`;
      case 'image':   return `${p}<img src="/placeholder.jpg" alt="${esc(n.alt)}" class="image" />`;
      case 'row':     return `${p}<div class="row">\n${(n.children || []).map((c) => node(c, d + 1)).join('\n')}\n${p}</div>`;
      case 'column':
      case 'stack':   return `${p}<div class="stack">\n${(n.children || []).map((c) => node(c, d + 1)).join('\n')}\n${p}</div>`;
      case 'grid':    return `${p}<div class="grid">\n${(n.children || []).map((c) => node(c, d + 1)).join('\n')}\n${p}</div>`;
      default:        return '';
    }
  };
  return `import { Component } from '@angular/core';

@Component({
  selector: 'app-${slug(frame.name)}',
  template: \`
    <section class="frame">
${frame.children.map((c) => node(c, 3)).join('\n')}
    </section>\`,
  styles: [\`
    .frame { background: ${t.background}; display:flex; flex-direction:column; gap:${t.gap}px; padding:32px; }
    .heading { color:${t.text}; font-size:${t.headingSize}px; font-weight:700; margin:0; }
    .text { color:${t.muted}; font-size:${t.bodySize}px; line-height:1.6; margin:0; }
    .btn { border-radius:${t.radius}px; padding:12px 20px; font-weight:600; cursor:pointer; }
    .btn.primary { background:${t.primary}; color:#fff; border:none; }
    .btn.secondary { background:transparent; color:${t.text}; border:1px solid ${t.text}22; }
    .row { display:flex; gap:${t.gap}px; } .stack { display:flex; flex-direction:column; gap:${t.gap}px; }
    .grid { display:grid; grid-template-columns:repeat(2,1fr); gap:${t.gap}px; }\`]
})
export class ${cn(frame.name)}Component {}`;
}

/* ---------- Static HTML ---------- */
function genHTML(frame, theme) {
  const t = theme;
  const node = (n, d) => {
    const p = pad(d);
    switch (n.type) {
      case 'heading': return `${p}<h1 class="heading">${esc(n.text)}</h1>`;
      case 'text':    return `${p}<p class="text">${esc(n.text)}</p>`;
      case 'button':  return `${p}<a class="btn ${n.variant}">${esc(n.text)}</a>`;
      case 'image':   return `${p}<img src="placeholder.jpg" alt="${esc(n.alt)}" class="image">`;
      case 'row':     return `${p}<div class="row">\n${(n.children || []).map((c) => node(c, d + 1)).join('\n')}\n${p}</div>`;
      case 'column':
      case 'stack':   return `${p}<div class="stack">\n${(n.children || []).map((c) => node(c, d + 1)).join('\n')}\n${p}</div>`;
      case 'grid':    return `${p}<div class="grid">\n${(n.children || []).map((c) => node(c, d + 1)).join('\n')}\n${p}</div>`;
      default:        return '';
    }
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    .frame { background:${t.background}; display:flex; flex-direction:column; gap:${t.gap}px; padding:32px; font-family:${t.bodyFont},sans-serif; }
    .heading { color:${t.text}; font-size:${t.headingSize}px; font-weight:700; margin:0; }
    .text { color:${t.muted}; font-size:${t.bodySize}px; line-height:1.6; margin:0; }
    .btn { border-radius:${t.radius}px; padding:12px 20px; font-weight:600; text-decoration:none; display:inline-block; }
    .btn.primary { background:${t.primary}; color:#fff; }
    .btn.secondary { background:transparent; color:${t.text}; border:1px solid ${t.text}22; }
    .row { display:flex; gap:${t.gap}px; } .stack { display:flex; flex-direction:column; gap:${t.gap}px; }
    .image { width:100%; border-radius:${t.radius}px; }
  </style>
</head>
<body>
  <section class="frame">
${frame.children.map((c) => node(c, 2)).join('\n')}
  </section>
</body>
</html>`;
}

/* ---------- MJML (email) ---------- */
function genMJML(frame, theme) {
  const t = theme;
  const node = (n) => {
    switch (n.type) {
      case 'heading': return `        <mj-text font-size="${t.headingSize}px" font-weight="700" color="${t.text}">${esc(n.text)}</mj-text>`;
      case 'text':    return `        <mj-text font-size="${t.bodySize}px" line-height="1.6" color="${t.muted}">${esc(n.text)}</mj-text>`;
      case 'button':  return `        <mj-button background-color="${n.variant === 'primary' ? t.primary : '#ffffff'}" color="${n.variant === 'primary' ? '#ffffff' : t.text}" border-radius="${t.radius}px">${esc(n.text)}</mj-button>`;
      case 'image':   return `        <mj-image src="placeholder.jpg" alt="${esc(n.alt)}" border-radius="${t.radius}px" />`;
      case 'row':
      case 'column':
      case 'stack':   return (n.children || []).map(node).join('\n');
      default:        return '';
    }
  };
  return `<mjml>
  <mj-body background-color="${t.background}">
    <mj-section padding="32px">
      <mj-column>
${frame.children.map(node).join('\n')}
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}

function cn(name) { return name.replace(/[^a-z0-9]+/gi, ' ').split(' ').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('') || 'Frame'; }
function slug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'frame'; }

function generate(target, frame, theme) {
  if (!frame) return '';
  if (target === 'react') return genReact(frame, theme);
  if (target === 'angular') return genAngular(frame, theme);
  if (target === 'html') return genHTML(frame, theme);
  if (target === 'mjml') return genMJML(frame, theme);
  return '';
}

/* ---------- Tiny syntax highlighter -> array of React nodes per line ---------- */
function highlight(code, lang) {
  const lines = code.split('\n');
  const tokenize = (line) => {
    // Split on tokens we care about; very lightweight.
    const out = [];
    let rest = line;
    const patterns = [
      { cls: 'cmt', re: /^(\/\/[^\n]*|\/\*[^]*?\*\/|<!--[^]*?-->)/ },
      { cls: 'str', re: /^("[^"]*"|'[^']*'|`[^`]*`)/ },
      { cls: 'tag', re: /^(<\/?[A-Za-z][\w-]*|\/?>|<\/)/ },
      { cls: 'key', re: /^\b(export|function|return|const|let|import|from|class|selector|template|styles|background|color|new)\b/ },
      { cls: 'num', re: /^\b(\d+(\.\d+)?(px|%)?)\b/ },
    ];
    let guard = 0;
    while (rest.length && guard++ < 4000) {
      let matched = false;
      for (const p of patterns) {
        const m = rest.match(p.re);
        if (m) { out.push({ cls: p.cls, text: m[0] }); rest = rest.slice(m[0].length); matched = true; break; }
      }
      if (!matched) { out.push({ cls: 'fg', text: rest[0] }); rest = rest.slice(1); }
    }
    // merge adjacent fg chars
    const merged = [];
    for (const tk of out) {
      const last = merged[merged.length - 1];
      if (last && last.cls === tk.cls) last.text += tk.text; else merged.push({ ...tk });
    }
    return merged;
  };
  return lines.map(tokenize);
}

Object.assign(window, { EDS_CODE: { generate, highlight } });
