import IconMoon from '../assets/IconMoon';
import IconSun from '../assets/IconSun';
import type { Theme } from '../lib/theme';

interface ThemeSwitcherProps {
  onToggle: () => void;
  theme: Theme;
}

export default function ThemeSwitcher({ onToggle, theme }: ThemeSwitcherProps) {
  const nextThemeLabel = theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему';

  return (
    <button
      type="button"
      className="theme-switcher"
      aria-label={nextThemeLabel}
      title={nextThemeLabel}
      onClick={onToggle}
    >
      <IconSun />
      <IconMoon />
    </button>
  );
}
