import { useEffect, useState } from 'react';
import { millisecondsUntilNextMinute } from '../lib/schedule';

export function useCurrentMinute(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let minuteTimeout: ReturnType<typeof setTimeout>;

    const scheduleNextMinute = () => {
      minuteTimeout = setTimeout(() => {
        setNow(new Date());
        scheduleNextMinute();
      }, millisecondsUntilNextMinute(new Date()));
    };

    scheduleNextMinute();

    return () => {
      clearTimeout(minuteTimeout);
    };
  }, []);

  return now;
}
