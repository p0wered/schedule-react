import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import PairBlock from './PairBlock';
import type { Discipline, Pair } from '../types/schedule';

const lesson: Discipline = { type: 'upr', name: 'НИР практика' };
function pair(numerator?: Discipline, denominator?: Discipline): Pair {
  return { id: '6-0810', time: { start: '08:10', end: '09:45' },
    schedule: { kind: 'alternating', numerator, denominator } };
}
afterEach(cleanup);

describe('merged lessons', () => {
  it.each(['numerator', 'denominator'] as const)('shows one card and keeps active highlighting in the %s', (slot) => {
    const { container } = render(<PairBlock pair={pair(lesson, { ...lesson })}
      activeLesson={{ pairId: '6-0810', slot, type: 'upr' }} />);
    expect(screen.getAllByText('НИР практика', { exact: false })).toHaveLength(1);
    expect(container.querySelector('.block-merged')).toHaveClass('current-upr');
    expect(container.querySelectorAll('.block-time')).toHaveLength(1);
  });

  it.each([
    { ...lesson, room: '21 B' },
    { ...lesson, teacher: 'Преподаватель' },
    { ...lesson, type: 'lab' as const },
  ])('keeps columns separate when lesson details differ: %j', (other) => {
    const { container } = render(<PairBlock pair={pair(lesson, other)} activeLesson={null} />);
    expect(container.querySelector('.block-merged')).toBeNull();
    expect(container.querySelectorAll('.block-discipline')).toHaveLength(2);
  });

  it('keeps an empty opposite column for a lesson published in only one week', () => {
    const { container } = render(<PairBlock pair={pair(lesson)} activeLesson={null} />);
    expect(container.querySelector('.block-merged')).toBeNull();
    expect(container.querySelector('.block-unused')).not.toBeNull();
  });
});
