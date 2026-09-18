import { useEffect, useState } from 'react';
import { isScheduleSnapshot, type ScheduleSnapshot, type ScheduleResponse } from '../lib/scheduleSnapshot';

const CACHE_KEY = 'rsreu-schedule-648m-v1';
let pending: Promise<ScheduleResponse> | null = null;

function loadSaved(): ScheduleSnapshot | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    return isScheduleSnapshot(value) ? value : null;
  } catch { return null; }
}

function requestSchedule(): Promise<ScheduleResponse> {
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}api/schedule.php`, { cache: 'no-store', signal: AbortSignal.timeout(35_000) })
      .then(async (response) => {
        if (!response.ok) throw new Error('Schedule request failed');
        const value: unknown = await response.json();
        if (!isScheduleSnapshot(value) || !('stale' in value) || typeof value.stale !== 'boolean') {
          throw new Error('Invalid schedule response');
        }
        return value as ScheduleResponse;
      }).finally(() => { pending = null; });
  }
  return pending;
}

export function useSchedule() {
  const [snapshot, setSnapshot] = useState<ScheduleSnapshot | null>(loadSaved);
  const [status, setStatus] = useState<'loading' | 'fresh' | 'stale'>('loading');

  useEffect(() => {
    let active = true;
    void requestSchedule().then((value) => {
      if (!active) return;
      const saved = loadSaved();
      const latest = value.stale && saved && Date.parse(saved.updatedAt) > Date.parse(value.updatedAt)
        ? saved : value;
      setSnapshot(latest);
      setStatus(value.stale ? 'stale' : 'fresh');
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(latest)); } catch { /* Storage may be disabled. */ }
    }).catch(() => {
      if (active) setStatus('stale');
    });
    return () => { active = false; };
  }, []);

  return { snapshot, status };
}
