import { describe, expect, it } from 'vitest';
import { getMoscowDate, getSnapshotParity, type ScheduleSnapshot } from './scheduleSnapshot';

const weeks = { numerator: '2026-09-14', denominator: '2026-09-21' };

describe('source week parity', () => {
  it('uses published dates, switches on Monday and disables highlighting for stale weeks', () => {
    const snapshot = { weeks } as ScheduleSnapshot;
    expect(getSnapshotParity(snapshot, new Date(2026, 8, 20, 23, 59))).toBe('numerator');
    expect(getSnapshotParity(snapshot, new Date(2026, 8, 21))).toBe('denominator');
    expect(getSnapshotParity(snapshot, new Date(2026, 8, 28))).toBeNull();
  });
  it('uses Moscow time when the browser is in a different timezone', () => {
    const now = getMoscowDate(new Date('2026-09-20T21:05:00Z'));
    expect(now.getDay()).toBe(1);
    expect(now.getHours()).toBe(0);
    expect(now.getMinutes()).toBe(5);
    expect(getSnapshotParity({ weeks } as ScheduleSnapshot, now)).toBe('denominator');
  });
});
