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
