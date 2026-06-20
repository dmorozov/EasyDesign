// Compiles the ONE DTCG token graph two ways (ADR-0004):
//   build/theme.css            -> :root CSS variables for web targets + live canvas
//   build/tokens.literals.json -> fully-resolved hex/px literals for the MJML generator
import StyleDictionary from 'style-dictionary';

const sd = new StyleDictionary({
  source: ['tokens/tokens.json'],
  // tokens use the DTCG `$value`/`$type` keys
  usesDtcg: true,
  log: { verbosity: 'default' },
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/',
      files: [
        { destination: 'theme.css', format: 'css/variables', options: { outputReferences: true } },
      ],
    },
    // No value transforms -> literals preserved exactly (#4f46e5, 16px) for email inlining
    literals: {
      transforms: ['attribute/cti', 'name/kebab'],
      buildPath: 'build/',
      files: [
        { destination: 'tokens.literals.json', format: 'json/flat' },
      ],
    },
  },
});

await sd.cleanAllPlatforms();
await sd.buildAllPlatforms();
