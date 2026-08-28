import type {
  ActiveLesson,
  ClockTime,
  LocalDate,
  ScheduleData,
  WeekInfo,
} from '../types/schedule';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function toCalendarDay(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function localDateToCalendarDay(date: LocalDate): number {
  return Date.UTC(date.year, date.month - 1, date.day);
}

export function parseTimeToMinutes(time: ClockTime): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getWeekInfo(now: Date, semesterStart: LocalDate): WeekInfo {
  const daysFromStart = Math.round(
    (toCalendarDay(now) - localDateToCalendarDay(semesterStart)) / MILLISECONDS_PER_DAY,
  );

  if (daysFromStart < 0) {
    return {
      status: 'before-semester',
      daysUntilStart: Math.abs(daysFromStart),
    };
  }

  const weekIndex = Math.floor(daysFromStart / 7);

  return {
    status: 'active',
    weekNumber: weekIndex + 1,
    parity: weekIndex % 2 === 0 ? 'numerator' : 'denominator',
  };
}

export function getActiveLesson(schedule: ScheduleData, now: Date): ActiveLesson | null {
  const weekInfo = getWeekInfo(now, schedule.semesterStart);
  if (weekInfo.status === 'before-semester') return null;

  const currentDay = schedule.days.find((day) => day.weekday === now.getDay());
  if (!currentDay) return null;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const pair = currentDay.pairs.find(({ time }) => (
    currentTime >= parseTimeToMinutes(time.start)
      && currentTime < parseTimeToMinutes(time.end)
  ));

  if (!pair) return null;

  if (pair.schedule.kind === 'every-week') {
    return {
      pairId: pair.id,
      slot: 'every-week',
      type: pair.schedule.discipline.type,
    };
  }

  const discipline = pair.schedule[weekInfo.parity];
  if (!discipline) return null;

  return {
    pairId: pair.id,
    slot: weekInfo.parity,
    type: discipline.type,
  };
}

export function millisecondsUntilNextMinute(now: Date): number {
  return 60_000 - (now.getSeconds() * 1_000 + now.getMilliseconds());
}
