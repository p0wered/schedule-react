import type { ActiveLesson, Discipline, DisciplineType, Pair, WeekParity } from '../types/schedule';
import DisciplineCard, {
  EmptyDisciplineSlot,
  EveryWeekDisciplineCard,
} from './DisciplineBlock';
import TimeBlock from './TimeBlock';
import { areDisciplinesEqual } from '../lib/schedule';

interface PairBlockProps {
  pair: Pair;
  activeLesson: ActiveLesson | null;
}

function AlternatingSlot({
  discipline,
  parity,
  activeLesson,
}: {
  discipline?: Discipline;
  parity: WeekParity;
  activeLesson: ActiveLesson | null;
}) {
  if (!discipline) return <EmptyDisciplineSlot />;

  const currentType: DisciplineType | undefined = activeLesson?.slot === parity
    ? activeLesson.type
    : undefined;

  return <DisciplineCard discipline={discipline} currentType={currentType} />;
}

export default function PairBlock({ pair, activeLesson }: PairBlockProps) {
  const mergedDiscipline = pair.schedule.kind === 'every-week' ? pair.schedule.discipline
    : areDisciplinesEqual(pair.schedule.numerator, pair.schedule.denominator)
      ? pair.schedule.numerator : undefined;

  if (mergedDiscipline) {
    const currentType = activeLesson?.type;

    return (
      <div className="block-pair">
        <EveryWeekDisciplineCard
          discipline={mergedDiscipline}
          currentType={currentType}
        />
        <TimeBlock time={pair.time} />
      </div>
    );
  }

  if (pair.schedule.kind === 'every-week') return null;

  return (
    <div className="block-pair">
      <AlternatingSlot
        discipline={pair.schedule.numerator}
        parity="numerator"
        activeLesson={activeLesson}
      />
      <AlternatingSlot
        discipline={pair.schedule.denominator}
        parity="denominator"
        activeLesson={activeLesson}
      />
      <TimeBlock time={pair.time} />
    </div>
  );
}
