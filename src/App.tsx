import DayBlock from './components/DayBlock';
import ThemeSwitcher from './components/ThemeSwitcher';
import { scheduleData } from './data/schedule';
import { useCurrentMinute } from './hooks/useCurrentMinute';
import { useTheme } from './hooks/useTheme';
import { getActiveLesson, getWeekInfo } from './lib/schedule';

export default function App() {
  const now = useCurrentMinute();
  const { theme, toggleTheme } = useTheme();
  const weekInfo = getWeekInfo(now, scheduleData.semesterStart);
  const activeLesson = getActiveLesson(scheduleData, now);
  const currentParity = weekInfo.status === 'active' ? weekInfo.parity : null;
  const weekLabel = weekInfo.status === 'active'
    ? `Неделя ${weekInfo.weekNumber}: ${weekInfo.parity === 'numerator' ? 'числитель' : 'знаменатель'}`
    : `До начала семестра: ${weekInfo.daysUntilStart} дн.`;

  return (
    <main className="main">
      <header className="schedule-toolbar" aria-label={weekLabel}>
        <ThemeSwitcher onToggle={toggleTheme} theme={theme} />
        <div className="week-header">
          <p className={`title ${currentParity === 'numerator' ? 'current-week' : ''}`}>
            {scheduleData.header.titles[0]}
          </p>
          <p className={`title ${currentParity === 'denominator' ? 'current-week' : ''}`}>
            {scheduleData.header.titles[1]}
          </p>
        </div>
      </header>

      {scheduleData.days.map((day) => (
        <DayBlock
          key={day.weekday}
          day={day}
          activeLesson={activeLesson}
        />
      ))}
    </main>
  );
}
