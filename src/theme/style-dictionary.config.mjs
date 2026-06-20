// Compiles the ONE DTCG token graph two ways (ADR-0004):
//   src/theme/generated/theme.css            -> :root CSS variables for web + canvas
//   src/theme/generated/tokens.literals.json -> resolved hex/px literals for MJML
import StyleDictionary from 'style-dictionary';

const sd = new StyleDictionary({
  source: ['src/theme/tokens.json'],
  usesDtcg: true,
  log: { verbosity: 'silent' },
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/theme/generated/',
      files: [
        { destination: 'theme.css', format: 'css/variables', options: { outputReferences: true } },
      ],
    },
    // No value transforms -> literals preserved exactly (#4f46e5, 16px) for email.
    literals: {
      transforms: ['attribute/cti', 'name/kebab'],
      buildPath: 'src/theme/generated/',
      files: [{ destination: 'tokens.literals.json', format: 'json/flat' }],
    },
  },
});

await sd.cleanAllPlatforms();
await sd.buildAllPlatforms();
