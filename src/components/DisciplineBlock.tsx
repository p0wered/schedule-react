import type { Discipline, DisciplineType } from '../types/schedule';

const TYPE_LABELS: Record<DisciplineType, string> = {
  lec: 'Лек.',
  upr: 'Упр.',
  lab: 'Лаб.',
};

interface DisciplineCardProps {
  discipline: Discipline;
  currentType?: DisciplineType;
}

function getCurrentClass(currentType?: DisciplineType): string | undefined {
  return currentType ? `current-${currentType}` : undefined;
}

function DisciplineContent({ discipline }: { discipline: Discipline }) {
  return (
    <>
      <p>
        <span className={discipline.type}>{TYPE_LABELS[discipline.type]}</span>{' '}
        {discipline.name}
      </p>
      {discipline.teacher || discipline.room ? (
        <div className="block-discipline-inner">
          {discipline.teacher ? <p>{discipline.teacher},</p> : null}
          {discipline.room ? <p>а. {discipline.room}</p> : null}
        </div>
      ) : null}
    </>
  );
}

export function EmptyDisciplineSlot() {
  return <div className="block block-unused" aria-hidden="true" />;
}

export function EveryWeekDisciplineCard({ discipline, currentType }: DisciplineCardProps) {
  const className = [
    'block',
    'block-discipline',
    'block-merged',
    discipline.teacher ? undefined : 'block-merged-centered',
    getCurrentClass(currentType),
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <DisciplineContent discipline={discipline} />
    </div>
  );
}

export default function DisciplineCard({ discipline, currentType }: DisciplineCardProps) {
  const className = ['block', 'block-discipline', getCurrentClass(currentType)]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <DisciplineContent discipline={discipline} />
    </div>
  );
}
