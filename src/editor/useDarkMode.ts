import { useCallback, useEffect, useState } from 'react';

// Dark CHROME toggle. Flips `data-theme="dark"` on <html>, which the design system's dark.css
// keys off of. It re-skins ONLY the editor chrome (DS dark.css overrides chrome aliases + effects,
// never the user's design Theme), so the board content is unaffected — the golden rule holds.
const STORAGE_KEY = 'easydesign:theme';

type Mode = 'light' | 'dark';

function initialMode(): Mode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore — fall through to system preference
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useDarkMode(): { isDark: boolean; toggle: () => void } {
  const [mode, setMode] = useState<Mode>(initialMode);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') root.dataset.theme = 'dark';
    else delete root.dataset.theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore quota / private-mode errors — preference is best-effort
    }
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((m) => (m === 'dark' ? 'light' : 'dark'));
  }, []);

  return { isDark: mode === 'dark', toggle };
}
