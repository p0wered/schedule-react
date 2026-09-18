import type { ScheduleData, WeekParity } from '../types/schedule';

export interface ScheduleSnapshot {
  schedule: ScheduleData;
  updatedAt: string;
  weeks: Record<WeekParity, string>;
}

export interface ScheduleResponse extends ScheduleSnapshot {
  stale: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

export function isScheduleSnapshot(value: unknown): value is ScheduleSnapshot {
  if (!isRecord(value) || typeof value.updatedAt !== 'string'
    || !Number.isFinite(Date.parse(value.updatedAt)) || !isRecord(value.weeks)) return false;
  const weeks = value.weeks;
  if (!['numerator', 'denominator'].every((parity) => (
    typeof weeks[parity] === 'string'
      && /^\d{4}-\d{2}-\d{2}$/.test(weeks[parity])
      && new Date(`${weeks[parity]}T00:00:00Z`).getUTCDay() === 1
  ))) return false;
  if (value.weeks.numerator === value.weeks.denominator) return false;
  const data = value.schedule;
  if (!isRecord(data) || !isRecord(data.semesterStart) || !isRecord(data.header)
    || !Array.isArray(data.header.titles) || data.header.titles.length !== 2
    || !data.header.titles.every((title) => typeof title === 'string')
    || !Array.isArray(data.days) || data.days.length !== 6) return false;
  const anchor = data.semesterStart;
  if (!['year', 'month', 'day'].every((key) => Number.isInteger(anchor[key]))) return false;
  const ids = new Set<string>();
  const weekdays = new Set<number>();
  const isDiscipline = (lesson: unknown) => isRecord(lesson)
    && ['lec', 'lab', 'upr'].includes(String(lesson.type))
    && typeof lesson.name === 'string' && lesson.name.trim().length > 0
    && (lesson.teacher === undefined || typeof lesson.teacher === 'string')
    && (lesson.room === undefined || typeof lesson.room === 'string');
  const timeMinutes = (time: unknown) => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) : NaN;
  return data.days.every((day: unknown) => {
    if (!isRecord(day) || typeof day.weekday !== 'number' || !Number.isInteger(day.weekday)
      || day.weekday < 1 || day.weekday > 6 || weekdays.has(day.weekday)
      || typeof day.name !== 'string' || !Array.isArray(day.pairs)) return false;
    weekdays.add(day.weekday);
    return day.pairs.every((pair: unknown) => {
      if (!isRecord(pair) || typeof pair.id !== 'string' || ids.has(pair.id)
        || !isRecord(pair.time) || !(timeMinutes(pair.time.start) < timeMinutes(pair.time.end))
        || !isRecord(pair.schedule)) return false;
      ids.add(pair.id);
      const slots = pair.schedule;
      return slots.kind === 'every-week' ? isDiscipline(slots.discipline)
        : slots.kind === 'alternating' && (slots.numerator !== undefined || slots.denominator !== undefined)
          && (slots.numerator === undefined || isDiscipline(slots.numerator))
          && (slots.denominator === undefined || isDiscipline(slots.denominator));
    });
  });
}

export function getMoscowDate(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
  return new Date(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'));
}

export function getSnapshotParity(snapshot: ScheduleSnapshot, now: Date): WeekParity | null {
  const monday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const date = monday.toISOString().slice(0, 10);
  if (snapshot.weeks.numerator === date) return 'numerator';
  if (snapshot.weeks.denominator === date) return 'denominator';
  return null;
}
