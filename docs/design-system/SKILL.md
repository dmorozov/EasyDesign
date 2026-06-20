---
name: easydesign-design
description: Use this skill to generate well-branded interfaces and assets for EasyDesign (a visual UI builder for non-designers), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md (`readme.md`) file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create
static HTML files for the user to view. If working on production code, you can copy assets and read
the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or
design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_
production code, depending on the need.

## Quick orientation

- **`readme.md`** — the full design guide: brand context, content voice, visual foundations,
  iconography, and a file manifest. Read this first.
- **`styles.css`** — the single global entry point. Link it (and the compiled `_ds_bundle.js`) and
  every CSS custom property + component themes correctly.
- **`tokens/`** — color, type, spacing, effects tokens. **`guidelines/`** — foundation specimen cards.
- **`components/`** — React primitives (core / forms / editor). Each has a `.prompt.md` with usage.
- **`ui_kits/easydesign-editor/`** — the full editor workspace recreation.
- **`assets/`** — `logo-glyph.svg`, `logo-wordmark.svg`.

## The one rule to never break

The EasyDesign editor **chrome** uses neutral slate + a single indigo accent (`#5B5BD6`) and is
**independent of the user's design Theme**. Don't let a "brand color" recolor the app chrome.
Use the `--accent` / `--surface` / `--text-*` tokens for chrome; keep user-Theme colors separate.
