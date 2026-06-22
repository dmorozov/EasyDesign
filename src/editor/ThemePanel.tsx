import { type ReactElement } from 'react';

import { Input, PanelSection, Swatch } from '../design-system';
import { catalog, CATEGORY_META, paletteCategories } from '../theme/design-tokens';

import { useEditor } from './store';

// A friendly label from a token ref: 'color.onBrand' -> 'On brand', 'font.size.lg' -> 'Lg'.
function humanize(ref: string): string {
  const last = ref.split('.').pop() ?? ref;
  const spaced = last
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// The category sections to show — AUTO-DISCOVERED + ordered by the pure `paletteCategories()` (RP-4/RP-6):
// every `editable` category that carries tokens appears, so adding a token category (or a Type-scale
// section) needs no edit here. Colors render as Swatches; the Type-scale primitives (size/weight/
// line-height/…) as literal text fields — editing either re-themes the whole board live (ADR-0004 + the
// .ed-board override scope, ADR-0007). Composite Text styles are not Catalog entries, so only primitives show.
const SECTIONS = paletteCategories();

/** The Design Palette: edit a Theme token once and re-theme every Frame live (ADR-0004). The sections
 *  and swatches come from the Design-Token Catalog (`byCategory` + `CATEGORY_META`) — no hard-coded
 *  list, so every color AND the Type scale show up. Rendered as the Design tab body in the right rail. */
export function ThemePanel(): ReactElement {
  const overrides = useEditor((s) => s.themeOverrides);
  const setThemeOverride = useEditor((s) => s.setThemeOverride);

  return (
    <div className="ed-theme">
      <p className="ed-rail-intro">
        Your style guide — edit a color or a type size and the whole board re-themes instantly.
      </p>
      {SECTIONS.map((category) => (
        <PanelSection key={category} title={CATEGORY_META[category].label}>
          {catalog.byCategory(category).map((t) =>
            category === 'color' ? (
              <Swatch
                key={t.ref}
                name={humanize(t.ref)}
                value={overrides[t.ref] ?? t.literal}
                onChange={(hex) => {
                  setThemeOverride(t.ref, hex);
                }}
              />
            ) : (
              <Input
                key={t.ref}
                label={humanize(t.ref)}
                value={overrides[t.ref] ?? t.literal}
                onChange={(e) => {
                  setThemeOverride(t.ref, e.target.value);
                }}
              />
            ),
          )}
        </PanelSection>
      ))}
    </div>
  );
}
