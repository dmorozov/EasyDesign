// Emit + prove the React generator.
//   1. Generate .tsx source from the IR and write out/react/Card.tsx.
//   2. Dynamically import the generated module.
//   3. Render its default export with renderToStaticMarkup.
//   4. Wrap in a standalone HTML doc that inlines build/theme.css.
//   5. Write out/react/index.html.
//   6. Self-check the rendered markup.
//
// Run: cd skeleton && npx tsx src/emit-react.tsx

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { sampleCard } from './ir.js';
import { emitReactSource } from './generators/react.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..'); // skeleton/

const outDir = resolve(root, 'out/react');
mkdirSync(outDir, { recursive: true });

// 1. Generate the component source.
const source = emitReactSource(sampleCard);
const tsxPath = resolve(outDir, 'Card.tsx');
writeFileSync(tsxPath, source, 'utf8');
console.log(`wrote ${tsxPath}`);

// 2. Dynamically import the GENERATED source — proves it compiles.
const mod = await import(tsxPath);
const Card = mod.default as React.ComponentType;

// 3. Render the generated component — proves it renders.
const markup = renderToStaticMarkup(React.createElement(Card));

// 4. Inline theme.css into a standalone HTML doc.
const themeCss = readFileSync(resolve(root, 'build/theme.css'), 'utf8');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>EasyDesign — React export</title>
<style>
${themeCss}
body { margin: 0; padding: var(--space-lg); background: var(--color-page); }
</style>
</head>
<body>
${markup}
</body>
</html>
`;

// 5. Write the rendered HTML.
const htmlPath = resolve(outDir, 'index.html');
writeFileSync(htmlPath, html, 'utf8');
console.log(`wrote ${htmlPath}`);

// 6. Self-check: rendered markup is non-empty and contains the expected nodes.
const checks: Array<[string, boolean]> = [
  ['non-empty markup', markup.trim().length > 0],
  ['<h2>', /<h2[\s>]/.test(markup)],
  ['<img>', /<img[\s>]/.test(markup)],
  ['button "Get started"', markup.includes('Get started')],
  ['button "Learn more"', markup.includes('Learn more')],
];

let ok = true;
for (const [label, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}`);
  if (!pass) ok = false;
}

console.log('\n--- rendered markup ---');
console.log(markup);

if (!ok) {
  console.error('\nSELF-CHECK FAILED');
  process.exit(1);
}
console.log('\nSELF-CHECK PASSED');
