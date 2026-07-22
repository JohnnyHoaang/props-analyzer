import type { PropGameDto } from '@props-analyzer/shared-types';
import {
  evidenceLevel,
  summarizeWindow,
  windowOptions,
} from '../app/players/[playerId]/prop-stats';

function game(value: number): PropGameDto {
  return {
    gameId: `g-${value}-${Math.random()}`,
    date: '2025-11-01',
    opponentAbbreviation: 'OPP',
    isHome: true,
    value,
  };
}

describe('summarizeWindow', () => {
  it('counts overs strictly above the line', () => {
    const games = [game(10), game(20), game(15), game(16)];
    const summary = summarizeWindow(games, 15.5);

    expect(summary.count).toBe(4);
    expect(summary.overCount).toBe(2); // 20 and 16
    expect(summary.underCount).toBe(2); // 10 and 15
    expect(summary.overRate).toBeCloseTo(0.5);
    expect(summary.max).toBe(20);
    expect(summary.min).toBe(10);
  });

  it('recolors as the line moves (drives the alt-line slider)', () => {
    const games = [game(10), game(12), game(18), game(22)];

    expect(summarizeWindow(games, 15.5).overCount).toBe(2);
    expect(summarizeWindow(games, 11.5).overCount).toBe(3);
    expect(summarizeWindow(games, 25).overCount).toBe(0);
  });

  it('handles an empty window without dividing by zero', () => {
    const summary = summarizeWindow([], 10.5);
    expect(summary.count).toBe(0);
    expect(summary.overRate).toBe(0);
  });
});

describe('evidenceLevel', () => {
  it('is Insufficient below five games', () => {
    expect(evidenceLevel([game(10), game(11)])).toBe('Insufficient');
  });

  it('is High for a large, steady sample', () => {
    const steady = Array.from({ length: 15 }, () => game(20));
    expect(evidenceLevel(steady)).toBe('High');
  });

  it('drops below High when output is volatile', () => {
    const volatile = Array.from({ length: 15 }, (_, i) =>
      game(i % 2 === 0 ? 2 : 40)
    );
    expect(evidenceLevel(volatile)).not.toBe('High');
  });
});

describe('windowOptions', () => {
  it('offers the standard stops that fit the sample', () => {
    expect(windowOptions(20)).toEqual([5, 10, 15, 20]);
    expect(windowOptions(12)).toEqual([5, 10, 12]);
    expect(windowOptions(3)).toEqual([3]);
  });
});
