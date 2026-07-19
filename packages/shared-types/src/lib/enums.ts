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
