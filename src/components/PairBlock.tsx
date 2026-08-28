import type { ActiveLesson, Discipline, DisciplineType, Pair, WeekParity } from '../types/schedule';
import DisciplineCard, {
  EmptyDisciplineSlot,
  EveryWeekDisciplineCard,
} from './DisciplineBlock';
import TimeBlock from './TimeBlock';

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
  if (pair.schedule.kind === 'every-week') {
    const currentType = activeLesson?.slot === 'every-week' ? activeLesson.type : undefined;

    return (
      <div className="block-pair">
        <EveryWeekDisciplineCard
          discipline={pair.schedule.discipline}
          currentType={currentType}
        />
        <TimeBlock time={pair.time} />
      </div>
    );
  }

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
