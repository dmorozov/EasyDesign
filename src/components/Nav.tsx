import { Children, type CSSProperties, type ReactNode } from 'react';

import { type StyleMap } from '../ir/types';

import { styleFromTokens } from './tokens';

// Application chrome (ADR-0019) — β's React home for the canvas/editor runtime (ADR-0005). The string
// export generators keep their own copy in leaf-style (appBarDecls/navDecls/navLinkDecls/breadcrumb*);
// this stays byte-aligned with them on the same CSS-var token graph. AppBar is a flex-row `<header>`;
// TopNav/SideNav are flex `<nav>`s (row/column); Breadcrumb is a `<nav aria-label><ol>` trail. The
// user's token style (gap/background/…) layers on, so clearing `gap`/`padding` to space.none butts
// children together / spans full width — the full-width-chrome story.

function appBarStyle(style: StyleMap | undefined): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...styleFromTokens(style),
  };
}

function navStyle(axis: 'row' | 'column', style: StyleMap | undefined): CSSProperties {
  return {
    display: 'flex',
    flexDirection: axis,
    ...(axis === 'row' ? { alignItems: 'center' } : {}),
    ...styleFromTokens(style),
  };
}

const navLinkStyle = (active: boolean): CSSProperties => ({
  textDecoration: 'none',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-size-base)',
  fontWeight: active ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
  color: active ? 'var(--color-brand)' : 'var(--color-text)',
});

const breadcrumbItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-sm)',
};
const separatorStyle: CSSProperties = {
  color: 'var(--color-muted)',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-size-base)',
};
function breadcrumbListStyle(style: StyleMap | undefined): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    ...styleFromTokens(style),
  };
}

function menuBarListStyle(style: StyleMap | undefined): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    ...styleFromTokens(style),
  };
}
const menuItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: 'var(--space-sm) var(--space-md)',
};

// Pagination (ADR-0021): a <nav aria-label="Pagination"><ul> of BOXED page links — reuses the NavLink
// leaf for the `<a aria-current>`, so this owns only the bar (the <ul>) and the boxed page item (<li>).
// Byte-aligned with leaf-style's paginationListDecls/paginationItemDecls.
function paginationListStyle(style: StyleMap | undefined): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 'var(--space-sm)',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    ...styleFromTokens(style),
  };
}
const paginationItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-sm) var(--space-md)',
  border: '1px solid var(--color-muted)',
  borderRadius: 'var(--radius-lg)',
};

export interface NavLinkProps {
  href: string;
  active?: boolean | undefined;
  children?: ReactNode;
}

/** A nav link: a semantic `<a href>` (the current page carries aria-current). A design preview never
 *  navigates, so the click is swallowed — selection/drag chrome above it still receives the event. */
export function NavLink({ href, active = false, children }: NavLinkProps) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      style={navLinkStyle(active)}
      onClick={(e) => {
        e.preventDefault();
      }}
    >
      {children}
    </a>
  );
}

export interface NavProps {
  style?: StyleMap | undefined;
  children?: ReactNode;
}

/** The top application bar: a semantic `<header>` (flex row, brand left / actions right). Open children
 *  — compose a brand, a TopNav, and action Buttons (ADR-0019). */
export function AppBar({ style, children }: NavProps) {
  return <header style={appBarStyle(style)}>{children}</header>;
}

/** A horizontal navigation menu rendered as a semantic `<nav>` (ADR-0019). */
export function TopNav({ style, children }: NavProps) {
  return <nav style={navStyle('row', style)}>{children}</nav>;
}

/** A vertical navigation menu (sidebar links) rendered as a semantic `<nav>` (ADR-0019). */
export function SideNav({ style, children }: NavProps) {
  return <nav style={navStyle('column', style)}>{children}</nav>;
}

/** A breadcrumb trail: a `<nav aria-label><ol>` of crumbs with a muted "/" between each (ADR-0019). */
export function Breadcrumb({ style, children }: NavProps) {
  const crumbs = Children.toArray(children);
  return (
    <nav aria-label="Breadcrumb">
      <ol style={breadcrumbListStyle(style)}>
        {crumbs.map((crumb, i) => (
          <li key={i} style={breadcrumbItemStyle}>
            {crumb}
            {i < crumbs.length - 1 && (
              <span aria-hidden="true" style={separatorStyle}>
                /
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** An application menu bar: a semantic `<nav aria-label><ul>` of `<li>` links styled as a full bar (the
 *  File/Edit/View look, this ADR), distinct from TopNav's bare inline links. NOT `role="menubar"`: that
 *  ARIA widget pattern is for application command menus (it requires `role="menuitem"` children +
 *  roving-tabindex/arrow-key handling), wrong for real `<a href>` navigation links. */
export function MenuBar({ style, children }: NavProps) {
  const items = Children.toArray(children);
  return (
    <nav aria-label="Menu">
      <ul style={menuBarListStyle(style)}>
        {items.map((item, i) => (
          <li key={i} style={menuItemStyle}>
            {item}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** A pagination bar: a semantic `<nav aria-label="Pagination"><ul>` of boxed `<li>` page links. Reuses
 *  the NavLink leaf (the current page carries aria-current); this only adds the bar + the boxed item. */
export function Pagination({ style, children }: NavProps) {
  const pages = Children.toArray(children);
  return (
    <nav aria-label="Pagination">
      <ul style={paginationListStyle(style)}>
        {pages.map((page, i) => (
          <li key={i} style={paginationItemStyle}>
            {page}
          </li>
        ))}
      </ul>
    </nav>
  );
}
