import type { PropGameDto } from '@props-analyzer/shared-types';

export interface PropWindowSummary {
  count: number;
  overCount: number;
  underCount: number;
  overRate: number; // 0..1
  mean: number;
  max: number;
  min: number;
}

/** Grade a window of games against a line. A value equal to the line can't
 * happen (lines are .5), so over = value > line, under = the rest. */
export function summarizeWindow(
  games: PropGameDto[],
  line: number
): PropWindowSummary {
  const count = games.length;
  if (count === 0) {
    return {
      count: 0,
      overCount: 0,
      underCount: 0,
      overRate: 0,
      mean: 0,
      max: 0,
      min: 0,
    };
  }

  const values = games.map((game) => game.value);
  const overCount = values.filter((value) => value > line).length;
  const sum = values.reduce((total, value) => total + value, 0);

  return {
    count,
    overCount,
    underCount: count - overCount,
    overRate: overCount / count,
    mean: sum / count,
    max: Math.max(...values),
    min: Math.min(...values),
  };
}

export type EvidenceLevel = 'High' | 'Moderate' | 'Limited' | 'Insufficient';

/**
 * A deliberately simple, transparent label for how much history backs the
 * number — based only on sample size and how steady the player's output is
 * (coefficient of variation). It is NOT a bet rating and says nothing about
 * whether to wager; a real evidence-scoring system is a later phase (see
 * docs/MVP_TASKS.md).
 */
export function evidenceLevel(games: PropGameDto[]): EvidenceLevel {
  const n = games.length;
  if (n < 5) {
    return 'Insufficient';
  }

  const values = games.map((game) => game.value);
  const mean = values.reduce((total, value) => total + value, 0) / n;
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) / n;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;

  if (n >= 15 && cv < 0.35) {
    return 'High';
  }
  if (n >= 10 && cv < 0.5) {
    return 'Moderate';
  }
  return 'Limited';
}

/** Timeframe options (last-N) that make sense for a series of `total` games:
 * the standard 5/10/15/20 stops that don't exceed the sample, plus the full
 * sample if it isn't already one of them. */
export function windowOptions(total: number): number[] {
  const stops = [5, 10, 15, 20].filter((n) => n <= total);
  if (total > 0 && !stops.includes(total)) {
    stops.push(total);
  }
  return stops.length > 0 ? stops : [total].filter((n) => n > 0);
}

/** Parse a game ISO timestamp using its calendar date only (UTC) so a
 * midnight-Z suffix doesn't shift the label into the prior local day. */
export function parseGameDate(iso: string): {
  year: number;
  month: number;
  day: number;
} {
  const datePart = iso.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  return { year, month, day };
}

export function gamesSpanMultipleYears(games: PropGameDto[]): boolean {
  if (games.length === 0) {
    return false;
  }

  const years = new Set(games.map((game) => parseGameDate(game.date).year));
  return years.size > 1;
}

/** Compact x-axis label for a game date. Include the year when the visible
 * window crosses seasons so repeated M/D pairs stay unambiguous. */
export function formatChartAxisDate(
  iso: string,
  includeYear: boolean
): string {
  const { year, month, day } = parseGameDate(iso);

  if (includeYear) {
    const yy = String(year).slice(-2);
    return `${month}/${day}/${yy}`;
  }

  return `${month}/${day}`;
}

/** When a window has many games, render a sparse set of x-axis ticks so
 * dates stay readable and aligned with their bars. Always includes the
 * first and last game in the window. */
export function chartAxisLabelIndices(count: number): number[] {
  if (count <= 0) {
    return [];
  }

  if (count <= 20) {
    return Array.from({ length: count }, (_, index) => index);
  }

  const maxLabels = 12;
  const indices = new Set<number>([0, count - 1]);
  const step = (count - 1) / (maxLabels - 1);

  for (let tick = 1; tick < maxLabels - 1; tick++) {
    indices.add(Math.round(tick * step));
  }

  return [...indices].sort((a, b) => a - b);
}

export function shouldShowChartAxisLabel(
  index: number,
  count: number
): boolean {
  return chartAxisLabelIndices(count).includes(index);
}

/** Max games shown per chart page — keeps bars readable without horizontal
 * scroll so hover tooltips stay aligned with their columns. */
export const CHART_GAMES_PER_PAGE = 20;

/** Upper bound on games per chart page on small (phone) screens, where 20
 * fluid bars become hair-thin and their date labels collide. */
export const MOBILE_CHART_GAMES_PER_PAGE = 8;

/**
 * Choose a page size that spreads `count` games across the fewest pages while
 * staying at or below `maxPerPage`, keeping every page roughly equal. This
 * avoids a lonely last page (e.g. 15 games at a flat 8/page would leave the
 * most recent page showing a single bar): 15 → 2 pages of 8 and 7 instead.
 * Returns `maxPerPage` when everything already fits on one page.
 */
export function balancedChartPageSize(
  count: number,
  maxPerPage: number
): number {
  if (count <= maxPerPage) {
    return maxPerPage;
  }
  const pages = Math.ceil(count / maxPerPage);
  return Math.ceil(count / pages);
}

export function chartPageCount(
  gameCount: number,
  pageSize = CHART_GAMES_PER_PAGE
): number {
  if (gameCount <= 0) {
    return 0;
  }

  return Math.ceil(gameCount / pageSize);
}

/** Slice a chronological game series into a fixed-size page. Page 0 is the
 * oldest chunk; the last page is the most recent games. */
export function chartPageSlice<T>(
  items: T[],
  pageIndex: number,
  pageSize = CHART_GAMES_PER_PAGE
): T[] {
  const start = pageIndex * pageSize;
  return items.slice(start, start + pageSize);
}

/** Land on the most recent page when a window loads or the timeframe changes. */
export function defaultChartPageIndex(
  gameCount: number,
  pageSize = CHART_GAMES_PER_PAGE
): number {
  return Math.max(0, chartPageCount(gameCount, pageSize) - 1);
}

export function formatChartPageRange(
  pageIndex: number,
  totalInWindow: number,
  pageSize = CHART_GAMES_PER_PAGE
): string {
  if (totalInWindow <= 0) {
    return '';
  }

  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalInWindow);
  return `Games ${start}–${end} of ${totalInWindow}`;
}
