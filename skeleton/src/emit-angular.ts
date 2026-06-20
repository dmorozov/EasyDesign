// Emit the Angular target: writes out/angular/card.component.ts from sampleCard.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sampleCard } from './ir.js';
import { emitAngularSource } from './generators/angular.js';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, '../out/angular/card.component.ts');

const source = emitAngularSource(sampleCard);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, source, 'utf8');

console.log(`Wrote ${outPath}`);
