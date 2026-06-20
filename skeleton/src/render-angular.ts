// Closes the Angular runtime-render gap: bootstrap the GENERATED standalone component
// through real Angular (@angular/platform-server, JIT) and write the rendered HTML.
// This proves out/angular/card.component.ts actually renders — not just typechecks.
import '@angular/compiler'; // enable JIT so the inline template compiles at runtime
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CardComponent } from '../out/angular/card.component.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const theme = readFileSync(resolve(root, 'build/theme.css'), 'utf8');

// CardComponent's selector is `ed-card`; bootstrap it into a matching host element.
const document = `<!doctype html>
<html>
  <head><meta charset="utf-8"><style>
${theme}
    body { background: var(--color-page); margin: 0; padding: var(--space-lg); }
    ed-card { display: block; max-width: 600px; margin: 0 auto; }
  </style></head>
  <body><ed-card></ed-card></body>
</html>`;

const html = await renderApplication(
  (context) => bootstrapApplication(CardComponent, { providers: [provideZonelessChangeDetection()] }, context),
  { document },
);

const outDir = resolve(root, 'out/angular');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'index.html'), html, 'utf8');

const anchors = (html.match(/<a[\s>]/g) || []).length;
const ok = /<h2/.test(html) && /<img/.test(html) && anchors === 2 && html.includes('Welcome aboard');
console.log(`[render-angular] wrote out/angular/index.html (${html.length} bytes)`);
console.log(`[render-angular] has <h2>: ${/<h2/.test(html)} | <img>: ${/<img/.test(html)} | <a> count: ${anchors} | text: ${html.includes('Welcome aboard')}`);
if (!ok) {
  console.error('[render-angular] SELF-CHECK FAILED');
  process.exit(1);
}
console.log('[render-angular] SELF-CHECK PASSED — Angular runtime render matches the contract');
