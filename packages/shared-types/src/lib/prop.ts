import type { PropStatType } from './enums.js';

/** Minimal per-game counting stats needed to derive any prop value. */
export interface PropStatSource {
  points: number;
  rebounds: number;
  assists: number;
  threePM: number;
  steals: number;
  blocks: number;
  turnovers: number;
}

/**
 * The single source of truth for turning a box-score line into the value a
 * given prop market grades against. Combo markets sum their components. Used
 * by the API when building the per-game series (see PlayersService) and
 * mirrored by the mock-data fixture generator.
 */
export function statValueForType(
  stat: PropStatSource,
  statType: PropStatType
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

/** Full human labels — headings and pills. */
export const STAT_TYPE_LABELS: Record<PropStatType, string> = {
  POINTS: 'Points',
  REBOUNDS: 'Rebounds',
  ASSISTS: 'Assists',
  THREES_MADE: '3-Pointers Made',
  STEALS: 'Steals',
  BLOCKS: 'Blocks',
  TURNOVERS: 'Turnovers',
  PTS_REB: 'Pts + Reb',
  PTS_AST: 'Pts + Ast',
  REB_AST: 'Reb + Ast',
  PTS_REB_AST: 'Pts + Reb + Ast',
};

/** Compact labels — chart axes, dense tables. */
export const STAT_TYPE_ABBREVIATIONS: Record<PropStatType, string> = {
  POINTS: 'PTS',
  REBOUNDS: 'REB',
  ASSISTS: 'AST',
  THREES_MADE: '3PM',
  STEALS: 'STL',
  BLOCKS: 'BLK',
  TURNOVERS: 'TO',
  PTS_REB: 'P+R',
  PTS_AST: 'P+A',
  REB_AST: 'R+A',
  PTS_REB_AST: 'P+R+A',
};

/** American odds: positive gets a leading '+', negative keeps its sign. */
export function formatAmericanOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

/** One completed game's value for a specific prop market. */
export interface PropGameDto {
  gameId: string;
  date: string;
  opponentAbbreviation: string;
  isHome: boolean;
  /**
   * Final score margin from the player's team perspective: positive means the
   * team won by that many, negative means it lost by that many. Powers the
   * blowout filter (e.g. exclude games decided by 20+).
   */
  margin: number;
  value: number;
}

/**
 * Response entry for `GET /players/:id/props` — one market, with the full
 * per-game series (chronological, oldest first, so "last N" is the tail).
 * Hit rates, evidence and alternate-line recoloring are computed client-side
 * from `games` so the chart stays interactive without extra round-trips.
 */
export interface PropLineDto {
  playerId: string;
  statType: PropStatType;
  line: number;
  overOdds: number;
  underOdds: number;
  projection: number;
  games: PropGameDto[];
}
