import type { PropGameDto } from '@props-analyzer/shared-types';
import {
  balancedChartPageSize,
  chartAxisLabelIndices,
  chartPageCount,
  chartPageSlice,
  defaultChartPageIndex,
  evidenceLevel,
  formatChartAxisDate,
  formatChartPageRange,
  gamesSpanMultipleYears,
  parseGameDate,
  shouldShowChartAxisLabel,
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

describe('parseGameDate', () => {
  it('uses the calendar date without local timezone drift', () => {
    expect(parseGameDate('2025-11-01T00:00:00.000Z')).toEqual({
      year: 2025,
      month: 11,
      day: 1,
    });
  });
});

describe('formatChartAxisDate', () => {
  it('omits the year for single-season windows', () => {
    expect(formatChartAxisDate('2025-11-01T00:00:00.000Z', false)).toBe('11/1');
  });

  it('includes the year when the window spans seasons', () => {
    expect(formatChartAxisDate('2024-03-15T00:00:00.000Z', true)).toBe('3/15/24');
  });
});

describe('gamesSpanMultipleYears', () => {
  it('detects multi-season samples', () => {
    const games: PropGameDto[] = [
      { ...game(10), date: '2024-04-01' },
      { ...game(12), date: '2025-11-01' },
    ];

    expect(gamesSpanMultipleYears(games)).toBe(true);
    expect(gamesSpanMultipleYears([game(10), game(11)])).toBe(false);
  });
});

describe('chartAxisLabelIndices', () => {
  it('labels every game for small windows', () => {
    expect(chartAxisLabelIndices(15)).toHaveLength(15);
  });

  it('thins labels for large windows while keeping both ends', () => {
    const indices = chartAxisLabelIndices(164);

    expect(indices[0]).toBe(0);
    expect(indices[indices.length - 1]).toBe(163);
    expect(indices.length).toBeLessThanOrEqual(12);
  });
});

describe('shouldShowChartAxisLabel', () => {
  it('shows all labels for short windows and sparse labels for long ones', () => {
    expect(shouldShowChartAxisLabel(7, 10)).toBe(true);
    expect(shouldShowChartAxisLabel(7, 164)).toBe(false);
    expect(shouldShowChartAxisLabel(0, 164)).toBe(true);
    expect(shouldShowChartAxisLabel(163, 164)).toBe(true);
  });
});

describe('chart pagination', () => {
  it('splits large windows into fixed-size pages', () => {
    const games = Array.from({ length: 45 }, (_, index) => game(index + 1));

    expect(chartPageCount(games.length)).toBe(3);
    expect(defaultChartPageIndex(games.length)).toBe(2);
    expect(chartPageSlice(games, 0)).toHaveLength(20);
    expect(chartPageSlice(games, 2)).toHaveLength(5);
  });

  it('formats the visible game range for the pager label', () => {
    expect(formatChartPageRange(0, 45)).toBe('Games 1–20 of 45');
    expect(formatChartPageRange(2, 45)).toBe('Games 41–45 of 45');
  });

  it('hides pagination for small windows', () => {
    expect(chartPageCount(15)).toBe(1);
    expect(defaultChartPageIndex(15)).toBe(0);
  });

  it('balances mobile page size to avoid a lonely last page', () => {
    // Fits on one page → full cap, single page.
    expect(balancedChartPageSize(5, 8)).toBe(8);
    expect(chartPageCount(5, balancedChartPageSize(5, 8))).toBe(1);

    // 15 games would leave 1 bar at a flat 8/page; balance to 8 + 7 instead.
    const size15 = balancedChartPageSize(15, 8);
    expect(size15).toBe(8);
    expect(chartPageCount(15, size15)).toBe(2);
    const games15 = Array.from({ length: 15 }, (_, index) => game(index + 1));
    expect(chartPageSlice(games15, 0, size15)).toHaveLength(8);
    expect(chartPageSlice(games15, 1, size15)).toHaveLength(7);

    // 10 and 20 split into even pages (5+5, 7+7+6) — never a single-bar page.
    expect(balancedChartPageSize(10, 8)).toBe(5);
    expect(balancedChartPageSize(20, 8)).toBe(7);
  });
});
