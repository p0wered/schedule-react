import type { Day } from '../types/schedule';
import { areDisciplinesEqual } from '../lib/schedule';

const DEFAULT_PAIR_COUNTS = [2, 3, 2, 2, 2, 2];

function DisciplineSkeleton() {
  return (
    <div className="block block-discipline skeleton-card">
      <div className="skeleton-lines">
        <span className="skeleton-bar skeleton-name" />
        <span className="skeleton-bar skeleton-name-short" />
      </div>
      <span className="skeleton-bar skeleton-details" />
    </div>
  );
}

export default function ScheduleSkeleton({ days }: { days?: readonly Day[] }) {
  const layout = days?.map((day) => ({
    id: day.weekday,
    pairs: day.pairs.map((pair) => ({
      id: pair.id,
      merged: pair.schedule.kind === 'every-week'
        || areDisciplinesEqual(pair.schedule.numerator, pair.schedule.denominator),
    })),
  })) ?? DEFAULT_PAIR_COUNTS.map((count, index) => ({
    id: index + 1,
    pairs: Array.from({ length: count }, (_, pair) => ({ id: `${index}-${pair}`, merged: false })),
  }));

  return layout.map((day) => (
    <div className="block-one-day" key={day.id} aria-hidden="true">
      <div className="block block-weekday skeleton-weekday">
        <span className="skeleton-bar" />
      </div>
      <div className="list-blocks">
        {day.pairs.map((pair) => (
          <div className="block-pair" key={pair.id}>
            <DisciplineSkeleton />
            {!pair.merged ? <DisciplineSkeleton /> : null}
            <div className="block-time skeleton-time">
              <span className="skeleton-bar" />
              <span className="skeleton-bar" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ));
}
