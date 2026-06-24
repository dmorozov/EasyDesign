// Dev runner (not part of the library bundle): proves the promoted generators
// still work AND that the React Aria component layer renders. Run: `npm run generate`
// (after `npm run tokens`). Writes inspectable output to generated-samples/.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import mjml2html from 'mjml';
import { renderToStaticMarkup } from 'react-dom/server';

import { CanvasFrame } from '../components/canvas';
import { emitAngularSource } from '../generators/angular';
import { emitHTML } from '../generators/html';
import { emitMJML } from '../generators/mjml';
import { emitReactSource } from '../generators/react';
import { sampleAppLayout, sampleCard } from '../ir/sample';
import { catalog } from '../theme/design-tokens';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const generatedDir = resolve(root, 'src/theme/generated');
const outDir = resolve(root, 'generated-samples');
mkdirSync(outDir, { recursive: true });

const theme = readFileSync(resolve(generatedDir, 'theme.css'), 'utf8');

// Wrap a card fragment in a standalone, offline-renderable HTML document. `maxWidth` lets a wide
// app-layout (ADR-0019) fill the page while the email card stays at its 600px column.
function page(title: string, cardHtml: string, maxWidth = '600px'): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
${theme}
      body { background: var(--color-page); margin: 0; padding: var(--space-lg); }
      .ed-frame { max-width: ${maxWidth}; margin: 0 auto; }
    </style>
  </head>
  <body><div class="ed-frame">${cardHtml}</div></body>
</html>
`;
}

// 1. Static HTML target.
writeFileSync(
  resolve(outDir, 'html.html'),
  page('Static HTML export', emitHTML(sampleCard)),
  'utf8',
);

// 2. React source target.
writeFileSync(resolve(outDir, 'Card.tsx'), emitReactSource(sampleCard), 'utf8');

// 3. Angular source target.
writeFileSync(resolve(outDir, 'card.component.ts'), emitAngularSource(sampleCard), 'utf8');

// 4. MJML email target (resolved literals -> mjml() -> email HTML).
const mjmlSource = emitMJML(sampleCard, catalog.withOverrides({}));
writeFileSync(resolve(outDir, 'email.mjml'), mjmlSource, 'utf8');
const compiled = await mjml2html(mjmlSource, { validationLevel: 'strict' });
writeFileSync(resolve(outDir, 'email.html'), compiled.html, 'utf8');

// 5. React Aria component layer — server-render the live canvas tree.
const canvasHtml = renderToStaticMarkup(<CanvasFrame frame={sampleCard} />);
writeFileSync(resolve(outDir, 'canvas.html'), page('React Aria canvas render', canvasHtml), 'utf8');

// 6. Web app-layout (ADR-0019): the AppShell + AppBar/SideNav/Breadcrumb chrome, both as static HTML
// and as a live canvas render. Web-only — never routed through MJML (it would throw).
const appLayoutHtml = emitHTML(sampleAppLayout);
writeFileSync(
  resolve(outDir, 'app-layout.html'),
  page('App-layout export (ADR-0019)', appLayoutHtml, '1200px'),
  'utf8',
);
const appLayoutCanvasHtml = renderToStaticMarkup(<CanvasFrame frame={sampleAppLayout} />);
writeFileSync(
  resolve(outDir, 'app-layout-canvas.html'),
  page('App-layout canvas render (ADR-0019)', appLayoutCanvasHtml, '1200px'),
  'utf8',
);

// Self-checks.
const checks: [string, boolean][] = [
  ['mjml errors empty', compiled.errors.length === 0],
  ['html has <h2>', emitHTML(sampleCard).includes('<h2')],
  ['canvas rendered a <button>', canvasHtml.includes('<button')],
  [
    'canvas has both labels',
    canvasHtml.includes('Get started') && canvasHtml.includes('Learn more'),
  ],
  // ADR-0019: the app-layout exports semantic landmarks + the computed grid, on both targets.
  ['app-layout html has <header>', appLayoutHtml.includes('<header')],
  ['app-layout html has <nav>', appLayoutHtml.includes('<nav')],
  [
    'app-layout html has the breadcrumb landmark',
    appLayoutHtml.includes('aria-label="Breadcrumb"'),
  ],
  ['app-layout html has the computed grid', appLayoutHtml.includes('grid-template-areas')],
  // Web exports reference CSS vars (--space-none: 0px lives in theme.css), so the full-bleed Region
  // reads padding:var(--space-none) — the explicit zero-spacing token reaching the output (ADR-0019).
  [
    'app-layout html pins a full-bleed region (space.none)',
    appLayoutHtml.includes('padding:var(--space-none)'),
  ],
  [
    'app-layout canvas rendered <header> + <nav>',
    appLayoutCanvasHtml.includes('<header') && appLayoutCanvasHtml.includes('<nav'),
  ],
];
let ok = true;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}`);
  ok &&= passed;
}

console.log(ok ? '\nALL TARGETS GENERATED -> generated-samples/' : '\nSELF-CHECK FAILED');
if (!ok) process.exit(1);
