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
          leftDiscipline: { type: 'lab', name: 'Мультимедийные технологии', teacher: 'Поборуева М.С', room: '260' },
          rightDiscipline: { type: 'upr', name: 'Защита информации', teacher: 'Крошилина С.В', room: '206-3' },
          time: '11:40 - 13:15',
        },
        {
          leftDiscipline: { type: 'lab', name: 'Мультимедийные технологии', teacher: 'Поборуева М.С', room: '260' },
          rightDiscipline: { type: 'lec', name: 'CALS-технологии', teacher: 'Таганов А.И', room: '23 БИ' },
          time: '13:35 - 15:10',
        },
        {
          leftDiscipline: { type: 'lec', name: 'CALS-технологии', teacher: 'Таганов А.И', room: '23 БИ' },
          rightDiscipline: { type: 'lab', name: 'Защита информации', teacher: 'Крошилина С.В', room: '206-3' },
          time: '15:20 - 16:55',
        },
      ],
    },
    {
      name: 'Вторник',
      pairs: [
        {
          leftDiscipline: { type: 'lab', name: 'Защита информации', teacher: 'Крошилина С.В', room: '106' },
          rightDiscipline: { type: 'lec', name: 'Web-технологии', teacher: 'Наумов Д.А', room: '333' },
          time: '11:40 - 13:15',
        },
        {
          leftDiscipline: { type: 'lec', name: 'Защита информации', teacher: 'Крошилина С.В', room: '324' },
          rightDiscipline: { type: 'lec', name: 'Мультимедийные технологии', teacher: 'Поборуева М.С', room: '260' },
          time: '13:35 - 15:10',
        },
        {
          leftDiscipline: { type: 'lec', name: 'Web-технологии', teacher: 'Наумов Д.А', room: '333' },
          rightDiscipline: { type: 'lec', name: 'CALS-технологии', teacher: 'Таганов А.И', room: '23 БИ' },
          time: '15:20 - 16:55',
        },
        {
          leftDiscipline: { type: 'upr', name: 'Защита информации', teacher: 'Крошилина С.В', room: '110' },
          rightDiscipline: { type: 'upr', name: 'CALS-технологии', teacher: 'Таганов А.И', room: '23 БИ' },
          time: '17:05 - 18:40',
        },
      ],
    },
    {
      name: 'Четверг',
      pairs: [
        {
          leftDiscipline: { type: 'upr', name: 'Мультимедийные технологии', teacher: 'Поборуева М.С', room: '260' },
          rightDiscipline: undefined,
          time: '11:40 - 13:15',
        },
        {
          leftDiscipline: { type: 'lec', name: 'Мультимедийные технологии', teacher: 'Поборуева М.С', room: '260' },
          rightDiscipline: { type: 'lec', name: 'Защита информации', teacher: 'Крошилина С.В', room: '358' },
          time: '13:35 - 15:10',
        },
        {
          leftDiscipline: { type: 'lec', name: 'CALS-технологии', teacher: 'Таганов А.И', room: '260' },
          rightDiscipline: { type: 'lab', name: 'Web-технологии', teacher: 'Наумов Д.А', room: '414' },
          time: '15:20 - 16:55',
        },
        {
          leftDiscipline: { type: 'upr', name: 'CALS-технологии', teacher: 'Таганов А.И', room: '260' },
          rightDiscipline: { type: 'lab', name: 'Web-технологии', teacher: 'Наумов Д.А', room: '414' },
          time: '17:05 - 18:40',
        },
        {
          leftDiscipline: undefined,
          rightDiscipline: { type: 'upr', name: 'Мультимедийные технологии', teacher: 'Поборуева М.С', room: '260' },
          time: '18:50 - 20:15',
        }
      ],
    },
    {
      name: 'Пятница',
      pairs: [
        {
          leftDiscipline: { type: 'lab', name: 'Web-технологии', teacher: 'Наумов Д.А', room: '260' },
          rightDiscipline: { type: 'lec', name: 'Web-технологии', teacher: 'Наумов Д.А', room: '337' },
          time: '13:35 - 15:10',
        },
        {
          leftDiscipline: { type: 'lec', name: 'Web-технологии', teacher: 'Наумов Д.А', room: '333' },
          rightDiscipline: undefined,
          time: '15:20 - 16:55',
        },
        {
          leftDiscipline: { type: 'lab', name: 'Web-технологии', teacher: 'Наумов Д.А', room: '260' },
          rightDiscipline: undefined,
          time: '17:05 - 18:40',
        }
      ],
    }
  ],
};

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// функция для определения типа недели
function getCurrentWeekType(): boolean {
  const referenceDate = new Date('2026-02-09'); // опорная дата - начало семестра, всегда числитель
  const currentDate = new Date();
  
  const timeDiff = currentDate.getTime() - referenceDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  const weekNumber = Math.floor(daysDiff / 7);
  return weekNumber % 2 === 1;
}

function getWeekInfo(): { weekNumber: number; isDenominator: boolean; weekType: string } {
  const referenceDate = new Date('2026-02-09');
  const currentDate = new Date();
  const timeDiff = currentDate.getTime() - referenceDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(daysDiff / 7);
  const isDenominator = weekNumber % 2 === 1;
  
  return {
    weekNumber: weekNumber + 1,
    isDenominator,
    weekType: isDenominator ? 'Знаменатель' : 'Числитель'
  };
}

export default function App() {
  const [isLight, setIsLight] = useState(false);
  const [currentHighlights, setCurrentHighlights] = useState<Record<string, string | null>>({});
  const [isDenominator, setIsDenominator] = useState(getCurrentWeekType());

  const storageKey = 'schedule_theme';

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const nextIsLight = stored === 'light';
    setIsLight(nextIsLight);
    document.body.classList.toggle('light', nextIsLight);
  }, []);

  useEffect(() => {
    const updateWeekType = () => {
      const newIsDenominator = getCurrentWeekType();
      setIsDenominator(newIsDenominator);

      const weekInfo = getWeekInfo();
      console.log(`Неделя ${weekInfo.weekNumber}: ${weekInfo.weekType}`, weekInfo);
    };

    updateWeekType();

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      updateWeekType();
      const dailyInterval = setInterval(updateWeekType, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimeout);
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
      <div className="block-one-day">
        <ThemeSwitcher onToggle={toggleTheme} isLight={isLight} />
        <div className="list-blocks" style={{justifyContent: 'center'}}>
          <div className="header">
            <p className={`title ${!isDenominator ? 'current-week' : ''}`}>{scheduleData.header.titles[0]}</p>
            <p className={`title ${isDenominator ? 'current-week' : ''}`}>{scheduleData.header.titles[1]}</p>
            {/* костыль для равного расстояния в хедере */}
            <div style={{ minWidth: '45px' }}/>
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