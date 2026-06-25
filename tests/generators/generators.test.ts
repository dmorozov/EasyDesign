import { describe, expect, it } from 'vitest';

import { emitAngularSource } from '../../src/generators/angular';
import { emitHTML } from '../../src/generators/html';
import { classifyCardChild, emitMJML } from '../../src/generators/mjml';
import { emitReactSource } from '../../src/generators/react';
import { sampleCard } from '../../src/ir/sample';
import {
  type Distribute,
  type Frame,
  type Justify,
  type Node,
  type RegionNode,
  type RowProps,
} from '../../src/ir/types';
import { catalog } from '../../src/theme/design-tokens';

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

// This ADR — the common design components: Paper (layout surface), Stepper/ToolBar/MenuBar (component
// containers), and the display-only Divider/Spacer leaves. Semantic markup + the email-safety boundary.
describe('common design components (this ADR) — semantic markup on every web target', () => {
  const WEB = [
    { name: 'html', emit: emitHTML },
    { name: 'react', emit: emitReactSource },
    { name: 'angular', emit: emitAngularSource },
  ] as const;
  const lit = catalog.withOverrides({});

  it('ToolBar is a <div role="toolbar"> of icon buttons; an empty label → an icon-only button', () => {
    const toolbar: Frame = {
      target: 'web',
      root: {
        type: 'ToolBar',
        props: { label: 'Formatting' },
        children: [
          { type: 'ToolButton', props: { icon: 'undo', label: 'Undo' } },
          { type: 'ToolButton', props: { icon: 'image', label: '' } },
        ],
      },
    };
    for (const { emit } of WEB) {
      const out = emit(toolbar);
      expect(out).toContain('role="toolbar"');
      expect(out).toContain('aria-label="Formatting"');
      expect(out).toContain('<svg'); // the inlined icon glyph
      expect(out).toContain('Undo'); // the labeled button shows its text
      // the icon-only button takes the icon's HUMAN name (not the developer key 'image').
      expect(out).toContain('aria-label="Insert image"');
      expect(out).not.toContain('aria-label="image"');
    }
  });

  it('MenuBar is a semantic <nav aria-label><ul> nav bar of links — distinct from TopNav, NOT role=menubar', () => {
    const menu: Frame = {
      target: 'web',
      root: {
        type: 'MenuBar',
        children: [
          { type: 'NavLink', props: { label: 'File', href: '#', active: true } },
          { type: 'NavLink', props: { label: 'Edit', href: '#' } },
        ],
      },
    };
    for (const { emit } of WEB) {
      const out = emit(menu);
      expect(out).toContain('aria-label="Menu"');
      expect(out).toContain('<ul');
      expect(out).toContain('File');
      expect(out).not.toContain('<button'); // a menu of links, never buttons (the flagship gate)
      // NOT the menubar widget pattern: that requires role=menuitem children + keyboard handling, wrong
      // for real <a href> nav links — so the links stay links, the current one carrying aria-current=page.
      expect(out).not.toContain('role="menubar"');
      expect(out).toContain('aria-current="page"');
    }
  });

  it('Stepper is an <ol> of <li> (steps + aria-hidden connectors); one current step carries aria-current', () => {
    const stepper: Frame = {
      target: 'web',
      root: {
        type: 'Stepper',
        props: { orientation: 'horizontal' },
        children: [
          { type: 'Step', props: { label: 'A', status: 'complete' } },
          { type: 'Step', props: { label: 'B', status: 'current' } },
          { type: 'Step', props: { label: 'C', status: 'upcoming' } },
        ],
      },
    };
    for (const { emit } of WEB) {
      const out = emit(stepper);
      expect(out).toContain('<ol');
      // valid list markup: the <ol> holds ONLY <li> — three step <li> + two aria-hidden connector <li>.
      expect(out.split('<li').length - 1).toBe(5);
      expect(out.split('aria-hidden="true"').length - 1).toBe(2); // the two connectors
      expect(out.split('aria-current="step"').length - 1).toBe(1); // only the current one
      expect(out).toContain('✓'); // the complete step's check badge
    }
    expect(emitHTML(stepper)).toContain('flex-direction:row');
    const vertical: Frame = {
      target: 'web',
      root: { ...stepper.root, props: { orientation: 'vertical' } } as Node,
    };
    expect(emitHTML(vertical)).toContain('flex-direction:column');
  });

  it('Paper is a surface flow container — a styled <div> column like Stack, carrying its token style', () => {
    const paper: Frame = {
      target: 'web',
      root: {
        type: 'Paper',
        style: { background: 'color.surface', padding: 'space.lg' },
        children: [{ type: 'Text', props: { content: 'hi', variant: 'body' } }],
      },
    };
    expect(emitHTML(paper)).toContain('flex-direction:column');
    expect(emitHTML(paper)).toContain('background:var(--color-surface)');
    for (const { emit } of WEB) expect(emit(paper)).toContain('hi');
  });

  it('Divider is the email-SAFE display-only leaf: <hr> on web AND <mj-divider> in email (all four targets)', () => {
    const web: Frame = { target: 'web', root: { type: 'Stack', children: [{ type: 'Divider' }] } };
    expect(emitHTML(web)).toContain('<hr');
    expect(emitReactSource(web)).toContain('<hr');
    expect(emitAngularSource(web)).toContain('<hr');
    const email: Frame = {
      target: 'email',
      root: {
        type: 'Stack',
        children: [{ type: 'Text', props: { content: 'x', variant: 'body' } }, { type: 'Divider' }],
      },
    };
    expect(emitMJML(email, lit)).toContain('<mj-divider');
  });

  it('Spacer is a flexible flex:1 leaf, web-only (rejected in email — flex has no email model)', () => {
    const web: Frame = { target: 'web', root: { type: 'Row', children: [{ type: 'Spacer' }] } };
    expect(emitHTML(web)).toContain('flex:1 1 auto');
    expect(emitReactSource(web)).toContain("flex: '1 1 auto'");
    const email: Frame = {
      target: 'email',
      root: { type: 'Stack', children: [{ type: 'Spacer' }] },
    };
    expect(() => emitMJML(email, lit)).toThrow(/Spacer/);
  });

  it('the web-only containers (Paper/Stepper/ToolBar/MenuBar) classify unsupported + are rejected in email', () => {
    const containers: Node[] = [
      { type: 'Paper', children: [] },
      { type: 'Stepper', props: { orientation: 'horizontal' }, children: [] },
      { type: 'ToolBar', props: { label: 'x' }, children: [] },
      { type: 'MenuBar', children: [] },
    ];
    for (const node of containers) {
      expect(classifyCardChild(node).role).toBe('unsupported');
      const email: Frame = { target: 'email', root: { type: 'Stack', children: [node] } };
      expect(() => emitMJML(email, lit)).toThrow(new RegExp(node.type));
    }
  });
});

// ADR-0021 — the complex compound components. A DataTable is a semantic <table> (caption + thead/tbody)
// and the 2nd email-SAFE Component (→ mj-table); a Pagination is a <nav aria-label="Pagination"><ul> of
// NavLinks, web-only. Header lives on the ROW (the single source of truth → <th scope="col"> vs <td>).
describe('Data Table + Pagination (ADR-0021)', () => {
  const WEB = [
    { name: 'html', emit: emitHTML },
    { name: 'react', emit: emitReactSource },
    { name: 'angular', emit: emitAngularSource },
  ] as const;
  const lit = catalog.withOverrides({});

  const dataTable: Node = {
    type: 'DataTable',
    props: { caption: 'People' },
    children: [
      {
        type: 'TableRow',
        props: { header: true },
        children: [
          { type: 'TableCell', props: { content: 'Name' } },
          { type: 'TableCell', props: { content: 'Role' } },
        ],
      },
      {
        type: 'TableRow',
        props: { header: false },
        children: [
          { type: 'TableCell', props: { content: 'Ada' } },
          { type: 'TableCell', props: { content: 'Engineer' } },
        ],
      },
    ],
  };

  it('a semantic <table>: caption + a <thead> of <th scope="col"> cells + a <tbody> of <td> cells', () => {
    for (const { emit } of WEB) {
      const out = emit({ target: 'web', root: dataTable });
      expect(out).toContain('<table');
      expect(out).toContain('<caption');
      expect(out).toContain('People'); // the caption
      expect(out).toContain('<thead');
      expect(out).toContain('<tbody');
      expect(out).toContain('Name'); // a header cell
      expect(out).toContain('Engineer'); // a body cell
      // header lives on the ROW: exactly the one header row's two cells are <th scope="col"> (not <td>).
      expect(out.split('<th scope="col"').length - 1).toBe(2);
    }
  });

  it('reaches EMAIL through MJML <mj-table> (the 2nd email-safe Component) — caption + th/td', () => {
    const email: Frame = {
      target: 'email',
      root: {
        type: 'Stack',
        children: [{ type: 'Text', props: { content: 'x', variant: 'body' } }, dataTable],
      },
    };
    const out = emitMJML(email, lit);
    expect(out).toContain('<mj-table');
    // structurally identical to the three web targets: caption + <thead> of header rows + <tbody> of body.
    expect(out).toContain('<thead');
    expect(out).toContain('<tbody');
    expect(out).toContain('<th scope="col"');
    expect(out).toContain('<td');
    expect(out).toContain('People'); // the caption
    expect(out).toContain('Ada'); // a body cell
    expect(out).not.toContain('NaN');
  });

  it('a Data Table inside an email Row renders an <mj-table> in its column — not a crash (ADR-0021)', () => {
    // A DataTable is email-safe, so the editor lets it sit in a Row beside other content; the Row
    // flattener emits its mj-table into that column instead of hitting the non-leaf guard.
    const email: Frame = {
      target: 'email',
      root: {
        type: 'Stack',
        children: [
          {
            type: 'Row',
            children: [dataTable, { type: 'Text', props: { content: 'beside', variant: 'body' } }],
          },
        ],
      },
    };
    const out = emitMJML(email, lit);
    expect(out).toContain('<mj-table');
    expect(out).toContain('<th scope="col"');
    expect(out).toContain('beside'); // the sibling leaf column still renders
  });

  it('classifyCardChild maps a DataTable to the email "table" role; a bare TableRow is unsupported', () => {
    expect(classifyCardChild(dataTable).role).toBe('table');
    expect(
      classifyCardChild({ type: 'TableRow', props: { header: false }, children: [] }).role,
    ).toBe('unsupported');
  });

  it('Pagination is a <nav aria-label="Pagination"><ul> of NavLink pages — one current, never a <button>', () => {
    const pagination: Node = {
      type: 'Pagination',
      children: [
        { type: 'NavLink', props: { label: 'Prev', href: '#' } },
        { type: 'NavLink', props: { label: '1', href: '#' } },
        { type: 'NavLink', props: { label: '2', href: '#', active: true } },
      ],
    };
    for (const { emit } of WEB) {
      const out = emit({ target: 'web', root: pagination });
      expect(out).toContain('aria-label="Pagination"');
      expect(out).toContain('<ul');
      expect(out.split('<li').length - 1).toBe(3); // one <li> per page
      expect(out.split('aria-current="page"').length - 1).toBe(1); // only the current page
      expect(out).not.toContain('<button'); // links, never buttons (the flagship gate)
    }
    // web-only: classifies unsupported and is rejected in an email Frame.
    expect(classifyCardChild(pagination).role).toBe('unsupported');
    const email: Frame = { target: 'email', root: { type: 'Stack', children: [pagination] } };
    expect(() => emitMJML(email, lit)).toThrow(/Pagination/);
  });
});

// ADR-0022 — the interactive compounds. On export, Tabs is a static accessible snapshot (role="tablist" +
// role="tab"/role="tabpanel", the first tab selected, the rest hidden); Accordion is native
// <details>/<summary>. Both are web-only (no email model). The panels hold arbitrary content.
describe('Tabs + Accordion (ADR-0022)', () => {
  const WEB = [
    { name: 'html', emit: emitHTML },
    { name: 'react', emit: emitReactSource },
    { name: 'angular', emit: emitAngularSource },
  ] as const;
  const lit = catalog.withOverrides({});

  const tabs: Node = {
    type: 'Tabs',
    props: { orientation: 'horizontal' },
    children: [
      {
        type: 'TabPanel',
        props: { label: 'Overview' },
        children: [{ type: 'Text', props: { content: 'Overview body', variant: 'body' } }],
      },
      {
        type: 'TabPanel',
        props: { label: 'Settings' },
        children: [{ type: 'Button', props: { content: 'Save', variant: 'primary' } }],
      },
    ],
  };

  it('a static accessible tablist: role=tablist/tab/tabpanel, the FIRST tab selected, the rest hidden', () => {
    for (const { emit } of WEB) {
      const out = emit({ target: 'web', root: tabs });
      expect(out).toContain('role="tablist"');
      // one <button role="tab"> per panel, built from each panel's label...
      expect(out.split('role="tab"').length - 1).toBe(2);
      expect(out).toContain('Overview'); // a tab label
      expect(out).toContain('Settings');
      // ...one tabpanel per panel, carrying the panel body.
      expect(out.split('role="tabpanel"').length - 1).toBe(2);
      expect(out).toContain('Overview body');
      expect(out).toContain('Save');
      // exactly ONE selected tab (the first); exactly ONE inactive panel hidden.
      expect(out.split('aria-selected="true"').length - 1).toBe(1);
      expect(out.split('aria-selected="false"').length - 1).toBe(1);
      expect(out.split(' hidden').length - 1).toBe(1); // only the 2nd (inactive) panel
    }
  });

  it('wires each tab to its panel with matching, document-unique ids', () => {
    for (const { emit } of WEB) {
      const out = emit({ target: 'web', root: tabs });
      expect(out).toContain('id="tabs-0-tab-0"');
      expect(out).toContain('aria-controls="tabs-0-panel-0"');
      expect(out).toContain('id="tabs-0-panel-0"');
      expect(out).toContain('aria-labelledby="tabs-0-tab-0"');
    }
  });

  it('two Tabs on one page get DISTINCT id bases (no duplicate ids)', () => {
    const two: Frame = { target: 'web', root: { type: 'Stack', children: [tabs, tabs] } };
    for (const { emit } of WEB) {
      const out = emit(two);
      expect(out).toContain('tabs-0-tab-0');
      expect(out).toContain('tabs-1-tab-0'); // the 2nd Tabs minted its own id base
    }
  });

  const makeAccordion = (exclusive: boolean): Node => ({
    type: 'Accordion',
    props: { exclusive },
    children: [
      {
        type: 'AccordionItem',
        props: { title: 'First', open: true },
        children: [{ type: 'Text', props: { content: 'First body', variant: 'body' } }],
      },
      {
        type: 'AccordionItem',
        props: { title: 'Second', open: false },
        children: [{ type: 'Text', props: { content: 'Second body', variant: 'body' } }],
      },
    ],
  });

  it('native <details>/<summary> sections; the first open; the multi-open default has NO name group', () => {
    for (const { emit } of WEB) {
      const out = emit({ target: 'web', root: makeAccordion(false) });
      expect(out.split('<details').length - 1).toBe(2);
      expect(out.split('<summary').length - 1).toBe(2);
      expect(out).toContain('First'); // a summary title
      expect(out).toContain('Second body'); // a panel body
      expect(out.split('<details open').length - 1).toBe(1); // only the first section is open
      expect(out).not.toContain('name='); // multi-open: independent <details>, no exclusive group
    }
  });

  it('the single-open (exclusive) variant groups the sections with a shared <details name>', () => {
    for (const { emit } of WEB) {
      const out = emit({ target: 'web', root: makeAccordion(true) });
      const names = [...out.matchAll(/name="(acc-\d+)"/g)].map((m) => m[1]);
      expect(names).toHaveLength(2); // both <details> carry the group name...
      expect(new Set(names).size).toBe(1); // ...and it is the SAME name (only one opens at a time)
    }
  });

  it('both compounds are web-only: classifyCardChild unsupported + a throw in an email Frame', () => {
    for (const node of [tabs, makeAccordion(false)]) {
      expect(classifyCardChild(node).role).toBe('unsupported');
      const email: Frame = { target: 'email', root: { type: 'Stack', children: [node] } };
      expect(() => emitMJML(email, lit)).toThrow(new RegExp(node.type));
    }
  });
});
