import { type ReactElement } from 'react';

import { baseLiterals } from './literals';
import { useEditor } from './store';

const SWATCHES: { key: string; label: string }[] = [
  { key: 'color-brand', label: 'Brand' },
  { key: 'color-surface', label: 'Surface' },
  { key: 'color-page', label: 'Page' },
  { key: 'color-text', label: 'Text' },
];

function baseHex(key: string): string {
  const value = baseLiterals[key];
  return typeof value === 'string' ? value : '#000000';
}

/** The Design Palette: edit Theme tokens once and re-theme every Frame live (ADR-0004). */
export function ThemePanel(): ReactElement {
  const overrides = useEditor((s) => s.themeOverrides);
  const setThemeOverride = useEditor((s) => s.setThemeOverride);

  return (
    <section className="ed-panel">
      <h3>Theme</h3>
      <p className="ed-hint">Edit once — re-themes every Frame</p>
      {SWATCHES.map(({ key, label }) => (
        <label key={key} className="ed-field ed-swatch">
          <span>{label}</span>
          <input
            type="color"
            value={overrides[key] ?? baseHex(key)}
            onChange={(e) => {
              setThemeOverride(key, e.target.value);
            }}
          />
        </label>
      ))}
    </section>
  );
}
