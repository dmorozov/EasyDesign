import { type ReactElement } from 'react';

import { PanelSection, Swatch } from '../design-system';
import { catalog } from '../theme/design-tokens';

import { useEditor } from './store';

// A friendly label from a token ref: 'color.onBrand' -> 'On brand'.
function humanize(ref: string): string {
  const last = ref.split('.').pop() ?? ref;
  const spaced = last
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** The Design Palette: edit Theme tokens once and re-theme every Frame live (ADR-0004). The swatches
 *  come from the Design-Token catalog (`byCategory`) — no hardcoded list, so every color shows up.
 *  Rendered as the Design tab body in the right rail. */
export function ThemePanel(): ReactElement {
  const overrides = useEditor((s) => s.themeOverrides);
  const setThemeOverride = useEditor((s) => s.setThemeOverride);

  return (
    <div className="ed-theme">
      <p className="ed-rail-intro">
        Your style guide — edit a color and the whole board re-themes instantly.
      </p>
      <PanelSection title="Brand colors">
        {catalog.byCategory('color').map((t) => (
          <Swatch
            key={t.ref}
            name={humanize(t.ref)}
            value={overrides[t.ref] ?? t.literal}
            onChange={(hex) => {
              setThemeOverride(t.ref, hex);
            }}
          />
        ))}
      </PanelSection>
    </div>
  );
}
