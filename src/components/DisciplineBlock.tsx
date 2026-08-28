import type { DisciplineType } from '../types/schedule';

interface DisciplineBlockProps {
    type?: DisciplineType;
    discipline: string;
    teacher?: string;
    room?: string;
    isUnused?: boolean;
    isMerged?: boolean;
    currentType?: string | null;
}

export default function DisciplineBlock({
    type,
    discipline,
    teacher,
    room,
    isUnused = false,
    isMerged = false,
    currentType = null,
}: DisciplineBlockProps) {
    const typeSpan = type ? (
        <span className={type}>
            {type === 'lec' ? 'Лек.' : type === 'upr' ? 'Упр.' : 'Лаб.'}
        </span>
    ) : null;

    const currentClass = currentType ? `current-${currentType}` : undefined;
    const blockClasses = [
        'block',
        'block-discipline',
        isMerged ? 'block-merged' : undefined,
        currentClass,
    ].filter(Boolean).join(' ');

    if (isUnused) {
        return <div className={[ 'block', 'block-unused', currentClass ].filter(Boolean).join(' ')} />;
    }

    return (
        <div className={blockClasses}>
            <p>
                {typeSpan} {discipline}
            </p>
            {(teacher || room) && (
                <div className="block-discipline-inner">
                    {teacher && <p>{teacher},</p>}
                    {room && <p>а. {room}</p>}
                </div>
            )}
        </div>
    );
}
