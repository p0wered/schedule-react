interface TimeBlockProps {
    time: string;
}

export default function TimeBlock({ time }: TimeBlockProps) {
    return (
        <div className="block-time">
            <p>{time}</p>
        </div>
    );
}