# EasyDesign Editor — UI kit

An interactive, high-fidelity recreation of the **EasyDesign** editor workspace — the four-region
shell described in the product brief. It composes this system's primitives (Button, IconButton,
Tabs, Input, Select, Swatch, PaletteItem, SegmentedControl, PanelSection…) rather than re-implementing
them.

Open `index.html`.

## Regions

1. **Top toolbar** — wordmark + diamond glyph, Undo/Redo, auto-save status ("All changes saved ✓" /
   "Saving…"), Import / Share / Reset, and the primary **Export Code** CTA.
2. **Left rail — Component Palette** — searchable, grouped (Layout / Content). Items are draggable
   *and* click-to-add. Grid is greyed with "Not available in email" when the frame is in Email mode.
3. **Center — Board** — a pannable dot-grid canvas hosting Frames. Each frame has an editable name
   and a Web ↔ Email medium switch. Drag a component over the board to see before/after/inside drop
   indicators; selected elements get an accent outline + floating handle. "+ New Frame" and a
   floating zoom/tool control are included.
4. **Right rail** — three tabs:
   - **Inspector** — properties of the selected element (text, variant, alt, alignment, size).
   - **Design** — the live Theme style guide (brand swatches, type scale, spacing/radius). Editing
     re-themes the whole board instantly. *This edits the user Theme, never the chrome.*
   - **Export** — React / Angular / HTML / Email(MJML) targets with a dark syntax-highlighted code
     preview and Copy / Download.

## The four brief states, and how to reach them

- **Populated main editor** — the default view (a Frame with heading, paragraph, two buttons, image).
- **Drag-in-progress** — start dragging any palette item onto the board; a drop indicator + drag
  ghost appear.
- **Export panel** — click **Export Code** (or the Export tab); React is the default target.
- **Empty first-run** — click **Reset** to clear to a single empty frame with the inviting
  "Drag a component here to start" prompt.

## Files

- `index.html` — loads React + Babel + the DS bundle, then the kit scripts in order.
- `icons.jsx` — Lucide-style icon set (→ `window.Icon`).
- `data.jsx` — document model, palette catalog, sample content, default Theme (→ `window.EDS_DATA`).
- `codegen.jsx` — React/Angular/HTML/MJML generators + a tiny syntax highlighter (→ `window.EDS_CODE`).
- `Board.jsx`, `Toolbar.jsx`, `Palette.jsx`, `RightRail.jsx`, `App.jsx` — the regions + orchestration.

## Notes / cut corners (it's a UI kit, not production)

- Drag-drop **adds** components from the palette with full before/after/inside indicators; reordering
  existing elements shows the handle but isn't wired. Undo/redo, live theming, medium restriction,
  zoom, and export are all real.
- Generated code is illustrative (clean and representative), not a guaranteed compiler output.
