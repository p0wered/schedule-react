import { load } from 'cheerio';
import type { ClockTime, Day, Discipline, Pair, WeekParity } from '../src/types/schedule.ts';
import { isScheduleSnapshot, type ScheduleSnapshot } from '../src/lib/scheduleSnapshot.ts';

export const SOURCE_URL = 'https://rasp.rsreu.ru/schedule-frame/group?faculty=4&group=2265';
const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const TYPES = { '1': 'lec', '2': 'lab', '3': 'upr' } as const;
const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

interface WeekOption { date: string; parity: WeekParity; current: boolean }
interface ParsedWeek {
  date: string;
  parity: WeekParity;
  options: WeekOption[];
  days: Day[];
}

export function parseWeek(html: string): ParsedWeek {
  const $ = load(html);
  if ($('input[id="field-group"]').attr('value') !== '648М') throw new Error('Unexpected schedule group');
  const options: WeekOption[] = [];
  $('select[name="date"] option').each((_, option) => {
    const date = $(option).attr('value') ?? '';
    if (!date) return;
    const label = $(option).text();
    const parity = label.includes('числ.') ? 'numerator' : label.includes('знам.') ? 'denominator' : null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !parity
      || new Date(`${date}T00:00:00Z`).getUTCDay() !== 1) throw new Error('Invalid schedule week');
    options.push({ date, parity, current: label.includes('(текущая)') });
  });
  const date = $('select[name="date"] option[selected]').attr('value');
  const selected = options.find((option) => option.date === date);
  if (!selected) throw new Error('Missing selected week');
  const table = $('table').filter((_, element) => $(element).find('th').first().text().trim() === 'Время');
  if (table.length !== 1) throw new Error('Missing schedule table');
  const rows = table.find('tr');
  const headers = rows.first().children('th');
  if (headers.length !== 7 || DAY_NAMES.some((name, i) => !$(headers[i + 1]).text().includes(name))) {
    throw new Error('Unexpected schedule columns');
  }
  const days: Day[] = DAY_NAMES.map((name, i) => ({ name, weekday: (i + 1) as Day['weekday'], pairs: [] }));
  if (rows.length < 2) throw new Error('Missing time rows');
  rows.slice(1).each((_, row) => {
    const cells = $(row).children('td');
    if (cells.length !== 7) throw new Error('Unexpected schedule row');
    const times = $(cells[0]).text().match(/\d{2}:\d{2}/g);
    if (times?.length !== 2 || times.some((time) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
      || times[0] >= times[1]) throw new Error('Invalid lesson time');
    cells.slice(1).each((dayIndex, cell) => {
      if (!clean($(cell).text())) return;
      const typeNumber = $(cell).attr('class')?.match(/\bschedule-lesson-type-(\d+)\b/)?.[1];
      const type = TYPES[typeNumber as keyof typeof TYPES];
      const content = $(cell).children('div');
      if (!type || content.length !== 1 || content.find('.schedule-lesson-type-badge').length !== 1) {
        throw new Error('Unsupported lesson structure');
      }
      let name = '';
      for (const node of content.contents().toArray()) {
        if (node.type === 'tag' && node.name === 'br') break;
        if (node.type === 'tag' && $(node).hasClass('schedule-lesson-type-badge')) continue;
        name += $(node).text();
      }
      name = clean(name).replace(/[,\s]+$/, '');
      if (!name) throw new Error('Missing discipline name');
      const teacher = clean(content.find('a[href*="/lecturer?"]').text());
      const room = clean(content.find('a[href*="/classroom?"]').text());
      const discipline: Discipline = { type, name, ...(teacher && { teacher }), ...(room && { room }) };
      const day = days[dayIndex];
      if (day.pairs.some((pair) => pair.time.start === times[0])) throw new Error('Duplicate lesson time');
      (day.pairs as Pair[]).push({
        id: `${day.weekday}-${times[0].replace(':', '')}`,
        time: { start: times[0] as ClockTime, end: times[1] as ClockTime },
        schedule: { kind: 'alternating', [selected.parity]: discipline },
      });
    });
  });
  return { date: selected.date, parity: selected.parity, options, days };
}

async function fetchHtml(url: string, fetcher: typeof fetch): Promise<string> {
  const response = await fetcher(url, {
    signal: AbortSignal.timeout(12_000),
    headers: { Accept: 'text/html', 'User-Agent': 'schedule-react/1.0' },
  });
  if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
    throw new Error(`Schedule source returned ${response.status}`);
  }
  return response.text();
}

export async function fetchSchedule(fetcher: typeof fetch = fetch): Promise<ScheduleSnapshot> {
  const current = parseWeek(await fetchHtml(SOURCE_URL, fetcher));
  if (!current.options.find((option) => option.date === current.date)?.current) {
    throw new Error('Source did not return the current week');
  }
  const opposite = current.options.filter((option) => option.parity !== current.parity);
  const neighbor = opposite.filter((option) => option.date > current.date).sort((a, b) => a.date.localeCompare(b.date))[0]
    ?? opposite.filter((option) => option.date < current.date).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!neighbor) throw new Error('No opposite week published');
  const url = new URL(SOURCE_URL);
  url.searchParams.set('date', neighbor.date);
  const other = parseWeek(await fetchHtml(url.href, fetcher));
  if (other.date !== neighbor.date || other.parity !== neighbor.parity) throw new Error('Wrong week returned');
  const days: Day[] = current.days.map((day, index) => {
    const pairs = new Map(day.pairs.map((pair) => [pair.id, structuredClone(pair)]));
    for (const pair of other.days[index].pairs) {
      const existing = pairs.get(pair.id);
      if (!existing) { pairs.set(pair.id, pair); continue; }
      if (existing.time.end !== pair.time.end) throw new Error('Different lesson times between weeks');
      existing.schedule = { ...existing.schedule, ...pair.schedule };
    }
    return { ...day, pairs: [...pairs.values()].sort((a, b) => a.time.start.localeCompare(b.time.start)) };
  });
  // This date is a parity anchor; the UI takes the actual parity from published weeks.
  const anchor = current.options.filter((option) => option.parity === 'numerator')
    .sort((a, b) => a.date.localeCompare(b.date))[0].date.split('-').map(Number);
  const snapshot: ScheduleSnapshot = {
    schedule: { semesterStart: { year: anchor[0], month: anchor[1], day: anchor[2] },
      header: { titles: ['Числитель', 'Знаменатель'] }, days },
    weeks: { numerator: current.parity === 'numerator' ? current.date : other.date,
      denominator: current.parity === 'denominator' ? current.date : other.date },
    updatedAt: new Date().toISOString(),
  };
  if (!isScheduleSnapshot(snapshot)) throw new Error('Invalid parsed schedule');
  return snapshot;
}
