// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { fetchSchedule, parseWeek } from './rsreu.ts';

const numerator = await readFile(new URL('../src/test/fixtures/rsreu-numerator.html', import.meta.url), 'utf8');
const denominator = await readFile(new URL('../src/test/fixtures/rsreu-denominator.html', import.meta.url), 'utf8');
const htmlResponse = (html: string) => new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

describe('RSREU parser', () => {
  it('extracts full names, times, types, teacher and room from real HTML', () => {
    const week = parseWeek(numerator);
    expect(week.date).toBe('2026-09-14');
    expect(week.parity).toBe('numerator');
    expect(week.days.flatMap((day) => day.pairs)).toHaveLength(9);
    expect(week.days[1].pairs[0]).toEqual({
      id: '2-1705', time: { start: '17:05', end: '18:40' },
      schedule: { kind: 'alternating', numerator: {
        type: 'lec', name: 'Методы и технологии управления ИТ-проектами',
        teacher: 'проф. Таганов А.И.', room: '21 B',
      } },
    });
    expect(week.days[5].pairs[0].schedule).toEqual({ kind: 'alternating', numerator: {
      type: 'upr', name: 'НИР практика/Научно-исследовательская практика',
    } });
  });

  it('loads the next opposite week and merges by day and time without assuming repetition', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(htmlResponse(numerator))
      .mockResolvedValueOnce(htmlResponse(denominator));
    const result = await fetchSchedule(fetcher);
    expect(fetcher.mock.calls[1][0]).toContain('date=2026-09-21');
    expect(result.weeks).toEqual({ numerator: '2026-09-14', denominator: '2026-09-21' });
    expect(result.schedule.days[0].pairs).toHaveLength(2);
    expect(result.schedule.days[0].pairs[0].schedule).toEqual({ kind: 'alternating', denominator: {
      type: 'lec', name: 'Интернет-технологии', teacher: 'доц. Гостин А.М.', room: '337 C',
    } });
    expect(result.schedule.days[2].pairs[1].schedule).toMatchObject({ kind: 'alternating',
      numerator: { type: 'lec' }, denominator: { type: 'lab' },
    });
  });

  it('rejects missing tables, unexpected types and multiple lessons instead of saving partial results', () => {
    expect(() => parseWeek('<html>Maintenance</html>')).toThrow();
    expect(() => parseWeek(numerator.replace('schedule-lesson-type-3', 'schedule-lesson-type-99'))).toThrow();
    expect(() => parseWeek(numerator.replace('НИР практика/Научно-исследовательская практика',
      'НИР практика/Научно-исследовательская практика</div><div>Ещё одна пара'))).toThrow();
  });

  it('rejects wrong weeks and HTTP failures', async () => {
    const wrongWeek = vi.fn<typeof fetch>().mockResolvedValueOnce(htmlResponse(numerator))
      .mockResolvedValueOnce(htmlResponse(numerator));
    await expect(fetchSchedule(wrongWeek)).rejects.toThrow('Wrong week');
    await expect(fetchSchedule(vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 503 }))))
      .rejects.toThrow('503');
  });

  it('uses the preceding opposite week if the next one is not published', async () => {
    const lastPublished = numerator.replace(/<option value="2026-09-21"[^>]*>.*?<\/option>/, '');
    const preceding = denominator.replaceAll('2026-09-21', '2026-09-07');
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(htmlResponse(lastPublished))
      .mockResolvedValueOnce(htmlResponse(preceding));
    const result = await fetchSchedule(fetcher);
    expect(fetcher.mock.calls[1][0]).toContain('date=2026-09-07');
    expect(result.weeks.denominator).toBe('2026-09-07');
  });
});
