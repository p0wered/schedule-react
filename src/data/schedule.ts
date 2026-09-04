import type { ScheduleData } from '../types/schedule';

export const scheduleData = {
  semesterStart: { year: 2026, month: 8, day: 31 },
  header: {
    titles: ['Числитель', 'Знаменатель'],
  },
  days: [
    {
      weekday: 1,
      name: 'Понедельник',
      pairs: [
        {
          id: 'mon-1705',
          schedule: {
            kind: 'alternating',
            denominator: { type: 'upr', name: 'Интернет-технологии', teacher: 'доц. Гостин А.М.', room: '414 C' },
          },
          time: { start: '17:05', end: '18:40' },
        },
      ],
    },
    {
      weekday: 2,
      name: 'Вторник',
      pairs: [
        {
          id: 'tue-1705',
          schedule: {
            kind: 'alternating',
            numerator: { type: 'lec', name: 'МиТУИП', teacher: 'проф. Таганов А.И.', room: '21 B' },
          },
          time: { start: '17:05', end: '18:40' },
        },
        {
          id: 'tue-1850',
          schedule: {
            kind: 'alternating',
            numerator: { type: 'lec', name: 'УНИиОКР', teacher: 'проф. Таганов А.И.', room: '23 B' },
            denominator: { type: 'lec', name: 'Вычислительные системы', teacher: 'доц. Елесина С.И.', room: '337 C' },
          },
          time: { start: '18:50', end: '20:15' },
        },
        {
          id: 'tue-2025',
          schedule: {
            kind: 'alternating',
            denominator: { type: 'lec', name: 'Современная философия и методология науки', teacher: 'доц. Щевьёв А.А.', room: '448 C' },
          },
          time: { start: '20:25', end: '21:50' },
        },
      ],
    },
    {
      weekday: 3,
      name: 'Среда',
      pairs: [
        {
          id: 'wed-1705',
          schedule: {
            kind: 'alternating',
            numerator: { type: 'lec', name: 'АСиТОИ', teacher: 'доц. Ушенкин В.А.', room: '260 C' },
          },
          time: { start: '17:05', end: '18:40' },
        },
        {
          id: 'wed-1850',
          schedule: {
            kind: 'alternating',
            numerator: { type: 'lec', name: 'Технологии разработки ПО', teacher: 'доц. Громов А.Ю.', room: '448 C' },
            denominator: { type: 'lab', name: 'МиТУИП', teacher: 'проф. Таганов А.И.', room: '23 B' },
          },
          time: { start: '18:50', end: '20:15' },
        },
      ],
    },
    {
      weekday: 4,
      name: 'Четверг',
      pairs: [
        {
          id: 'thu-1705',
          schedule: {
            kind: 'alternating',
            numerator: { type: 'lec', name: 'Вычислительные системы', teacher: 'доц. Елесина С.И.', room: '324 C' },
            denominator: { type: 'upr', name: 'Современная философия и методология науки', teacher: 'доц. Щевьёв А.А.', room: '450 C' },
          },
          time: { start: '17:05', end: '18:40' },
        },
        {
          id: 'thu-1850',
          schedule: {
            kind: 'alternating',
            denominator: { type: 'upr', name: 'Вычислительные системы', teacher: 'ст. преп. Дудко И.С.', room: '404 C' },
          },
          time: { start: '18:50', end: '20:15' },
        },
      ],
    },
    {
      weekday: 5,
      name: 'Пятница',
      pairs: [
        {
          id: 'fri-1705',
          schedule: {
            kind: 'alternating',
            numerator: { type: 'upr', name: 'Вычислительные системы', teacher: 'ст. преп. Дудко И.С.', room: '209 C' },
          },
          time: { start: '17:05', end: '18:40' },
        },
        {
          id: 'fri-1850',
          schedule: {
            kind: 'alternating',
            numerator: { type: 'upr', name: 'Технологии разработки ПО', teacher: 'асс. Сидоров А.М.', room: '448 C' },
            denominator: { type: 'lab', name: 'АСиТОИ', teacher: 'доц. Ушенкин В.А.', room: '260 C' },
          },
          time: { start: '18:50', end: '20:15' },
        },
      ],
    },
    {
      weekday: 6,
      name: 'Суббота',
      pairs: [
        {
          id: 'sat-0810',
          schedule: {
            kind: 'every-week',
            discipline: { type: 'upr', name: 'НИР практика/Научно-исследовательская практика' },
          },
          time: { start: '08:10', end: '09:45' },
        },
        {
          id: 'sat-0955',
          schedule: {
            kind: 'every-week',
            discipline: { type: 'upr', name: 'НИР практика/Научно-исследовательская практика' },
          },
          time: { start: '09:55', end: '11:30' },
        },
        {
          id: 'sat-1335',
          schedule: {
            kind: 'alternating',
            numerator: { type: 'lec', name: 'Интернет-технологии', teacher: 'доц. Гостин А.М.', room: '403 C' },
          },
          time: { start: '13:35', end: '15:10' },
        },
      ],
    },
  ],
} satisfies ScheduleData;
