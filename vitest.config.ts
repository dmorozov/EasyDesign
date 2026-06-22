import { defineConfig } from 'vitest/config';

// The seam, the β table, and the generators are pure (no DOM), so the default
// node environment is enough. Explicit imports (globals: false) keep the test
// files honest about what they use and avoid a tsconfig "types" entry.
export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Scope coverage to the PURE, unit-tested logic — the Node Walk seam, the β
      // table, and the four generators. React UI (editor/components, *.tsx) is
      // verified by the live/E2E checks, not vitest. GROW this list as each
      // deepening (D2 design-tokens, D3 frames, …) lands its own pure module + tests.
      include: [
        'src/ir/walk.ts',
        'src/generators/**/*.ts',
        'src/theme/design-tokens.ts',
        'src/theme/token-category.mjs',
        'src/editor/frames.ts',
        'src/editor/history.ts',
        'src/editor/node-tree.ts',
        'src/editor/paths.ts',
        'src/editor/descriptors.ts',
        'src/editor/palette.ts',
      ],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts', 'src/generators/index.ts'],
      // Headroom below the current run (98.9 / 90.9 / 100 / 100) so the gate catches
      // real regressions without snapping on a single defensive/unreachable branch.
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
