export type DisciplineType = 'lec' | 'upr' | 'lab';

export interface Discipline {
    type?: DisciplineType;
    name: string;
    teacher?: string;
    room: string;
    isMerged?: boolean;
}

export interface Pair {
    leftDiscipline?: Discipline;
    rightDiscipline?: Discipline;
    time: string;
}

export interface Day {
    name: string;
    pairs: Pair[];
}

export interface ScheduleData {
    header: {
        titles: readonly [string, string];
    };
    days: Day[];
}


