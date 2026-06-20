// Compiles the ONE DTCG token graph three ways (ADR-0004):
//   src/theme/generated/theme.css            -> :root CSS variables for STANDALONE EXPORT pages
//   src/theme/generated/theme.scoped.css     -> the SAME vars, scoped to .ed-board-content, for the
//                                               in-editor canvas (keeps the user's design Theme OFF
//                                               the global :root so it never collides with the design
//                                               system's chrome tokens — e.g. --radius-lg 12px vs 10px)
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
