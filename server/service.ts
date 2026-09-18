import { readFile, mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { isScheduleSnapshot, type ScheduleSnapshot, type ScheduleResponse } from '../src/lib/scheduleSnapshot.ts';
import { fetchSchedule } from './rsreu.ts';

export function createScheduleService(cachePath: string, refresh = fetchSchedule) {
  let saved: ScheduleSnapshot | null = null;
  let pending: Promise<ScheduleResponse> | null = null;
  const restored = readFile(cachePath, 'utf8').then((text) => {
    const value: unknown = JSON.parse(text);
    if (isScheduleSnapshot(value)) saved = value;
  }).catch(() => { /* A missing or damaged cache must not prevent a fresh request. */ });

  async function update(): Promise<ScheduleResponse> {
    await restored;
    try {
      const snapshot = await refresh();
      if (!isScheduleSnapshot(snapshot)) throw new Error('Invalid schedule snapshot');
      saved = snapshot;
      try {
        await mkdir(dirname(cachePath), { recursive: true });
        const temporary = `${cachePath}.${randomUUID()}.tmp`;
        await writeFile(temporary, JSON.stringify(snapshot), 'utf8');
        await rename(temporary, cachePath);
      } catch (error) {
        console.error('Could not persist schedule cache:', error);
      }
      return { ...snapshot, stale: false };
    } catch (error) {
      console.error('Could not refresh RSREU schedule:', error);
      if (saved) return { ...saved, stale: true };
      throw error;
    }
  }

  return () => {
    // Share simultaneous requests, but request the source again on the next page load.
    if (!pending) pending = update().finally(() => { pending = null; });
    return pending;
  };
}
