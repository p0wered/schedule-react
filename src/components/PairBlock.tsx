import DisciplineBlock from './DisciplineBlock';
import TimeBlock from './TimeBlock';
import type { Discipline } from '../types/schedule';

interface PairProps {
    leftDiscipline?: Discipline;
    rightDiscipline?: Discipline;
    time: string;
    currentType?: string | null;
    isDenominator: boolean;
}

export default function PairBlock({ 
    leftDiscipline, 
    rightDiscipline, 
    time, 
    currentType, 
    isDenominator 
}: PairProps) {
    const leftCurrentType = currentType && (!rightDiscipline || !isDenominator) ? currentType : null;
    const rightCurrentType = currentType && rightDiscipline && isDenominator ? currentType : null;

    return (
        <div className="block-pair">
            <DisciplineBlock
                type={leftDiscipline?.type}
                discipline={leftDiscipline?.name || ''}
                teacher={leftDiscipline?.teacher}
                room={leftDiscipline?.room || ''}
                isUnused={!leftDiscipline}
                isMerged={leftDiscipline?.isMerged || false}
                currentType={leftCurrentType}
            />
            <DisciplineBlock
                type={rightDiscipline?.type}
                discipline={rightDiscipline?.name || ''}
                teacher={rightDiscipline?.teacher}
                room={rightDiscipline?.room || ''}
                isUnused={!rightDiscipline}
                isMerged={rightDiscipline?.isMerged || false}
                currentType={rightCurrentType}
            />
            <TimeBlock time={time} />
        </div>
    );
}