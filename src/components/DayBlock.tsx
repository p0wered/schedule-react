import type { ActiveLesson, Day } from '../types/schedule';
import PairBlock from './PairBlock';
import WeekdayBlock from './WeekdayBlock';

interface DayBlockProps {
  day: Day;
  activeLesson: ActiveLesson | null;
}

export default function DayBlock({ day, activeLesson }: DayBlockProps) {
  return (
    <section className="block-one-day" aria-label={day.name}>
      <WeekdayBlock day={day.name} />
      <div className="list-blocks">
        {day.pairs.map((pair) => (
          <PairBlock
            key={pair.id}
            pair={pair}
            activeLesson={activeLesson?.pairId === pair.id ? activeLesson : null}
          />
        ))}
      </div>
    </section>
  );
}
