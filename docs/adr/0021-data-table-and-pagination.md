# Complex compound components: a Data Table and Pagination

EasyDesign gained its two most complex compound components yet — a **Data Table** (the "data grid"
ADR-0020 said the compound seam was built for) and a **Pagination** bar. Neither is a new seam: each
rides the existing Node-Walk component-container machinery (ADR-0008/0016) and the descriptor (ADR-0014).
The Data Table is the first **three-level** compound (`DataTable` → `TableRow` → `TableCell`) and the
**second email-safe Component after Divider** — it exports to all four targets, reaching email through
MJML's native `<mj-table>`. Pagination is a lean nav bar that **reuses the existing `NavLink` slot leaf**.

## Decision 1 — the Data Table is a three-level compound; `header` lives on the row

`DataTable` is a COMPONENT container constrained to `TableRow`; `TableRow` is itself a COMPONENT container
constrained to `TableCell`; `TableCell` is the text leaf. The walk already recurses through nested
component containers, so this "container of containers of leaves" needed no traversal change — only three
new `ComponentContainerType` entries (`DataTable`, `TableRow`) plus the auto-derived `TableCell` leaf.

The header/body split has **one source of truth: `TableRow.props.header`**. A header row's cells render
`<th scope="col">` inside `<thead>`; a body row's render `<td>` inside `<tbody>`. Two consequences fall
out of keeping the flag on the row:

- The **`TableRow` renderer wraps each rendered cell** in `<th>`/`<td>` — exactly the pattern Stepper uses
  to wrap each step in `<li>`. So the `TableCell` leaf renders only its escaped text, and the th-vs-td
  decision lives in one place.
- The **`DataTable` renderer partitions** its rendered rows into `<thead>`/`<tbody>` by reading
  `node.children[i].props.header`, and emits the `<caption>` (the editable accessible title) when non-empty.

`Stepper.orientation`-style state — a `TableRow`'s `header` flag — is set at creation via two palette
presets ("Table row" / "Table row (header)"), the established "parenthetical = palette variant" idiom;
**editing it is a deferred follow-up** (the `NavLink.active` precedent). The editable prop is the cell's
`content` and the table's `caption`.

## Decision 2 — text cells, so the Data Table is EMAIL-SAFE via `<mj-table>`

Cells hold **plain text**, which is exactly what MJML's `<mj-table>` accepts (an "ending tag": plain
table HTML, no nested MJML). So the Data Table flattens to its own sibling `<mj-section><mj-column>`
wrapping a real `<mj-table>` (`renderMjTable`: a `<caption>` then a `<thead>` of header rows and a
`<tbody>` of body rows — **structurally identical to the three web targets**), parallel to how a `Row`
gets its own section, with the cells carrying **resolved-literal** inline styles (mj-table can't read CSS
vars), mirroring `renderDivider`. This makes `DataTable`/`TableRow`/`TableCell` all `emailSafe:true` and
gives the table a clean path to **all four targets** (proven by the `datatable` golden fixture across the
four, the `mj-table` generate self-check, and the email `sampleCard` compiling under MJML **strict**
validation).

`classifyCardChild` gains a `'table'` role for `DataTable`; `TableRow`/`Pagination` join the `unsupported`
(throwing) arm — a bare `TableRow` at card level is invalid (throws). Because a `DataTable` is email-safe,
a user can also place one _inside_ a `Row` (a table beside text); the Row flattener emits its `mj-table`
into that column (`renderMjTable` again) rather than throwing, since a column renders a leaf **or** a table
equally well (only nested Rows/Stacks have no email model). `MJML_LEAVES.TableCell` is a throwing
guardrail: a cell is rendered wholesale by its `DataTable`'s `<mj-table>`, never dispatched as a standalone
leaf, so it is unreachable in a valid tree (the one wart of an otherwise-clean email-safe leaf; documented
in code).

The alternative — rich cells holding any component — was rejected: `mj-table` takes only plain HTML, so
rich cells would have forced the table web-only, sacrificing the marquee email-table win.

## Decision 3 — the table is ONE editable canvas node; structural editing is deferred

The editor's per-node chrome wraps every node in a `<div role="treeitem">` with drag-handle and gap-drop
children. That is **illegal inside a `<table>`** (a `<div>` can't sit between `<table>`/`<tbody>` and
`<tr>`, nor inside `<tr>`) and `role="treeitem"` on a `<tr>` would destroy table a11y. Native tables are
fundamentally hostile to the per-node-div chrome model. So:

- The **whole `<table>` is ONE editable node** — `EditableShell` wraps it; its interior
  (`<thead>/<tbody>/<tr>/<th>/<td>`) renders **clean, identical to the export and the read-only canvas**
  (the user's "hand-rolled `<table>`, canvas == export" choice). The `TableRow`/`TableCell` editor
  renderers deliberately emit **no shell** — the documented table-markup exception.
- **Cell text and the caption are editable** via the Structure tree + Inspector (both path-based and
  generic — no canvas shell needed). **Appending a row** works by dragging "Table row" onto the table
  (the `DataTable` shell is the droppable; `canContain(DataTable, TableRow)` holds), as does the trailing
  gap-drop.
- **Deferred** (the `Step.status`/`NavLink.active` precedent): per-row/cell canvas selection and
  drag-reorder, and adding/removing **columns/cells** (rows seed with a fixed cell count; the starter
  table has three columns). Consequently there is **no `TableCell` palette tile** — its only valid parent
  (`TableRow`) is not a canvas drop target, so a tile would be undroppable; cells are seeded with each row.

## Decision 4 — Pagination reuses the `NavLink` slot leaf

`Pagination` is a COMPONENT container constrained to `NavLink` (zero new leaf types — the Menu Bar
precedent), rendered as a semantic `<nav aria-label="Pagination"><ul>` of **boxed `<li>` page links**, the
current page marked `aria-current="page"` by the reused `NavLink`. The boxing lives on the `<li>` (a token
border + radius) so each page reads as a button without touching the `NavLink`. **Web-only** — a page nav
has no MJML model; a fresh one seeds Prev · 1 · 2(current) · 3 · Next. The "smart widget" alternative (a
single `{currentPage, totalPages}` leaf that auto-generates pages) was rejected as not composable and
against the slot-children idiom.

## Consequences

- **Sixteen Components now ride the ADR-0016 component-container seam** (the prior thirteen plus
  `DataTable`, `TableRow`, `Pagination`), with `TableCell` a new leaf. Each addition stayed "one descriptor
  row + the adapters the compiler demands"; the editor's drop/frames/paths/a11y/node-label modules took the
  usual near-zero per-type edits (only the descriptor-driven `node-label` arm for the cell/row detail).
- **A second email-safe Component.** `DataTable` joins `Divider` in reaching all four targets; the golden
  net exercises it through html/react/angular **and** MJML, and the email `sampleCard` ships a real table.
- **Valid table + list markup**, verified: `<table>` holds only `<caption>/<thead>/<tbody>`; `<tr>` only
  `<th>/<td>`; the Pagination `<ul>` only `<li>`. The header is `<th scope="col">`; the caption is the
  table's accessible name.
- **Editor limitation, explicit:** table internals are tree/Inspector-editable, not canvas-interactive —
  the first compound whose slot children are not canvas drop targets, a deliberate consequence of HTML
  table semantics (see Decision 3), surfaced rather than hidden.
- **Deferred:** editing `TableRow.header`, adding/removing table columns/cells, per-row/cell canvas
  selection + drag-reorder, and a smart-pagination widget — all following the `NavLink.active` deferral
  precedent. No new design tokens (the table/pagination reuse `color.muted`/`color.text`/`radius.lg`/spaces).
