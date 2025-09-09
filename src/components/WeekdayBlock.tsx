interface WeekdayBlockProps {
    day: string;
}

export default function WeekdayBlock({ day }: WeekdayBlockProps) {
    return (
        <div className="block block-weekday">
            <p>{day}</p>
        </div>
    );
}