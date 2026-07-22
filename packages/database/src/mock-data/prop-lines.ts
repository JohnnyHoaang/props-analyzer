import { gameFixtures } from './games.js';
import { playerFixtures } from './players.js';
import {
  playerGameStatFixtures,
  type PlayerGameStatFixture,
} from './player-game-stats.js';

export type PropStatTypeFixture =
  | 'POINTS'
  | 'REBOUNDS'
  | 'ASSISTS'
  | 'THREES_MADE'
  | 'STEALS'
  | 'BLOCKS'
  | 'TURNOVERS'
  | 'PTS_REB'
  | 'PTS_AST'
  | 'REB_AST'
  | 'PTS_REB_AST';

export const PROP_STAT_TYPES_FIXTURE: PropStatTypeFixture[] = [
  'POINTS',
  'REBOUNDS',
  'ASSISTS',
  'THREES_MADE',
  'STEALS',
  'BLOCKS',
  'TURNOVERS',
  'PTS_REB',
  'PTS_AST',
  'REB_AST',
  'PTS_REB_AST',
];

export interface PropLineFixture {
  id: string;
  playerId: string;
  statType: PropStatTypeFixture;
  line: number;
  overOdds: number;
  underOdds: number;
  projection: number;
}

/**
 * Mirror of `statValueForType` in @props-analyzer/shared-types. Inlined here
 * because packages/database only depends on @prisma/client, and pulling in a
 * cross-package dependency for an 11-case sum isn't worth it. Keep the two in
 * sync if a market is added.
 */
function statValue(
  stat: PlayerGameStatFixture,
  statType: PropStatTypeFixture
): number {
  switch (statType) {
    case 'POINTS':
      return stat.points;
    case 'REBOUNDS':
      return stat.rebounds;
    case 'ASSISTS':
      return stat.assists;
    case 'THREES_MADE':
      return stat.threePM;
    case 'STEALS':
      return stat.steals;
    case 'BLOCKS':
      return stat.blocks;
    case 'TURNOVERS':
      return stat.turnovers;
    case 'PTS_REB':
      return stat.points + stat.rebounds;
    case 'PTS_AST':
      return stat.points + stat.assists;
    case 'REB_AST':
      return stat.rebounds + stat.assists;
    case 'PTS_REB_AST':
      return stat.points + stat.rebounds + stat.assists;
  }
}

/** Book margin baked into both sides so implied probabilities sum > 1. */
const VIG = 0.022;

/**
 * Convert a win probability to rounded American odds (nearest 5, the way a
 * book would post them). Clamped so a lopsided sample can't produce an
 * absurd number like -2000.
 */
function toAmericanOdds(probability: number): number {
  const p = Math.min(0.72, Math.max(0.28, probability));
  const raw = p >= 0.5 ? (-100 * p) / (1 - p) : (100 * (1 - p)) / p;
  return Math.round(raw / 5) * 5;
}

const statsByPlayer = new Map<string, PlayerGameStatFixture[]>();
for (const stat of playerGameStatFixtures) {
  const rows = statsByPlayer.get(stat.playerId) ?? [];
  rows.push(stat);
  statsByPlayer.set(stat.playerId, rows);
}

const gameCount = gameFixtures.length; // for id/uniqueness sanity only

/**
 * One prop line per player per market. The line is anchored just below the
 * player's average for that stat (`floor(mean) + 0.5`), which keeps it a .5
 * value (no pushes) and yields a realistic ~50/50 over/under split. Odds are
 * derived from the player's actual historical over-rate, so a stat they clear
 * often is juiced toward the over. Projection is a mock number near the mean.
 */
export const propLineFixtures: PropLineFixture[] = playerFixtures.flatMap(
  (player) => {
    const games = statsByPlayer.get(player.id) ?? [];
    if (games.length === 0) {
      return [];
    }

    return PROP_STAT_TYPES_FIXTURE.map((statType) => {
      const values = games.map((game) => statValue(game, statType));
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const line = Math.floor(mean) + 0.5;

      const overCount = values.filter((v) => v > line).length;
      const overRate = overCount / values.length;

      // Projection leans a hair toward whichever side history favors, then
      // rounds to one decimal — purely mock, not a modeled value.
      const projection = Math.round((mean + (overRate - 0.5)) * 10) / 10;

      return {
        id: `prop-${player.id}-${statType}`,
        playerId: player.id,
        statType,
        line,
        overOdds: toAmericanOdds(overRate + VIG),
        underOdds: toAmericanOdds(1 - overRate + VIG),
        projection,
      };
    });
  }
);

// Guards against a future schedule change silently producing empty samples.
if (gameCount > 0 && propLineFixtures.length === 0) {
  throw new Error('propLineFixtures generated no rows despite having games');
}
