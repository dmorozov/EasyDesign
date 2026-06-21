# EasyDesign Design System — Claude Code Integration Prompt

Copy and paste this into Claude Code (or save as a note in your project):

---

## Prompt

I have the EasyDesign Design System in a local folder. Please help me integrate it into this React + TypeScript project.

**Design system location:** `./docs/design-system/` (adjust path if needed)

### Step 1 — Read the design guide

Read `./docs/design-system/SKILL.md` and `./docs/design-system/readme.md` in full before doing anything else. These contain the brand rules, visual foundations, content tone, and the golden rule: **the editor chrome tokens are independent of the user's design Theme — never let a brand color re-skin the app chrome.**

### Step 2 — Wire up global styles

Link the design system's stylesheet so all CSS custom properties (color, type, spacing, motion tokens) are available project-wide:

```ts
// In your entry file (e.g. src/main.tsx or src/index.tsx)
import '/path/to/docs/design-system/styles.css';
```

Or in your root HTML:

```html
<link rel="stylesheet" href="/docs/design-system/styles.css" />
```

This gives you every token: `--accent`, `--surface`, `--text-body`, `--font-sans`, `--radius-md`, `--shadow-sm`, etc.

### Step 3 — Dark mode

Dark chrome is activated by adding `data-theme="dark"` to `<html>`:

```ts
document.documentElement.dataset.theme = 'dark'; // toggle
```

The dark tokens in `tokens/dark.css` override only the chrome aliases — the user's design Theme is unaffected.

### Step 4 — Use the React components

The compiled bundle exposes all 15 components on a global namespace. Load it once:

```html
<script src="/docs/design-system/_ds_bundle.js"></script>
```

Then consume in any file:

```ts
const {
  Button,
  IconButton,
  Tabs,
  Input,
  Select,
  Swatch,
  PaletteItem,
  Badge,
  Card,
  Checkbox,
  Switch,
  SegmentedControl,
  PanelSection,
  PanelHeader,
  SwatchChip,
} = window.EasyDesignDesignSystem_95eb6c;
```

Each component has a `.d.ts` type definition and a `.prompt.md` usage guide in `docs/design-system/components/`. Read them before using a component.

### Step 5 — Copy assets

```
docs/design-system/assets/logo-glyph.svg     → square app icon (28×28)
docs/design-system/assets/logo-wordmark.svg  → full "EasyDesign" lockup
```

Import as React components or `<img>` tags.

### Step 6 — Icon system

Icons follow the **Lucide** visual language (2px rounded stroke, 24px grid, monochrome `currentColor`). The full inline set lives in `docs/design-system/ui_kits/easydesign-editor/icons.jsx`. Either:

- Copy that file and import `Icon.button`, `Icon.search`, etc.
- Or install `lucide-react` — the stroke weight and style match 1:1.

### Step 7 — Reference the UI kit

`docs/design-system/ui_kits/easydesign-editor/` is a full interactive recreation of the EasyDesign editor. Use it as:

- A **visual reference** for layout, spacing, and component density.
- A **copy source** for patterns like the Inspector panel, palette items, or export view.

### Key rules to follow (from the design guide)

1. **Chrome vs Theme separation** — `--accent`, `--surface`, `--text-*` tokens are for chrome only. User-editable brand colors live in runtime state, never in CSS tokens.
2. **Inter for chrome, JetBrains Mono for code** — `--font-sans` / `--font-mono`.
3. **One primary action per region** — only one `variant="primary"` Button visible at a time.
4. **ALL-CAPS micro-labels** — panel section headers use `font-size: 11px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase`.
5. **Generous empty states** — always teach the next action ("Drag a component here to start").
6. **Plain language, no jargon** — say "Components", "Theme", "Export", never "IR", "tokens", "nodes".

### Folder structure recap

```
docs/design-system/
  styles.css              ← link this
  _ds_bundle.js           ← load this for React components
  tokens/                 ← colors, type, spacing, effects, dark
  assets/                 ← logo-glyph.svg, logo-wordmark.svg
  components/
    core/                 ← Button, IconButton, Badge, Card
    forms/                ← Input, Select, Checkbox, Switch, SegmentedControl
    editor/               ← Tabs, PanelSection, PanelHeader, Swatch, PaletteItem
  ui_kits/easydesign-editor/  ← full interactive editor reference
  readme.md               ← full design guide
  SKILL.md                ← skill entry point
```
