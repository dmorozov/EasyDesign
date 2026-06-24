import { describe, expect, it } from 'vitest';

import { APPSHELL_MIN_HEIGHT, appShellTemplate, CANONICAL_AREAS, OPTIONAL_AREAS } from './appshell';

// ADR-0017 — the app-shell grid template is COMPUTED from the present regions. These pin the CSS so all
// five renderers (which share this helper) stay in lock-step, and so absent rows/cols collapse cleanly.
describe('appShellTemplate — computed grid for the present regions (ADR-0017)', () => {
  it('main only: a single 1fr cell', () => {
    expect(appShellTemplate(['main'])).toEqual({
      areas: "'main'",
      rows: 'minmax(0, 1fr)',
      columns: 'minmax(0, 1fr)',
    });
  });

  it('header + main + footer: stacked auto / 1fr / auto rows, one column', () => {
    expect(appShellTemplate(['header', 'main', 'footer'])).toEqual({
      areas: "'header' 'main' 'footer'",
      rows: 'auto minmax(0, 1fr) auto',
      columns: 'minmax(0, 1fr)',
    });
  });

  it('sidebar + main: a fixed-width left column beside main, single row', () => {
    expect(appShellTemplate(['left', 'main'])).toEqual({
      areas: "'left main'",
      rows: 'minmax(0, 1fr)',
      columns: '240px minmax(0, 1fr)',
    });
  });

  it('all five (holy grail): header/footer span every column; sidebars are fixed', () => {
    expect(appShellTemplate(['header', 'left', 'main', 'right', 'footer'])).toEqual({
      areas: "'header header header' 'left main right' 'footer footer footer'",
      rows: 'auto minmax(0, 1fr) auto',
      columns: '240px minmax(0, 1fr) 300px',
    });
  });

  it('placement is by NAME, not argument order (reordered input → same template)', () => {
    expect(appShellTemplate(['footer', 'main', 'header'])).toEqual(
      appShellTemplate(['header', 'main', 'footer']),
    );
  });

  it('uses single-quoted area strings (valid inside an HTML/Angular style="…" attribute)', () => {
    expect(appShellTemplate(['header', 'main']).areas).not.toContain('"');
  });
});

describe('region constants', () => {
  it('canonical order is header → left → main → right → footer', () => {
    expect(CANONICAL_AREAS).toEqual(['header', 'left', 'main', 'right', 'footer']);
  });
  it('optional = everything but the required main', () => {
    expect(OPTIONAL_AREAS).toEqual(['header', 'left', 'right', 'footer']);
    expect(OPTIONAL_AREAS).not.toContain('main');
  });
  it('exposes a visible min-height so an empty shell still reads as an app frame', () => {
    expect(APPSHELL_MIN_HEIGHT).toMatch(/px$/);
  });
});
