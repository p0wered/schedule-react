import type { Discipline, DisciplineType } from '../types/schedule';
import { getDisciplineDisplayName } from '../lib/disciplineNames';

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
  const displayName = getDisciplineDisplayName(discipline.name);
  return (
    <>
      <p>
        <span className={discipline.type}>{TYPE_LABELS[discipline.type]}</span>{' '}
        {displayName !== discipline.name ? (
          <abbr className="discipline-name" title={discipline.name}>{displayName}</abbr>
        ) : discipline.name}
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
