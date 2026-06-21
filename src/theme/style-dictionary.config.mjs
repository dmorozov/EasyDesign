// Compiles the ONE DTCG token graph (ADR-0004):
//   src/theme/generated/theme.css            -> :root CSS variables for STANDALONE EXPORT pages
//   src/theme/generated/theme.scoped.css     -> the SAME vars, scoped to .ed-board-content, for the
//                                               in-editor canvas (keeps the user's design Theme OFF
//                                               the global :root so it never collides with the design
//                                               system's chrome tokens — e.g. --radius-lg 12px vs 10px)
//   src/theme/generated/tokens.catalog.json  -> the queryable Design-Token catalog (the D2 Model's
//                                               source): one {ref (dot), category, cssVarName, literal}
//                                               per token. SD owns the camelCase-aware name/kebab AND
//                                               the resolved literal, so the catalog can't drift and the
//                                               app never hand-rolls dot->kebab. Subsumes the old
//                                               tokens.literals.json (the catalog carries `literal`).
import StyleDictionary from 'style-dictionary';

import { categoryOf } from './token-category.mjs';

// Custom format: emit the Design-Token catalog. Reads token.$value (the SD v5 footgun, ADR-0004) for
// the resolved literal, token.path for the dot-ref, token.name (name/kebab) for the CSS var name.
StyleDictionary.registerFormat({
  name: 'json/catalog',
  format: ({ dictionary }) =>
    `${JSON.stringify(
      dictionary.allTokens.map((token) => ({
        ref: token.path.join('.'),
        category: categoryOf(token.$type, token.path),
        cssVarName: `--${token.name}`,
        literal: String(token.$value),
      })),
      null,
      2,
    )}\n`,
});

const sd = new StyleDictionary({
  source: ['src/theme/tokens.json'],
  usesDtcg: true,
  log: { verbosity: 'silent' },
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/theme/generated/',
      files: [
        // :root — for standalone generated HTML/React/Angular pages (no editor chrome around them).
        { destination: 'theme.css', format: 'css/variables', options: { outputReferences: true } },
        // .ed-board-content — for the editor canvas; the design Theme lives on the board-content
        // subtree only, so DS chrome owns :root and the two token worlds can't fight.
        {
          destination: 'theme.scoped.css',
          format: 'css/variables',
          options: { outputReferences: true, selector: '.ed-board-content' },
        },
      ],
    },
    // The queryable catalog (D2). name/kebab gives the camelCase-correct var name (onBrand -> on-brand).
    catalog: {
      transforms: ['attribute/cti', 'name/kebab'],
      buildPath: 'src/theme/generated/',
      files: [{ destination: 'tokens.catalog.json', format: 'json/catalog' }],
    },
  },
});

await sd.cleanAllPlatforms();
await sd.buildAllPlatforms();
