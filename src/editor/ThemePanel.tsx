import { type ReactElement } from 'react';

import { PanelSection, Swatch } from '../design-system';

import { baseLiterals } from './literals';
import { useEditor } from './store';

const SWATCHES: { key: string; label: string }[] = [
  { key: 'color-brand', label: 'Primary' },
  { key: 'color-surface', label: 'Surface' },
  { key: 'color-page', label: 'Page' },
  { key: 'color-text', label: 'Text' },
];

function baseHex(key: string): string {
  const value = baseLiterals[key];
  return typeof value === 'string' ? value : '#000000';
}

/** The Design Palette: edit Theme tokens once and re-theme every Frame live (ADR-0004).
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
        {SWATCHES.map(({ key, label }) => (
          <Swatch
            key={key}
            name={label}
            value={overrides[key] ?? baseHex(key)}
            onChange={(hex) => {
              setThemeOverride(key, hex);
            }}
          />
        ))}
      </PanelSection>
    </div>
  );
}
