import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCurrentMinute } from './useCurrentMinute';

describe('useCurrentMinute', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates on the minute boundary and clears its timer on unmount', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 31, 17, 5, 42, 250));

    const { result, unmount } = renderHook(() => useCurrentMinute());

    act(() => vi.advanceTimersByTime(17_750));

    expect(result.current.getMinutes()).toBe(6);
    expect(result.current.getSeconds()).toBe(0);
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
