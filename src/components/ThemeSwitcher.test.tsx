import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ThemeSwitcher from './ThemeSwitcher';

describe('ThemeSwitcher', () => {
  it('uses a native button and announces the next theme', () => {
    const onToggle = vi.fn();
    render(<ThemeSwitcher theme="dark" onToggle={onToggle} />);

    const button = screen.getByRole('button', { name: 'Включить светлую тему' });
    fireEvent.click(button);

    expect(onToggle).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute('type', 'button');
  });
});
