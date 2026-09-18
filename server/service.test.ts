// @vitest-environment node
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createScheduleService } from './service.ts';
import type { ScheduleSnapshot } from '../src/lib/scheduleSnapshot.ts';

const snapshot: ScheduleSnapshot = {
  updatedAt: '2026-09-18T15:00:00.000Z',
  weeks: { numerator: '2026-09-14', denominator: '2026-09-21' },
  schedule: { semesterStart: { year: 2026, month: 8, day: 31 },
    header: { titles: ['Числитель', 'Знаменатель'] },
    days: [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday: weekday as 1 | 2 | 3 | 4 | 5 | 6, name: 'День', pairs: [] })),
  },
};
const directories: string[] = [];
async function cacheFile() {
  const directory = await mkdtemp(join(tmpdir(), 'rsreu-test-'));
  directories.push(directory);
  return join(directory, 'schedule.json');
}
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('schedule refresh and fallback', () => {
  it('requests fresh data on every sequential call and shares concurrent requests', async () => {
    const refresh = vi.fn().mockResolvedValue(snapshot);
    const getSchedule = createScheduleService(await cacheFile(), refresh);
    const [first, second] = await Promise.all([getSchedule(), getSchedule()]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(first.stale).toBe(false);
    await getSchedule();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('persists successful data and restores it after a restart without changing the update timestamp', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const path = await cacheFile();
    await createScheduleService(path, vi.fn().mockResolvedValue(snapshot))();
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(snapshot);
    const getSchedule = createScheduleService(path, vi.fn().mockRejectedValue(new Error('Network down')));
    expect(await getSchedule()).toEqual({ ...snapshot, stale: true });
    expect(JSON.parse(await readFile(path, 'utf8')).updatedAt).toBe(snapshot.updatedAt);
  });

  it('fails honestly when no successful snapshot exists', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(createScheduleService(await cacheFile(), vi.fn().mockRejectedValue(new Error('Network down')))())
      .rejects.toThrow('Network down');
  });
});
