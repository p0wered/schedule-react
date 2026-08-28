export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'schedule:theme:v1';
const LEGACY_THEME_STORAGE_KEY = 'schedule_theme';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

export function loadPreferredTheme(): Theme {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(storedTheme)) return storedTheme;

    const legacyTheme = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (isTheme(legacyTheme)) return legacyTheme;
  } catch {
    // Storage may be unavailable in private browsing or restricted environments.
  }

  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.style.colorScheme = theme;
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
  } catch {
    // The in-memory theme still works when persistence is unavailable.
  }
}
