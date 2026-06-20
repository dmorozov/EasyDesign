// EasyDesign — email emit script.
// Writes out/email/email.mjml from the IR, compiles it with mjml v5
// (async `mjml2html`), and writes the table-based HTML to out/email/index.html.
//
// SELF-CHECK (asserted + printed below):
//   1. mjml compile returns errors: []  (errors.length === 0)
//   2. out/email/index.html is non-empty and contains a <table>

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mjml2html from 'mjml';
import { sampleCard } from './ir.js';
import { emitMJML } from './generators/mjml.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../out/email');
mkdirSync(outDir, { recursive: true });

const mjmlSource = emitMJML(sampleCard);
const mjmlPath = resolve(outDir, 'email.mjml');
writeFileSync(mjmlPath, mjmlSource, 'utf8');

// mjml v5: mjml2html is async and returns { html, json, errors }.
const result = await mjml2html(mjmlSource, {
  validationLevel: 'strict',
  filePath: mjmlPath,
});

const htmlPath = resolve(outDir, 'index.html');
writeFileSync(htmlPath, result.html, 'utf8');

// --- Self-check -----------------------------------------------------------
const errors = result.errors ?? [];
const hasTable = result.html.includes('<table');
const nonEmpty = result.html.trim().length > 0;

console.log(`[emit-email] wrote ${mjmlPath}`);
console.log(`[emit-email] wrote ${htmlPath} (${result.html.length} bytes)`);
console.log(`[emit-email] mjml compile errors.length = ${errors.length}`);
if (errors.length > 0) {
  console.log('[emit-email] errors:', JSON.stringify(errors, null, 2));
}
console.log(`[emit-email] index.html non-empty = ${nonEmpty}`);
console.log(`[emit-email] index.html contains <table> = ${hasTable}`);

if (errors.length !== 0) {
  throw new Error(`SELF-CHECK FAILED: mjml returned ${errors.length} error(s)`);
}
if (!nonEmpty) {
  throw new Error('SELF-CHECK FAILED: out/email/index.html is empty');
}
if (!hasTable) {
  throw new Error('SELF-CHECK FAILED: out/email/index.html has no <table>');
}
console.log('[emit-email] SELF-CHECK PASSED');
