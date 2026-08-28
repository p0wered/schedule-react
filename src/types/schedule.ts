export type DisciplineType = 'lec' | 'upr' | 'lab';

export type WeekParity = 'numerator' | 'denominator';

export type PairSlot = WeekParity | 'every-week';

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6;

export type ClockTime = `${number}${number}:${number}${number}`;

export interface LocalDate {
  year: number;
  month: number;
  day: number;
}

export interface Discipline {
  type: DisciplineType;
  name: string;
  teacher?: string;
  room?: string;
}

export interface TimeRange {
  start: ClockTime;
  end: ClockTime;
}

export type PairSchedule =
  | {
      kind: 'alternating';
      numerator?: Discipline;
      denominator?: Discipline;
    }
  | {
      kind: 'every-week';
      discipline: Discipline;
    };

export interface Pair {
  id: string;
  time: TimeRange;
  schedule: PairSchedule;
}

export interface Day {
  weekday: Weekday;
  name: string;
  pairs: readonly Pair[];
}

export interface ScheduleData {
  semesterStart: LocalDate;
  header: {
    titles: readonly [string, string];
  };
  days: readonly Day[];
}

export type WeekInfo =
  | {
      status: 'before-semester';
      daysUntilStart: number;
    }
  | {
      status: 'active';
      weekNumber: number;
      parity: WeekParity;
    };

export interface ActiveLesson {
  pairId: string;
  slot: PairSlot;
  type: DisciplineType;
}
