import { describe, expect, it } from 'vitest';
import { scheduleData } from '../data/schedule';
import {
  getActiveLesson,
  getWeekInfo,
  millisecondsUntilNextMinute,
} from './schedule';

describe('getWeekInfo', () => {
  it('returns the number of days before the semester starts', () => {
    expect(getWeekInfo(new Date(2026, 7, 28, 12), scheduleData.semesterStart)).toEqual({
      status: 'before-semester',
      daysUntilStart: 3,
    });
  });

  it('switches parity every calendar week', () => {
    expect(getWeekInfo(new Date(2026, 7, 31, 12), scheduleData.semesterStart)).toEqual({
      status: 'active',
      weekNumber: 1,
      parity: 'numerator',
    });
    expect(getWeekInfo(new Date(2026, 8, 7, 12), scheduleData.semesterStart)).toEqual({
      status: 'active',
      weekNumber: 2,
      parity: 'denominator',
    });
  });
});

describe('getActiveLesson', () => {
  it('does not activate a denominator-only lesson on a numerator week', () => {
    expect(getActiveLesson(scheduleData, new Date(2026, 7, 31, 17, 30))).toBeNull();
  });

  it('activates the correct denominator lesson', () => {
    expect(getActiveLesson(scheduleData, new Date(2026, 8, 7, 17, 30))).toEqual({
      pairId: 'mon-1705',
      slot: 'denominator',
      type: 'upr',
    });
  });

  it('does not activate a numerator-only lesson on a denominator week', () => {
    expect(getActiveLesson(scheduleData, new Date(2026, 8, 8, 17, 30))).toBeNull();
  });

  it('activates an every-week lesson on either parity', () => {
    expect(getActiveLesson(scheduleData, new Date(2026, 8, 5, 8, 30))?.slot).toBe('every-week');
    expect(getActiveLesson(scheduleData, new Date(2026, 8, 12, 8, 30))?.slot).toBe('every-week');
  });

  it('treats the end time as exclusive', () => {
    expect(getActiveLesson(scheduleData, new Date(2026, 8, 7, 18, 40))).toBeNull();
  });
});

describe('millisecondsUntilNextMinute', () => {
  it('aligns updates with the next minute boundary', () => {
    expect(millisecondsUntilNextMinute(new Date(2026, 7, 31, 17, 5, 42, 250))).toBe(17_750);
    expect(millisecondsUntilNextMinute(new Date(2026, 7, 31, 17, 5, 0, 0))).toBe(60_000);
  });
});
