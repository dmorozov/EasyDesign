import { describe, expect, it } from 'vitest';

import { sampleCard } from '../ir/sample';
import {
  type Distribute,
  type Frame,
  type Justify,
  type Node,
  type RegionNode,
  type RowProps,
} from '../ir/types';
import { catalog } from '../theme/design-tokens';

import { emitAngularSource } from './angular';
import { emitHTML } from './html';
import { classifyCardChild, emitMJML } from './mjml';
import { emitReactSource } from './react';

// A minimal two-button Row, for exercising the distribute / justify behaviour.
function rowFrame(distribute?: Distribute, justify?: Justify): Frame {
  const props: RowProps = {};
  if (distribute) props.distribute = distribute;
  if (justify) props.justify = justify;
  return {
    target: 'web',
    root: {
      type: 'Row',
      props,
      children: [
        { type: 'Button', props: { content: 'A', variant: 'primary' } },
        { type: 'Button', props: { content: 'B', variant: 'secondary' } },
      ],
    },
  };
}

describe('generators — golden output on the sample (regression guard)', () => {
  it('html', () => {
    expect(emitHTML(sampleCard)).toMatchSnapshot();
  });
  it('react', () => {
    expect(emitReactSource(sampleCard)).toMatchSnapshot();
  });
  it('angular', () => {
    expect(emitAngularSource(sampleCard)).toMatchSnapshot();
  });
  it('mjml', () => {
    expect(emitMJML(sampleCard, catalog.withOverrides({}))).toMatchSnapshot();
  });
});

describe('Row distribute (ADR-0010) — every web target', () => {
  const WEB = [
    { name: 'html', emit: emitHTML, flex: 'flex:1' },
    { name: 'react', emit: emitReactSource, flex: 'flex: 1' },
    { name: 'angular', emit: emitAngularSource, flex: 'flex:1' },
  ] as const;

  for (const { name, emit, flex } of WEB) {
    it(`${name}: fit (default) does NOT wrap children`, () => {
      expect(emit(rowFrame())).not.toContain(flex);
    });
    it(`${name}: fill wraps each child in equal columns`, () => {
      expect(emit(rowFrame('fill')).split(flex).length - 1).toBe(2);
    });
  }

  it('justify reaches the output on a fit Row (there is free space to distribute)', () => {
    expect(emitHTML(rowFrame('fit', 'space-between'))).toContain('justify-content:space-between');
    expect(emitReactSource(rowFrame('fit', 'space-between'))).toContain(
      "justifyContent: 'space-between'",
    );
  });
});

describe('MJML guardrails (ADR-0006/0008)', () => {
  it('throws on a non-Stack root rather than emitting broken email', () => {
    expect(() =>
      emitMJML({ target: 'email', root: { type: 'Row', children: [] } }, catalog.withOverrides({})),
    ).toThrow(/Stack/);
  });

  it('throws on an unknown token ref (caught at email-build time, not silently)', () => {
    const frame: Frame = {
      target: 'email',
      root: {
        type: 'Stack',
        style: { background: 'color.nope' },
        children: [{ type: 'Text', props: { content: 'x', variant: 'body' } }],
      },
    };
    expect(() => emitMJML(frame, catalog.withOverrides({}))).toThrow(/Unknown token ref/);
  });

  it('rejects an unsupported nested container in the email card with a clear message (RP-8)', () => {
    // A Grid/Column/Stack at card level has no email flattening — the exhaustive card-child dispatch
    // rejects it explicitly (ADR-0006/0008), rather than silently falling through to the leaf throw.
    const grid: Frame = {
      target: 'email',
      root: { type: 'Stack', children: [{ type: 'Grid', props: { columns: 2 }, children: [] }] },
    };
    expect(() => emitMJML(grid, catalog.withOverrides({}))).toThrow(/nested Grid/);
    const column: Frame = {
      target: 'email',
      root: { type: 'Stack', children: [{ type: 'Column', children: [] }] },
    };
    expect(() => emitMJML(column, catalog.withOverrides({}))).toThrow(/nested Column/);
  });

  it('a container nested inside a Row column still hits the leaf-flattener guard (RP-8)', () => {
    // The Row→column mapping takes only leaves; a container child is caught by renderLeaf's runtime
    // guardrail (defense in depth — the IR can't yet forbid it at compile time; that is RP-10).
    const frame: Frame = {
      target: 'email',
      root: {
        type: 'Stack',
        children: [{ type: 'Row', children: [{ type: 'Column', children: [] }] }],
      },
    };
    expect(() => emitMJML(frame, catalog.withOverrides({}))).toThrow(/non-leaf/);
  });

  it('classifyCardChild maps each card child to its email role (RP-8)', () => {
    expect(classifyCardChild({ type: 'Text', props: { content: 'x', variant: 'body' } })).toEqual({
      role: 'leaf',
      node: { type: 'Text', props: { content: 'x', variant: 'body' } },
    });
    expect(classifyCardChild({ type: 'Row', children: [] }).role).toBe('row');
    expect(classifyCardChild({ type: 'Grid', props: { columns: 2 }, children: [] })).toEqual({
      role: 'unsupported',
      type: 'Grid',
    });
    expect(classifyCardChild({ type: 'Stack', children: [] }).role).toBe('unsupported');
    // ADR-0017: the web-only app-shell nodes also classify unsupported (kept exhaustive by the compiler).
    expect(classifyCardChild({ type: 'AppShell', children: [] }).role).toBe('unsupported');
    expect(classifyCardChild({ type: 'Region', props: { area: 'main' }, children: [] }).role).toBe(
      'unsupported',
    );
  });

  it('a malformed type-scale override never ships line-height="NaNpx" (RP-6 guard)', () => {
    // An h2 binds font.size.2xl; a non-numeric Theme override would make size×ratio NaN. The guard
    // falls the line-height back to the unitless ratio so the email stays clean (the flagship gate).
    const frame: Frame = {
      target: 'email',
      root: { type: 'Stack', children: [{ type: 'Text', props: { content: 'x', variant: 'h2' } }] },
    };
    const out = emitMJML(frame, catalog.withOverrides({ 'font.size.2xl': 'abc' }));
    expect(out).not.toContain('NaN');
    expect(out).toContain('line-height="1.25"'); // the binding's base ratio, not NaNpx
  });
});

// ADR-0017 — the app-shell layout: a CSS-grid box whose template is computed from its Region children,
// each placed into its named grid area. Web-only; this asserts the computed grid + placement per target.
describe('AppShell (ADR-0017) — computed grid-areas on every web target', () => {
  const region = (area: 'header' | 'main' | 'footer', label: string): RegionNode => ({
    type: 'Region',
    props: { area },
    children: [{ type: 'Text', props: { content: label, variant: 'body' } }],
  });
  const shell: Node = {
    type: 'AppShell',
    children: [region('header', 'H'), region('main', 'M'), region('footer', 'F')],
  };
  const appShellFrame: Frame = { target: 'web', root: shell };

  const WEB = [
    {
      name: 'html',
      emit: emitHTML,
      grid: 'display:grid',
      areas: "grid-template-areas:'header' 'main' 'footer'",
      cell: 'grid-area:header',
    },
    {
      name: 'react',
      emit: emitReactSource,
      grid: "display: 'grid'",
      areas: `gridTemplateAreas: "'header' 'main' 'footer'"`,
      cell: "gridArea: 'header'",
    },
    {
      name: 'angular',
      emit: emitAngularSource,
      grid: 'display:grid',
      areas: "grid-template-areas:'header' 'main' 'footer'",
      cell: 'grid-area:header',
    },
  ] as const;

  for (const { name, emit, grid, areas, cell } of WEB) {
    it(`${name}: emits a CSS grid with the computed template-areas and places each region`, () => {
      const out = emit(appShellFrame);
      expect(out).toContain(grid);
      expect(out).toContain(areas);
      expect(out).toContain(cell);
    });
  }

  it('an AppShell nested in an email Frame is rejected with a clear message (web-only, ADR-0017)', () => {
    const email: Frame = { target: 'email', root: { type: 'Stack', children: [shell] } };
    expect(() => emitMJML(email, catalog.withOverrides({}))).toThrow(/AppShell/);
  });
});

// ADR-0019 — navigation chrome. A TopNav is a semantic <nav> of NavLink <a>s (NOT buttons), the current
// page carrying aria-current. Web-only: a menu has no MJML equivalent, so it's rejected in email Frames.
describe('TopNav + NavLink (ADR-0019) — semantic navigation on every web target', () => {
  const topNav: Node = {
    type: 'TopNav',
    children: [
      { type: 'NavLink', props: { label: 'Home', href: '/home', active: true } },
      { type: 'NavLink', props: { label: 'About', href: '/about' } },
    ],
  };
  const navFrame: Frame = { target: 'web', root: topNav };

  const WEB = [
    { name: 'html', emit: emitHTML },
    { name: 'react', emit: emitReactSource },
    { name: 'angular', emit: emitAngularSource },
  ] as const;

  for (const { name, emit } of WEB) {
    it(`${name}: a <nav> of <a href> links, the active one carrying aria-current`, () => {
      const out = emit(navFrame);
      expect(out).toContain('<nav');
      expect(out).toContain('href="/home"');
      expect(out).toContain('href="/about"');
      expect(out).toContain('Home');
      // exactly ONE aria-current — only the active (current-page) link gets it.
      expect(out.split('aria-current="page"').length - 1).toBe(1);
      // a NavLink is an anchor, never a <button> (accessible menu markup, the flagship gate).
      expect(out).not.toContain('<button');
    });
  }

  it('classifyCardChild marks TopNav unsupported, and a TopNav in an email Frame is rejected (web-only)', () => {
    expect(classifyCardChild(topNav).role).toBe('unsupported');
    const email: Frame = { target: 'email', root: { type: 'Stack', children: [topNav] } };
    expect(() => emitMJML(email, catalog.withOverrides({}))).toThrow(/TopNav/);
  });

  it('AppBar is a semantic <header> (flex space-between) admitting open children (brand + actions)', () => {
    const appBar: Frame = {
      target: 'web',
      root: {
        type: 'AppBar',
        children: [
          { type: 'Text', props: { content: 'Brand', variant: 'h3' } },
          { type: 'Button', props: { content: 'Log out', variant: 'secondary' } },
        ],
      },
    };
    for (const { emit } of WEB) {
      const out = emit(appBar);
      expect(out).toContain('<header');
      expect(out).toContain('Brand');
      expect(out).toContain('Log out');
    }
    expect(emitHTML(appBar)).toContain('justify-content:space-between');
    expect(emitReactSource(appBar)).toContain("justifyContent: 'space-between'");
    expect(emitAngularSource(appBar)).toContain('justify-content:space-between');
  });

  it('SideNav is a vertical <nav> (flex column) of the same NavLink anchors', () => {
    const sideNav: Frame = {
      target: 'web',
      root: {
        type: 'SideNav',
        children: [
          { type: 'NavLink', props: { label: 'A', href: '/a' } },
          { type: 'NavLink', props: { label: 'B', href: '/b' } },
        ],
      },
    };
    expect(emitHTML(sideNav)).toContain('flex-direction:column');
    expect(emitReactSource(sideNav)).toContain("flexDirection: 'column'");
    expect(emitAngularSource(sideNav)).toContain('flex-direction:column');
    for (const { emit } of WEB) expect(emit(sideNav)).toContain('<nav');
  });

  it('Breadcrumb is a <nav aria-label><ol> trail of <li> crumbs with separators between', () => {
    const crumbs: Frame = {
      target: 'web',
      root: {
        type: 'Breadcrumb',
        children: [
          { type: 'NavLink', props: { label: 'Home', href: '/' } },
          { type: 'NavLink', props: { label: 'Docs', href: '/docs' } },
          { type: 'NavLink', props: { label: 'Now', href: '/docs/now', active: true } },
        ],
      },
    };
    for (const { emit } of WEB) {
      const out = emit(crumbs);
      expect(out).toContain('aria-label="Breadcrumb"');
      expect(out).toContain('<ol');
      // three crumbs → three <li>, two "/" separators between them.
      expect(out.split('<li').length - 1).toBe(3);
      expect(out.split('aria-hidden="true"').length - 1).toBe(2);
      // only the current page (active) carries aria-current.
      expect(out.split('aria-current="page"').length - 1).toBe(1);
    }
  });
});
