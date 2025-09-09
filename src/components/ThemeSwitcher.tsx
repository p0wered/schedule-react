import type { KeyboardEvent } from 'react';
import IconSun from "../assets/IconSun.tsx";
import IconMoon from "../assets/IconMoon.tsx";

interface ThemeSwitcherProps {
    onToggle: () => void;
    isLight: boolean;
}

export default function ThemeSwitcher({ onToggle, isLight }: ThemeSwitcherProps) {
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
        }
    };

    return (
        <div
            className="theme-switcher"
            role="button"
            tabIndex={0}
            aria-pressed={isLight}
            aria-label="Переключить тему"
            onClick={onToggle}
            onKeyDown={handleKeyDown}
        >
            <IconSun />
            <IconMoon />
        </div>
    );
}