import { useEffect, useState } from 'react';
import ThemeSwitcher from './components/ThemeSwitcher';
import DayBlock from './components/DayBlock';
import type { ScheduleData } from './types/schedule';

const dayMap: Record<string, number> = {
  'Понедельник': 1,
  'Вторник': 2,
  'Четверг': 4,
  'Пятница': 5,
  'Суббота': 6,
};

const scheduleData: ScheduleData = {
  header: {
    titles: ['Числитель', 'Знаменатель']
  },
  days: [
    {
      name: 'Понедельник',
      pairs: [
        {
          leftDiscipline: { type: 'lec', name: 'ПиЗУ ИТ-проектами', teacher: 'Таганов А.И', room: '23 БИ' },
          rightDiscipline: undefined,
          time: '11:40 - 13:15',
        },
        {
          leftDiscipline: { type: 'upr', name: 'ОКиНПС', teacher: 'Бодрова И.В', room: '260' },
          rightDiscipline: { type: 'lec', name: 'CASE-ТИ', teacher: 'Таганов А.И', room: '23 БИ' },
          time: '13:35 - 15:10',
        },
        {
          leftDiscipline: { type: 'upr', name: 'ПиЗУ ИТ-проектами', teacher: 'Таганов А.И', room: '23 БИ' },
          rightDiscipline: { type: 'lec', name: 'ОКиНПС', teacher: 'Бодрова И.В', room: '260' },
          time: '15:20 - 16:55',
        },
      ],
    },
    {
      name: 'Вторник',
      pairs: [
        {
          leftDiscipline: { type: 'lec', name: 'СиАОД', teacher: 'Скворцов С.В', room: '301' },
          rightDiscipline: undefined,
          time: '11:40 - 13:15',
        },
        {
          leftDiscipline: { type: 'lab', name: 'Web-технологии', teacher: 'Наумов Д.А, Цыцына М.И', room: '414' },
          rightDiscipline: { type: 'lec', name: 'ОКиНПС', teacher: 'Бодрова И.В', room: '260' },
          time: '13:35 - 15:10',
        },
        {
          leftDiscipline: { type: 'lab', name: 'Web-технологии', teacher: 'Наумов Д.А, Цыцына М.И', room: '414' },
          rightDiscipline: { type: 'lec', name: 'Web-технологии', teacher: 'Наумов Д.А', room: '333' },
          time: '15:20 - 16:55',
        },
        {
          leftDiscipline: undefined,
          rightDiscipline: { type: 'upr', name: 'CASE-ТИ', teacher: 'Таганов А.И', room: '21 БИ' },
          time: '17:05 - 18:40',
        },
      ],
    },
    {
      name: 'Четверг',
      pairs: [
        {
          leftDiscipline: { type: 'lec', name: 'ОКиНПС', teacher: 'Бодрова И.В', room: '260' },
          rightDiscipline: undefined,
          time: '11:40 - 13:15',
        },
        {
          leftDiscipline: { type: 'lec', name: 'CASE-ТИ', teacher: 'Таганов А.И', room: '23 БИ' },
          rightDiscipline: { type: 'lab', name: 'ОКиНПС', teacher: 'Бодрова И.В', room: '260' },
          time: '13:35 - 15:10',
        },
        {
          leftDiscipline: { type: 'lab', name: 'CASE-ТИ', teacher: 'Таганов А.И', room: '23 БИ' },
          rightDiscipline: { type: 'lab', name: 'ОКиНПС', teacher: 'Бодрова И.В', room: '260' },
          time: '15:20 - 16:55',
        },
        {
          leftDiscipline: { type: 'lab', name: 'CASE-ТИ', teacher: 'Таганов А.И', room: '23 БИ' },
          rightDiscipline: undefined,
          time: '17:05 - 18:40',
        },
      ],
    },
    {
      name: 'Пятница',
      pairs: [
        {
          leftDiscipline: undefined,
          rightDiscipline: { type: 'upr', name: 'СиАОД', teacher: 'Скворцов С.В', room: '157а' },
          time: '11:40 - 13:15',
        },
        {
          leftDiscipline: { type: 'lec', name: 'МиТПИ', teacher: 'Васильев Е.П', room: '23 БИ', isMerged: true },
          rightDiscipline: undefined,
          time: '13:35 - 15:10',
        },
        {
          leftDiscipline: { type: 'lec', name: 'Web-технологии', teacher: 'Наумов Д.А', room: '333' },
          rightDiscipline: { type: 'upr', name: 'ОКиНПС', teacher: 'Бодрова И.В', room: '260' },
          time: '15:20 - 16:55',
        },
        {
          leftDiscipline: { type: 'lab', name: 'МиТПИ', teacher: 'Васильев Е.П', room: '21 БИ' },
          rightDiscipline: { type: 'upr', name: 'МиТПИ', teacher: 'Васильев Е.П', room: '21 БИ' },
          time: '17:05 - 18:40',
        },
        {
          leftDiscipline: { type: 'lab', name: 'МиТПИ', teacher: 'Васильев Е.П', room: '21 БИ' },
          rightDiscipline: undefined,
          time: '18:50 - 20:15',
        },
      ],
    },
    {
      name: 'Суббота',
      pairs: [
        {
          leftDiscipline: { type: 'lec', name: 'Методы ИИ', teacher: undefined, room: '203' },
          rightDiscipline: { type: 'upr', name: 'Методы ИИ', teacher: undefined, room: '111а' },
          time: '9:55 - 11:30',
        },
        {
          leftDiscipline: { type: 'upr', name: 'Методы ИИ', teacher: undefined, room: '203' },
          rightDiscipline: { type: 'lec', name: 'СиАОД', teacher: 'Скворцов С.В', room: '301' },
          time: '11:40 - 13:15',
        },
      ],
    },
  ],
};

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export default function App() {
  const [isLight, setIsLight] = useState(false);
  const [currentHighlights, setCurrentHighlights] = useState<Record<string, string | null>>({});

  const storageKey = 'schedule_theme';
  const isDenominator = true;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const nextIsLight = stored === 'light';
    setIsLight(nextIsLight);
    document.body.classList.toggle('light', nextIsLight);
  }, []);

  const toggleTheme = () => {
    const nextIsLight = !isLight;
    setIsLight(nextIsLight);
    document.body.classList.toggle('light', nextIsLight);
    localStorage.setItem(storageKey, nextIsLight ? 'light' : 'dark');
  };

  useEffect(() => {
    const computeHighlights = () => {
      const now = new Date();
      const currentDayNum = now.getDay();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const todayIndex = scheduleData.days.findIndex(d => dayMap[d.name] === currentDayNum);
      if (todayIndex === -1) {
        setCurrentHighlights({});
        return;
      }

      const today = scheduleData.days[todayIndex];
      const newHighlights: Record<string, string | null> = {};

      for (let pairIndex = 0; pairIndex < today.pairs.length; pairIndex++) {
        const pair = today.pairs[pairIndex];
        const [startStr, endStr] = pair.time.split(' - ');
        const start = parseTimeToMinutes(startStr);
        const end = parseTimeToMinutes(endStr);
        if (currentTime >= start && currentTime < end) {
          const activeDiscipline = !pair.rightDiscipline || !isDenominator
            ? pair.leftDiscipline
            : pair.rightDiscipline;
          newHighlights[`${todayIndex}-${pairIndex}`] = activeDiscipline?.type || null;
          break;
        }
      }

      setCurrentHighlights(newHighlights);
    };

    computeHighlights();
    const interval = setInterval(computeHighlights, 60000);
    return () => clearInterval(interval);
  }, [isDenominator]);

  return (
    <div className="main">
      <div className="block-one-day" style={{ marginBottom: '-6px' }}>
        <div className="list-blocks">
          <div className="header">
            <ThemeSwitcher onToggle={toggleTheme} isLight={isLight} />
            <p className="title">{scheduleData.header.titles[0]}</p>
            <p className="title">{scheduleData.header.titles[1]}</p>
            {/* костыль для равного расстояния в хедере */}
            <div style={{ minWidth: '48px' }}/>
          </div>
        </div>
      </div>

      {scheduleData.days.map((dayData, dayIndex) => (
        <DayBlock
          key={dayData.name}
          day={dayData.name}
          pairs={dayData.pairs}
          currentHighlights={currentHighlights}
          dayIndex={dayIndex}
          isDenominator={isDenominator}
        />
      ))}
    </div>
  );
}