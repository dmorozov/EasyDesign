# EasyDesign Design System

The brand + UI system for **EasyDesign** — a visual UI builder for non-designers. People who can't
write code or use Figma drag pre-themed components onto an infinite board, restyle everything by
editing one shared Theme, then export clean **React, Angular, static HTML, or MJML email** code.

This repo is the *design system for the EasyDesign product itself* — the editor "chrome" (toolbar,
palette, board, inspector), its foundations (color, type, spacing, motion), reusable primitives, and
a full interactive recreation of the editor workspace.

> **The golden rule of this system:** the editor *chrome* has its own neutral palette (slate +
> one indigo accent) that is **completely independent of the user's design Theme**. When a user
> recolors their brand, the app itself must never re-skin. Chrome tokens (`--accent`, `--surface`,
> `--text-*`) and the user's runtime Theme are two separate worlds.

---

## Sources

This system was built from a written product brief plus reference mockups of the EasyDesign editor
(stored in `ideas_ref/`):

- `ideas_ref/screen.png` — editor with a selected element + Properties panel
- `ideas_ref/screen-copy.png` — the most complete reference: wordmark, searchable palette,
  Inspector / Design Palette / Export, type scale, swatches
- `ideas_ref/screen-copy-2.png` — empty-canvas "Start your next design" first-run state

There was **no source codebase or Figma file** — the product is greenfield. The two extra images
originally attached (`edit-website.webp`, a Figma/html.to.design screenshot) were unrelated tool
chrome and were discarded. If a real codebase or Figma exists, re-attach it and this system should be
reconciled against it.

---

## Content fundamentals

The product voice is **calm, encouraging, and plain-language**. It is written *for people who are
intimidated by design tools*, so the chrome never uses jargon.

- **Plain words, never jargon.** Say **Components, Theme, Export, Frame** — never "IR", "tokens",
  "nodes", "AST". The right rail is "Design Palette / Your style guide", not "Theme Variables".
- **Second person, action-first.** Copy speaks to *you* and tells you the next move:
  "Drag a component here to start", "Click any element to edit its properties here",
  "Edit a value and the whole board re-themes instantly."
- **Generous, teaching empty states.** Empty frame → "Drag a component here to start / Anything from
  the left panel works." Empty selection → "Nothing selected / Click any element on the board…".
  First run → "Start your next design".
- **Reassuring system status.** "All changes saved", "Saving…". Confidence-building, not alarming.
- **Rewarding the payoff.** The Export panel headline is "Your design, as real code" —
  it celebrates the superpower instead of describing a feature.
- **Sentence case** everywhere except ALL-CAPS micro-labels for panel section headers
  (INSPECTOR, SIZE & POSITION, DESIGN PALETTE).
- **Tone:** friendly + confident. Never childish, never an intimidating pro tool. Light, helpful,
  precise.
- **Emoji:** not used in chrome. A single ✓ check glyph appears in the save status; otherwise
  iconography is line icons, never emoji.

Example microcopy: *"Not available in email"* (gentle restriction), *"Get Started" / "Learn More"*
(sample board content), *"+ New Frame"*, *"Copy code" → "Copied!"*.

---

## Visual foundations

**Overall vibe:** light, clean, airy, flat material. Lots of whitespace, soft 1px hairline borders,
gentle low-spread shadows, gentle 8–10px radii. Crisp and professional but friendly. Cool-gray
neutrals with a single confident indigo accent.

**Color**
- Chrome neutral: a cool **slate** scale (`--slate-0…900`) — whites and blue-grays. Surfaces are
  pure white on a faint blue-gray canvas (`--canvas-bg #f4f6fb`).
- One accent: **indigo `#5B5BD6`** (`--indigo-500` / `--accent`), hover `#4F4FCB`, press `#4040AD`,
  soft tint `#EEEEFB`. Used *sparingly* — primary buttons, selection, drop indicators, active states.
- Semantic: green `#1F9D57` (saved/success), amber `#D98A1A` (saving/warning), red `#D94545`
  (reset/destructive) — each with a soft tint.
- The code/export view is the only dark surface: `--code-bg #1B1E2B` with indigo keywords, green
  strings, orange tags.
- The **user Theme** (board content) is separate: it defaults to primary `#4648D4`, white bg, near-
  black text, and is fully user-editable at runtime.

**Type**
- **Inter** (humanist UI sans) for *all* chrome. **JetBrains Mono** for code/export only.
- Compact, legible scale: body 14px, dense controls 13px, captions 12px, micro-labels 11px;
  panel titles 17px, app headings 20–24px; wordmark 19–21px / 800.
- **ALL-CAPS micro-labels** at `letter-spacing: 0.07em` for panel section headers.
- Weights: 400 / 500 / 600 / 700 / 800. Large headings use `-0.02em` tracking.

**Spacing & shape**
- 4px base grid (`--space-*`). Comfortable, touch-friendly density — controls are 34px tall
  (`--control-h`), min hit target 44px.
- Radii: controls 8px, cards/palette items 10px, frames 14px, pills 999px.
- App shell regions: toolbar 48px, left rail 240px, right rail 360px.

**Borders, shadows, surfaces**
- Hairline borders `--border #DBE1EA` (1px). Cards = white surface + 1px border + soft shadow
  (`--shadow-sm`). Sunken surfaces are tinted with no shadow.
- Shadows are soft and cool-tinted, low spread. Frames float on the canvas with `--shadow-frame`.
  Hover lift uses an indigo-tinted `--shadow-lift`.
- Backgrounds: the board is a **faint dot-grid** (`radial-gradient` dots, 22px grid) on a cool
  canvas. No gradients in chrome, no textures, no imagery in the chrome itself. Board *content*
  imagery is whatever the user drops (placeholders shown as soft indigo-tinted blocks).

**Motion** — subtle and quick (120–180ms), `cubic-bezier(0.2,0.7,0.3,1)` ease-out. Hover lifts
(translateY -1px), press settles (translateY +0.5px), drop-line snaps in, panels expand/collapse,
the chevron rotates 90°. Nothing bouncy. Respects `prefers-reduced-motion`.

**Interaction states**
- Hover: surface tint or lift + accent border (palette items).
- Press/active: slight downward nudge + darker fill.
- Selection: 2px accent outline + offset, with a tiny floating accent handle showing the element name.
- Drop indicators: a crisp 2px accent line (with a dot cap) for before/after; a soft indigo
  inside-highlight (`--drop-inside`) with accent dashed border for "inside a container".
- Focus: a visible 2px focus ring on every control (`--ring-focus`), AA contrast, full keyboard
  operability.

**Transparency / blur:** used sparingly — the "New Frame" affordance uses a translucent white;
overlays/ghosts are solid. No heavy glassmorphism.

---

## Iconography

- **System:** Lucide-style line icons — 2px stroke, rounded caps/joins, monochrome, drawn on a 24px
  grid and sized to `1em`/`size` prop. This matches the reference mockups (undo/redo, search,
  settings, zoom). The kit ships its own inline set in `ui_kits/easydesign-editor/icons.jsx` and the
  foundation card `guidelines/brand-iconography.html`.
- **Substitution note:** there were no source icon assets, so we standardized on the **Lucide**
  visual language and hand-authored matching inline SVGs (so the system is self-contained and offline).
  If you prefer the real Lucide package, swap `Icon.*` for `lucide-react` — the stroke weight and
  style are designed to match 1:1.
- **Color:** icons inherit `currentColor` — `--icon` (muted) by default, `--icon-strong` on hover,
  `--accent-press` when active/selected. Never multicolor.
- **No emoji** as icons. The brand glyph is a small indigo **diamond/gem** (`assets/logo-glyph.svg`),
  reflecting the "EasyDesign" wordmark mark seen in the reference.
- **Logo:** `assets/logo-glyph.svg` (square app glyph) + `assets/logo-wordmark.svg` (full lockup,
  "Easy" in ink + "Design" in indigo). These are the system's own brand marks (no source logo existed).

---

## Index / manifest

**Root**
- `styles.css` — global entry point (consumers link this). `@import`s only.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `base.css`.
- `assets/` — `logo-glyph.svg`, `logo-wordmark.svg`.
- `ideas_ref/` — original reference mockups.
- `SKILL.md` — Agent-Skills-compatible entry for use in Claude Code.

**Foundation cards** (`guidelines/`, shown in the Design System tab)
- Colors: `colors-indigo`, `colors-slate`, `colors-semantic`, `colors-aliases`, `colors-code`
- Type: `type-families`, `type-scale`, `type-weights`
- Spacing: `spacing-scale`, `spacing-radii`, `spacing-elevation`
- Brand: `brand-logo`, `brand-canvas`, `brand-iconography`, `brand-states`

**Components** (React primitives — `window.EasyDesignDesignSystem_95eb6c.*`)
- `components/core/` — **Button, IconButton, Badge, Card**
- `components/forms/` — **Input, Select, Checkbox, Switch, SegmentedControl**
- `components/editor/` — **Tabs, PanelSection, PanelHeader, Swatch, SwatchChip, PaletteItem**

**UI kit**
- `ui_kits/easydesign-editor/` — the full four-region editor workspace, interactive
  (drag-and-drop, live theming, undo/redo, export with syntax-highlighted code). See its `README.md`.

---

## Using a component

```jsx
// In an @dsCard HTML file, after loading _ds_bundle.js:
const { Button, Tabs, Swatch } = window.EasyDesignDesignSystem_95eb6c;
<Button variant="primary" icon={<Code/>}>Export Code</Button>
```

All styling references the CSS custom properties from `styles.css`. Link that one file and the
namespace bundle and everything themes correctly.
