import { useEffect, useState } from 'react';
import ThemeSwitcher from './components/ThemeSwitcher';
import DayBlock from './components/DayBlock';
import type { ScheduleData } from './types/schedule';

const dayMap: Record<string, number> = {
  'Понедельник': 1,
  'Вторник': 2,
  'Среда': 3,
  'Четверг': 4,
  'Пятница': 5,
  'Суббота': 6,
};

const semesterStart = new Date(2026, 7, 31);

const scheduleData: ScheduleData = {
  header: {
    titles: ['Числитель', 'Знаменатель']
  },
  days: [
    {
      name: 'Понедельник',
      pairs: [
        {
          rightDiscipline: { type: 'upr', name: 'Интернет-технологии', teacher: 'доц. Гостин А.М.', room: '414 C' },
          time: '17:05 - 18:40',
        },
      ],
    },
    {
      name: 'Вторник',
      pairs: [
        {
          leftDiscipline: { type: 'lec', name: 'Методы и технологии управления ИТ-проектами', teacher: 'проф. Таганов А.И.', room: '21 B' },
          time: '17:05 - 18:40',
        },
        {
          leftDiscipline: { type: 'lec', name: 'Управление научно-исследовательскими и опытно-конструкторскими работами', teacher: 'проф. Таганов А.И.', room: '23 B' },
          rightDiscipline: { type: 'lec', name: 'Вычислительные системы', teacher: 'доц. Елесина С.И.', room: '337 C' },
          time: '18:50 - 20:15',
        },
        {
          rightDiscipline: { type: 'lec', name: 'Современная философия и методология науки', teacher: 'доц. Щевьёв А.А.', room: '448 C' },
          time: '20:25 - 21:50',
        },
      ],
    },
    {
      name: 'Среда',
      pairs: [
        {
          leftDiscipline: { type: 'lec', name: 'Аэрокосмические системы и технологии обработки информации', teacher: 'доц. Ушенкин В.А.', room: '260 C' },
          time: '17:05 - 18:40',
        },
        {
          leftDiscipline: { type: 'lec', name: 'Технологии разработки программного обеспечения', teacher: 'доц. Громов А.Ю.', room: '448 C' },
          rightDiscipline: { type: 'lab', name: 'Методы и технологии управления ИТ-проектами', teacher: 'проф. Таганов А.И.', room: '23 B' },
          time: '18:50 - 20:15',
        },
      ],
    },
    {
      name: 'Четверг',
      pairs: [
        {
          leftDiscipline: { type: 'lec', name: 'Вычислительные системы', teacher: 'доц. Елесина С.И.', room: '324 C' },
          time: '17:05 - 18:40',
        },
        {
          rightDiscipline: { type: 'upr', name: 'Вычислительные системы', teacher: 'ст. преп. Дудко И.С.', room: '404 C' },
          time: '18:50 - 20:15',
        },
      ],
    },
    {
      name: 'Пятница',
      pairs: [
        {
          leftDiscipline: { type: 'upr', name: 'Вычислительные системы', teacher: 'ст. преп. Дудко И.С.', room: '209 C' },
          time: '17:05 - 18:40',
        },
        {
          leftDiscipline: { type: 'upr', name: 'Технологии разработки программного обеспечения', teacher: 'асс. Сидоров А.М.', room: '02/2 B' },
          rightDiscipline: { type: 'lab', name: 'Аэрокосмические системы и технологии обработки информации', teacher: 'доц. Ушенкин В.А.', room: '260 C' },
          time: '18:50 - 20:15',
        },
        {
          rightDiscipline: { type: 'upr', name: 'Современная философия и методология науки', teacher: 'доц. Щевьёв А.А.', room: '450 C' },
          time: '20:25 - 21:50',
        },
      ],
    },
    {
      name: 'Суббота',
      pairs: [
        {
          leftDiscipline: { type: 'upr', name: 'НИР практика/Научно-исследовательская практика', isMerged: true },
          time: '08:10 - 09:45',
        },
        {
          leftDiscipline: { type: 'upr', name: 'НИР практика/Научно-исследовательская практика', isMerged: true },
          time: '09:55 - 11:30',
        },
        {
          leftDiscipline: { type: 'lec', name: 'Интернет-технологии', teacher: 'доц. Гостин А.М.', room: '403 C' },
          time: '11:40 - 13:15',
        },
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
  const currentDate = new Date();
  
  const timeDiff = currentDate.getTime() - semesterStart.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  const weekNumber = Math.floor(daysDiff / 7);
  return weekNumber % 2 === 1;
}

function getWeekInfo(): { weekNumber: number; isDenominator: boolean; weekType: string } {
  const currentDate = new Date();
  const timeDiff = currentDate.getTime() - semesterStart.getTime();
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
