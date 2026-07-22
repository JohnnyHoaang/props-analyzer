/**
 * String-literal unions mirroring the Prisma enums in
 * packages/database/prisma/schema.prisma. Kept independent of the
 * generated Prisma client so this package stays usable from apps/web
 * (which never talks to the database directly — see AGENTS.md API rules).
 */

export const CONFERENCES = ['EASTERN', 'WESTERN'] as const;
export type Conference = (typeof CONFERENCES)[number];

export const PLAYER_POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

export const GAME_STATUSES = ['SCHEDULED', 'FINAL', 'POSTPONED'] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export const GAME_TYPES = ['REGULAR_SEASON', 'PLAYOFFS'] as const;
export type GameType = (typeof GAME_TYPES)[number];

/**
 * Prop markets we grade. Order is intentional — it's the display order of the
 * stat pills, single categories first then combos. Mirrors the StatType enum
 * in packages/database/prisma/schema.prisma.
 */
export const PROP_STAT_TYPES = [
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
] as const;
export type PropStatType = (typeof PROP_STAT_TYPES)[number];
