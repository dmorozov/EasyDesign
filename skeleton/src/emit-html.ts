// Build a standalone static HTML document for the sample card.
// Inlines build/theme.css inside a <style> tag so out/html/index.html renders offline.

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sampleCard } from './ir.js';
import { emitHTML } from './generators/html.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..'); // skeleton/

const themeCss = readFileSync(resolve(root, 'build/theme.css'), 'utf8');
const body = emitHTML(sampleCard);

// The page background uses --color-page so the surface card reads correctly.
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EasyDesign - Static HTML export</title>
<style>
${themeCss}
body { margin: 0; padding: var(--space-lg); background: var(--color-page); }
.ed-card-frame { max-width: 600px; margin: 0 auto; }
</style>
</head>
<body>
<div class="ed-card-frame">
${body}
</div>
</body>
</html>
`;

const outPath = resolve(root, 'out/html/index.html');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html, 'utf8');
console.log(`Wrote ${outPath} (${html.length} bytes)`);
