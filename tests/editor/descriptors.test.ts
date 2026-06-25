import { describe, expect, it } from 'vitest';

import {
  canContain,
  DESCRIPTORS,
  makeAppShell,
  RESTRICTED_CHILD_TYPES,
} from '../../src/editor/descriptors';
import { PALETTE } from '../../src/editor/palette';
import { type Node } from '../../src/ir/types';
import { isLayoutContainer } from '../../src/ir/walk';

// Mapped-type completeness (a row per node type) is enforced by the COMPILER, not here. These cover the
// runtime facts the type system can't: create()/type parity, the email rule, and the control/style sets.
const TYPES = Object.keys(DESCRIPTORS) as Node['type'][];

describe('DESCRIPTORS — the single source of node-type facts (RP-2)', () => {
  it('create() mints a node of its own type (parity by construction)', () => {
    for (const type of TYPES) {
      expect(DESCRIPTORS[type].create().type).toBe(type);
    }
  });

  it('email-unsafe = Grid + the interactive RadioGroup/Radio + the web-only AppShell/Region + nav chrome + the common design components + Pagination; Divider AND the Data Table stay email-SAFE (ADR-0006/0016/0017/0019/0020/0021)', () => {
    const unsafe = new Set<Node['type']>([
      'Grid',
      'Paper', // a nested surface can't flatten to MJML (like Grid)
      'RadioGroup',
      'Radio',
      'AppShell',
      'Region',
      'AppBar',
      'TopNav',
      'SideNav',
      'Breadcrumb',
      'NavLink',
      'MenuBar',
      'Stepper',
      'Step',
      'ToolBar',
      'ToolButton',
      'Spacer', // flex has no email equivalent
      'Pagination', // a page nav has no email equivalent (web-only, ADR-0021)
      // NB: Divider (→ mj-divider) AND the Data Table (DataTable/TableRow/TableCell → mj-table) are
      // email-SAFE — the Components that reach all four targets.
    ]);
    for (const type of TYPES) {
      expect(DESCRIPTORS[type].emailSafe).toBe(!unsafe.has(type));
    }
  });

  it('LAYOUT containers expose layout controls + container style keys; a component container and a leaf do not', () => {
    for (const type of TYPES) {
      const d = DESCRIPTORS[type];
      const node = d.create();
      if (isLayoutContainer(node)) {
        expect(d.styleKeys).toContain('background');
        expect(d.controls).toContain('justify');
        expect(d.controls).not.toContain('content');
      } else if ('children' in node) {
        // component container: renders as a Component, so no LAYOUT controls (justify/align). Most carry
        // a slot rule (allowedChildren) — RadioGroup→Radio, AppShell→Region, the nav menus→NavLink; the
        // AppBar is the one OPEN component container, composed freely (ADR-0016 / ADR-0017 / ADR-0019).
        expect(d.controls).not.toContain('justify');
        expect(d.controls).not.toContain('align');
        if (type !== 'AppBar') expect(d.allowedChildren).toBeDefined();
      } else {
        expect(d.controls).not.toContain('justify');
      }
    }
  });

  it('Text exposes free-form typography style keys; the other leaves expose none (RP-4)', () => {
    expect(DESCRIPTORS.Text.styleKeys).toEqual(['fontSize', 'fontWeight']);
    expect(DESCRIPTORS.Button.styleKeys).toHaveLength(0);
    expect(DESCRIPTORS.Image.styleKeys).toHaveLength(0);
  });

  it('only Row offers distribute; only non-Grid containers offer wrap; Text offers the named-style picker', () => {
    expect(DESCRIPTORS.Row.controls).toContain('distribute');
    expect(DESCRIPTORS.Stack.controls).not.toContain('distribute');
    expect(DESCRIPTORS.Stack.controls).toContain('wrap');
    expect(DESCRIPTORS.Grid.controls).not.toContain('wrap');
    expect(DESCRIPTORS.Text.controls).toEqual(['heading']); // the variant picker; the text is a textField
    expect(DESCRIPTORS.Button.controls).toEqual([]);
  });

  it('text props are declared per type as type-checked `textFields` (subsumes the old content control)', () => {
    expect(DESCRIPTORS.Text.textFields).toEqual([{ key: 'content', label: 'Text' }]);
    expect(DESCRIPTORS.Button.textFields).toEqual([{ key: 'content', label: 'Label' }]);
    expect(DESCRIPTORS.RadioGroup.textFields).toEqual([{ key: 'label', label: 'Group label' }]);
    expect(DESCRIPTORS.Radio.textFields).toEqual([
      { key: 'label', label: 'Label' },
      { key: 'value', label: 'Value' },
    ]);
    expect(DESCRIPTORS.Image.textFields).toBeUndefined();
    // every declared key is a real prop of its node type (mostly compile-enforced; this guards the data)
    for (const type of TYPES) {
      const node = DESCRIPTORS[type].create();
      for (const f of DESCRIPTORS[type].textFields ?? []) {
        expect('props' in node && f.key in node.props).toBe(true);
      }
    }
  });
});

// The old frames.test drift-guard (isNodeEmailSafe(type) === item.emailSafe) is gone: both now derive
// from the descriptor, so they CAN'T drift. This is its successor — every Palette entry projects its
// node type's facts (RP-2), incl. the two Button variants + the Heading/Text split.
describe('PALETTE — projects per-type facts from the descriptor', () => {
  it('every entry inherits group + email-safety from its node type', () => {
    for (const item of PALETTE) {
      const d = DESCRIPTORS[item.create().type];
      expect(item.emailSafe).toBe(d.emailSafe);
      expect(item.group).toBe(d.group);
    }
  });
  it('keeps every node type exportable AND surfaces the expected entries', () => {
    expect(PALETTE.map((i) => i.id)).toEqual([
      'stack',
      'row',
      'grid',
      'paper',
      'app-shell',
      'app-holy-grail',
      'app-sidebar-main',
      'appbar',
      'topnav',
      'sidenav',
      'breadcrumb',
      'menubar',
      'stepper',
      'stepper-vertical',
      'toolbar',
      'heading',
      'text',
      'button-primary',
      'button-secondary',
      'image',
      'radiogroup',
      'radio',
      'navlink',
      'step',
      'toolbutton',
      'datatable',
      'table-row',
      'table-row-header',
      'pagination',
      'divider',
      'spacer',
    ]);
  });
  it('every entry carries its underlying node type (read by the drop validator, RP-10)', () => {
    for (const item of PALETTE) {
      expect(item.nodeType).toBe(item.create().type);
    }
  });
});

// RP-10 / ADR-0016 — the allowed-children (slot) rule, derived from the descriptors.
describe('canContain — the allowed-children rule (RP-10)', () => {
  it('a constrained parent admits only its listed slot types (RadioGroup → Radio)', () => {
    expect(canContain('RadioGroup', 'Radio')).toBe(true);
    expect(canContain('RadioGroup', 'Button')).toBe(false);
    expect(canContain('RadioGroup', 'Text')).toBe(false);
  });
  it('an open parent admits anything that is NOT a slot-restricted child', () => {
    expect(canContain('Stack', 'Button')).toBe(true);
    expect(canContain('Stack', 'RadioGroup')).toBe(true); // RadioGroup itself is not slot-restricted
    expect(canContain('Stack', 'Radio')).toBe(false); // Radio is a slot child → never in an open parent
    expect(canContain('Grid', 'Radio')).toBe(false); // the flagship scenario
  });
  it('the restricted-child set is DERIVED from the descriptors (one source)', () => {
    expect(RESTRICTED_CHILD_TYPES.has('Radio')).toBe(true);
    expect(RESTRICTED_CHILD_TYPES.has('Button')).toBe(false);
  });
  it('the app-shell slot rule: a Region goes ONLY in an AppShell (ADR-0017)', () => {
    expect(canContain('AppShell', 'Region')).toBe(true);
    expect(canContain('AppShell', 'Text')).toBe(false); // AppShell holds only Regions
    expect(canContain('Stack', 'Region')).toBe(false); // Region is slot-restricted to AppShell
    expect(RESTRICTED_CHILD_TYPES.has('Region')).toBe(true);
  });
  it('the nav slot rule: a NavLink goes ONLY in a nav menu (TopNav/SideNav/Breadcrumb) (ADR-0019)', () => {
    for (const menu of ['TopNav', 'SideNav', 'Breadcrumb'] as const) {
      expect(canContain(menu, 'NavLink')).toBe(true);
      expect(canContain(menu, 'Button')).toBe(false); // menus hold ONLY links
    }
    expect(canContain('Stack', 'NavLink')).toBe(false); // NavLink is slot-restricted to nav menus
    expect(RESTRICTED_CHILD_TYPES.has('NavLink')).toBe(true);
  });
  it('AppBar is the OPEN component container: admits content, never slot-restricted children (ADR-0019)', () => {
    expect(canContain('AppBar', 'Text')).toBe(true);
    expect(canContain('AppBar', 'TopNav')).toBe(true); // compose a menu inside the bar
    expect(canContain('AppBar', 'Button')).toBe(true);
    expect(canContain('AppBar', 'NavLink')).toBe(false); // a bare NavLink still belongs in a nav menu
    expect(canContain('AppBar', 'Region')).toBe(false);
  });
  it('a MenuBar reuses the NavLink slot leaf (this ADR)', () => {
    expect(canContain('MenuBar', 'NavLink')).toBe(true);
    expect(canContain('MenuBar', 'Button')).toBe(false); // a menu bar holds ONLY links
  });
  it('the new slot rules: a Step goes ONLY in a Stepper, a ToolButton ONLY in a ToolBar (this ADR)', () => {
    expect(canContain('Stepper', 'Step')).toBe(true);
    expect(canContain('Stepper', 'Button')).toBe(false);
    expect(canContain('ToolBar', 'ToolButton')).toBe(true);
    expect(canContain('ToolBar', 'Button')).toBe(false); // the ToolBar's slot is ToolButton, not Button
    expect(canContain('Stack', 'Step')).toBe(false); // Step/ToolButton are slot-restricted
    expect(canContain('Stack', 'ToolButton')).toBe(false);
    expect(RESTRICTED_CHILD_TYPES.has('Step')).toBe(true);
    expect(RESTRICTED_CHILD_TYPES.has('ToolButton')).toBe(true);
  });
  it('the Data Table slot rules + Pagination reuse NavLink (ADR-0021)', () => {
    // The three-level compound: DataTable → TableRow → TableCell, each level its own slot.
    expect(canContain('DataTable', 'TableRow')).toBe(true);
    expect(canContain('DataTable', 'TableCell')).toBe(false); // a cell goes in a row, not the table
    expect(canContain('DataTable', 'Text')).toBe(false);
    expect(canContain('TableRow', 'TableCell')).toBe(true);
    expect(canContain('TableRow', 'TableRow')).toBe(false);
    // Pagination reuses the NavLink slot leaf (like MenuBar).
    expect(canContain('Pagination', 'NavLink')).toBe(true);
    expect(canContain('Pagination', 'Button')).toBe(false);
    // TableRow/TableCell are slot-restricted; a DataTable/Pagination is a free (open-droppable) Component.
    expect(canContain('Stack', 'TableRow')).toBe(false);
    expect(canContain('Stack', 'TableCell')).toBe(false);
    expect(canContain('Stack', 'DataTable')).toBe(true);
    expect(canContain('Stack', 'Pagination')).toBe(true);
    expect(RESTRICTED_CHILD_TYPES.has('TableRow')).toBe(true);
    expect(RESTRICTED_CHILD_TYPES.has('TableCell')).toBe(true);
    expect(RESTRICTED_CHILD_TYPES.has('DataTable')).toBe(false);
  });
  it('Paper is an OPEN surface container; Divider/Spacer are unrestricted display-only leaves (this ADR)', () => {
    expect(canContain('Paper', 'Text')).toBe(true);
    expect(canContain('Paper', 'Stack')).toBe(true);
    expect(canContain('Paper', 'Radio')).toBe(false); // still rejects slot-restricted children
    // Divider/Spacer drop into any open container, and are NOT slot-restricted.
    expect(canContain('Stack', 'Divider')).toBe(true);
    expect(canContain('Paper', 'Spacer')).toBe(true);
    expect(canContain('ToolBar', 'Divider')).toBe(false); // a constrained parent still admits only its slot
    expect(RESTRICTED_CHILD_TYPES.has('Divider')).toBe(false);
    expect(RESTRICTED_CHILD_TYPES.has('Spacer')).toBe(false);
  });
});

// ADR-0017 — the app-shell region builder, shared by the descriptor create() and the palette presets.
describe('makeAppShell — region builder (ADR-0017)', () => {
  it('orders regions canonically and always includes main', () => {
    const shell = makeAppShell(['footer', 'header']); // main omitted + out of order
    expect(shell.children.map((c) => c.props.area)).toEqual(['header', 'main', 'footer']);
  });
  it('the default AppShell descriptor seeds header + main + footer', () => {
    expect(DESCRIPTORS.AppShell.create().children.map((c) => c.props.area)).toEqual([
      'header',
      'main',
      'footer',
    ]);
  });
});
