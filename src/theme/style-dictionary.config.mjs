// Compiles the ONE DTCG token graph (ADR-0004) to FOUR outputs:
//   src/theme/generated/theme.css            -> :root CSS variables for STANDALONE EXPORT pages
//   src/theme/generated/theme.scoped.css     -> the SAME vars, scoped to .ed-board-content, for the
//                                               in-editor canvas (keeps the user's design Theme OFF
//                                               the global :root so it never collides with the design
//                                               system's chrome tokens — e.g. --radius-lg 12px vs 10px)
//   src/theme/generated/tokens.catalog.json  -> the queryable Design-Token catalog (the D2 Model's
//                                               source): one {ref (dot), category, cssVarName, literal}
//                                               per PRIMITIVE token. SD owns the camelCase-aware name AND
//                                               the resolved literal, so the catalog can't drift.
//   src/theme/generated/typography.ts        -> codegen'd TS (RP-3): the `TextStyle` union + the primitive
//                                               Type-scale refs each named Text style binds to. The IR
//                                               variant + the free-form pickers read these, so adding a
//                                               heading = one composite token and the types follow.
//
// Composite `typography` tokens (the named Text styles `text.*`) are NOT runtime CSS vars nor catalog
// entries: they are the DTCG-standard AUTHORING + interop format and the codegen's source. The render
// resolves them to PRIMITIVE vars/literals via the codegen'd binding, so the editable Type scale stays
// the primitives and the composites stay a fixed, picked-whole set (CONTEXT.md: Type scale vs Text style).
import StyleDictionary from 'style-dictionary';

import { categoryOf } from './token-category.mjs';

const isComposite = (token) => token.$type === 'typography';
const stripRef = (value) => String(value).replace(/[{}]/g, ''); // '{font.size.lg}' -> 'font.size.lg'

// Custom format: the Design-Token catalog — PRIMITIVES only (composites filtered out, they are not
// queryable Design Tokens; the named styles live in typography.ts). Reads token.$value for the resolved
// literal, token.path for the dot-ref, token.name (name/kebab) for the CSS var name.
StyleDictionary.registerFormat({
  name: 'json/catalog',
  format: ({ dictionary }) =>
    `${JSON.stringify(
      dictionary.allTokens
        .filter((token) => !isComposite(token))
        .map((token) => ({
          ref: token.path.join('.'),
          category: categoryOf(token.$type, token.path),
          cssVarName: `--${token.name}`,
          literal: String(token.$value),
        })),
      null,
      2,
    )}\n`,
});

// Custom format: codegen the typography TS (RP-3). The `text.*` composites give the TextStyle union +
// the binding (each style -> the primitive refs it aliases, read from the UNRESOLVED original value);
// the `font.size.*` / `font.weight.*` primitives give the free-form step unions.
StyleDictionary.registerFormat({
  name: 'typescript/typography',
  format: ({ dictionary }) => {
    const all = dictionary.allTokens;
    const under = (a, b) => (t) => t.path[0] === a && t.path[1] === b;
    const composites = all.filter(isComposite);
    const sizes = all.filter(under('font', 'size'));
    const weights = all.filter(under('font', 'weight'));
    const name = (t) => t.path[t.path.length - 1];
    const ref = (t) => t.path.join('.');
    const union = (vals) => (vals.length ? vals.map((v) => `'${v}'`).join(' | ') : 'never');
    const bindings = composites
      .map((t) => {
        const v = t.original.$value;
        return `  ${name(t)}: { fontSize: '${stripRef(v.fontSize)}', fontWeight: '${stripRef(v.fontWeight)}', lineHeight: '${stripRef(v.lineHeight)}' },`;
      })
      .join('\n');
    return `// AUTO-GENERATED from the token graph by Style Dictionary — do not edit by hand.
// The named Text styles (DTCG composite \`text.*\`) + the primitive Type-scale refs they bind to (RP-3).

export type TextStyle = ${union(composites.map(name))};
export type FontSizeRef = ${union(sizes.map(ref))};
export type FontWeightRef = ${union(weights.map(ref))};

export interface TextStyleBinding {
  readonly fontSize: FontSizeRef;
  readonly fontWeight: FontWeightRef;
  readonly lineHeight: string;
}

/** Each Text style -> the primitive refs it resolves to (web \`var()\` / email literal). */
export const TEXT_STYLE_BINDING: Record<TextStyle, TextStyleBinding> = {
${bindings}
};
`;
  },
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
        {
          destination: 'theme.css',
          format: 'css/variables',
          filter: (token) => !isComposite(token),
          options: { outputReferences: true },
        },
        // .ed-board-content — for the editor canvas; the design Theme lives on the board-content
        // subtree only, so DS chrome owns :root and the two token worlds can't fight.
        {
          destination: 'theme.scoped.css',
          format: 'css/variables',
          filter: (token) => !isComposite(token),
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
    // Codegen'd TS unions + binding (RP-3). No transforms needed — the format reads path + original value.
    types: {
      transforms: ['attribute/cti'],
      buildPath: 'src/theme/generated/',
      files: [{ destination: 'typography.ts', format: 'typescript/typography' }],
    },
  },
});

await sd.cleanAllPlatforms();
await sd.buildAllPlatforms();
