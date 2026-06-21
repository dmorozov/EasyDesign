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
import { sampleCard } from '../ir/sample';
import { catalog } from '../theme/design-tokens';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const generatedDir = resolve(root, 'src/theme/generated');
const outDir = resolve(root, 'generated-samples');
mkdirSync(outDir, { recursive: true });

const theme = readFileSync(resolve(generatedDir, 'theme.css'), 'utf8');

// Wrap a card fragment in a standalone, offline-renderable HTML document.
function page(title: string, cardHtml: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
${theme}
      body { background: var(--color-page); margin: 0; padding: var(--space-lg); }
      .ed-frame { max-width: 600px; margin: 0 auto; }
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

// Self-checks.
const checks: [string, boolean][] = [
  ['mjml errors empty', compiled.errors.length === 0],
  ['html has <h2>', emitHTML(sampleCard).includes('<h2')],
  ['canvas rendered a <button>', canvasHtml.includes('<button')],
  [
    'canvas has both labels',
    canvasHtml.includes('Get started') && canvasHtml.includes('Learn more'),
  ],
];
let ok = true;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}`);
  ok &&= passed;
}

console.log(ok ? '\nALL TARGETS GENERATED -> generated-samples/' : '\nSELF-CHECK FAILED');
if (!ok) process.exit(1);
