import DayBlock from './components/DayBlock';
import ThemeSwitcher from './components/ThemeSwitcher';
import ScheduleSkeleton from './components/ScheduleSkeleton';
import { useSchedule } from './hooks/useSchedule';
import { useCurrentMinute } from './hooks/useCurrentMinute';
import { useTheme } from './hooks/useTheme';
import { getActiveLesson } from './lib/schedule';
import { getMoscowDate, getSnapshotParity } from './lib/scheduleSnapshot';

export default function App() {
  const now = getMoscowDate(useCurrentMinute());
  const { theme, toggleTheme } = useTheme();
  const { snapshot, status } = useSchedule();
  const scheduleData = snapshot?.schedule;
  const currentParity = snapshot ? getSnapshotParity(snapshot, now) : null;
  const activeLesson = scheduleData ? getActiveLesson(scheduleData, now, currentParity) : null;
  const weekLabel = currentParity
    ? `Текущая неделя: ${currentParity === 'numerator' ? 'числитель' : 'знаменатель'}`
    : 'Расписание занятий';

  return (
    <main className="main">
      <header className="schedule-toolbar" aria-label={weekLabel}>
        <ThemeSwitcher onToggle={toggleTheme} theme={theme} />
        <div className="week-header">
          <p className={`title ${currentParity === 'numerator' ? 'current-week' : ''}`}>
            Числитель
          </p>
          <p className={`title ${currentParity === 'denominator' ? 'current-week' : ''}`}>
            Знаменатель
          </p>
        </div>
      </header>

      <div className="schedule-content" aria-label="Расписание занятий" aria-busy={status === 'loading'}>
        {status === 'loading' ? <ScheduleSkeleton days={scheduleData?.days} /> : scheduleData?.days.map((day) => (
          <DayBlock
            key={day.weekday}
            day={day}
            activeLesson={activeLesson}
          />
        ))}
      </div>

      <footer className="schedule-status" role="status" aria-live="polite">
        {snapshot ? (
          <p>Обновлено: <time dateTime={snapshot.updatedAt}>{new Intl.DateTimeFormat('ru-RU', {
            timeZone: 'Europe/Moscow', dateStyle: 'short', timeStyle: 'short',
          }).format(new Date(snapshot.updatedAt))}</time></p>
        ) : null}
        {status === 'stale' ? <p className="schedule-error">Не удалось обновить расписание.
          {snapshot ? ' Показана последняя сохранённая версия.' : ' Сохранённого расписания пока нет.'}</p> : null}
        {snapshot && !currentParity && status !== 'loading' ? (
          <p className="schedule-error">Сохранённые недели не включают текущую. Подсветка пар отключена.</p>
        ) : null}
        {status === 'stale' ? (
          <a href="https://rasp.rsreu.ru/schedule-frame/group?faculty=4&group=2265" target="_blank" rel="noreferrer">
            Открыть расписание РГРТУ
          </a>
        ) : null}
      </footer>
    </main>
  );
}
