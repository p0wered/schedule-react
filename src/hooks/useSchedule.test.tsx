import { StrictMode } from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSchedule } from './useSchedule';
import type { ScheduleResponse } from '../lib/scheduleSnapshot';

const response: ScheduleResponse = {
  updatedAt: '2026-09-18T15:00:00.000Z', stale: false,
  weeks: { numerator: '2026-09-14', denominator: '2026-09-21' },
  schedule: { semesterStart: { year: 2026, month: 8, day: 31 },
    header: { titles: ['Числитель', 'Знаменатель'] },
    days: [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday: weekday as 1 | 2 | 3 | 4 | 5 | 6, name: 'День', pairs: [] })),
  },
};

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('schedule loading', () => {
  it('requests once in StrictMode, saves the response and requests again on a new mount', async () => {
    const fetcher = vi.fn().mockImplementation(async () => new Response(JSON.stringify(response)));
    vi.stubGlobal('fetch', fetcher);
    const first = renderHook(() => useSchedule(), { wrapper: StrictMode });
    await waitFor(() => expect(first.result.current.status).toBe('fresh'));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('/api/schedule', expect.objectContaining({ cache: 'no-store' }));
    first.unmount();
    const next = renderHook(() => useSchedule());
    expect(next.result.current.snapshot?.updatedAt).toBe(response.updatedAt);
    await waitFor(() => expect(next.result.current.status).toBe('fresh'));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('keeps saved data and the original timestamp when the API is unreachable', async () => {
    localStorage.setItem('rsreu-schedule-648m-v1', JSON.stringify(response));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')));
    const { result } = renderHook(() => useSchedule());
    await waitFor(() => expect(result.current.status).toBe('stale'));
    expect(result.current.snapshot?.updatedAt).toBe(response.updatedAt);
  });

  it('reports server fallback as stale and does not invent data on a first failed load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...response, stale: true }))));
    const first = renderHook(() => useSchedule());
    await waitFor(() => expect(first.result.current.status).toBe('stale'));
    expect(first.result.current.snapshot?.updatedAt).toBe(response.updatedAt);
    first.unmount();
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    const second = renderHook(() => useSchedule());
    await waitFor(() => expect(second.result.current.status).toBe('stale'));
    expect(second.result.current.snapshot).toBeNull();
  });

  it('ignores invalid local cache and rejects an HTML response from a static host', async () => {
    localStorage.setItem('rsreu-schedule-648m-v1', JSON.stringify({ updatedAt: response.updatedAt }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Static host</html>')));
    const { result } = renderHook(() => useSchedule());
    await waitFor(() => expect(result.current.status).toBe('stale'));
    expect(result.current.snapshot).toBeNull();
  });

  it('keeps a newer browser snapshot when a restarted server returns an older fallback', async () => {
    localStorage.setItem('rsreu-schedule-648m-v1', JSON.stringify(response));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ...response, stale: true, updatedAt: '2026-09-17T12:00:00.000Z',
    }))));
    const { result } = renderHook(() => useSchedule());
    await waitFor(() => expect(result.current.status).toBe('stale'));
    expect(result.current.snapshot?.updatedAt).toBe(response.updatedAt);
  });
});
