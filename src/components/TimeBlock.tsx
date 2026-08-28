import type { TimeRange } from '../types/schedule';

interface TimeBlockProps {
  time: TimeRange;
}

export default function TimeBlock({ time }: TimeBlockProps) {
  return (
    <div className="block-time">
      <p>{time.start} - {time.end}</p>
    </div>
  );
}
