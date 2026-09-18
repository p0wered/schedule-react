import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { scheduleData } from './data/schedule';
import type { ScheduleResponse } from './lib/scheduleSnapshot';

const response: ScheduleResponse = {
  schedule: scheduleData, stale: false, updatedAt: '2026-09-18T15:00:00.000Z',
  weeks: { numerator: '2026-09-14', denominator: '2026-09-21' },
};
beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('schedule loading and footer', () => {
  it('shows skeletons while refreshing cached data, then places the update timestamp below the schedule', async () => {
    localStorage.setItem('rsreu-schedule-648m-v1', JSON.stringify(response));
    let finish!: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const { container } = render(<App />);
    const content = container.querySelector('.schedule-content');
    expect(content).toHaveAttribute('aria-busy', 'true');
    expect(content?.querySelector('.skeleton-card')).not.toBeNull();
    expect(screen.queryByText(/НИР практика/)).toBeNull();
    await act(async () => finish(new Response(JSON.stringify(response))));
    await waitFor(() => expect(content).toHaveAttribute('aria-busy', 'false'));
    expect(content?.querySelector('.skeleton-card')).toBeNull();
    expect(screen.getAllByText(/НИР практика/)).toHaveLength(2);
    const footer = container.querySelector('footer');
    expect(content?.nextElementSibling).toBe(footer);
    expect(footer?.querySelector('time')).toHaveAttribute('datetime', response.updatedAt);
  });

  it('replaces skeletons with cached lessons and announces a failed refresh in the footer', async () => {
    localStorage.setItem('rsreu-schedule-648m-v1', JSON.stringify(response));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')));
    const { container } = render(<App />);
    await screen.findByText(/Не удалось обновить расписание/);
    expect(container.querySelector('.skeleton-card')).toBeNull();
    expect(screen.getAllByText(/НИР практика/)).toHaveLength(2);
    expect(container.querySelector('footer time')).toHaveAttribute('datetime', response.updatedAt);
  });
});
