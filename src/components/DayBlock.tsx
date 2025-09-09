import WeekdayBlock from './WeekdayBlock';
import PairBlock from './PairBlock';
import type { Pair } from '../types/schedule';

interface DayBlockProps {
    day: string;
    pairs: Pair[];
    currentHighlights: Record<string, string | null>;
    dayIndex: number;
    isDenominator: boolean;
}

export default function DayBlock({ 
    day, 
    pairs, 
    currentHighlights, 
    dayIndex, 
    isDenominator 
}: DayBlockProps) {
    return (
        <div className="block-one-day">
            <WeekdayBlock day={day} />
            <div className="list-blocks">
                {pairs.map((pair, pairIndex) => (
                    <PairBlock
                        key={pairIndex}
                        leftDiscipline={pair.leftDiscipline}
                        rightDiscipline={pair.rightDiscipline}
                        time={pair.time}
                        currentType={currentHighlights[`${dayIndex}-${pairIndex}`]}
                        isDenominator={isDenominator}
                    />
                ))}
            </div>
        </div>
    );
}