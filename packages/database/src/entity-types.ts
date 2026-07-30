import type { Database } from './supabase/types.js';

/**
 * Internal domain entity + enum types. Previously these came from
 * `@prisma/client`; now that Supabase owns the schema, they're derived from the
 * generated `Database` type (enums) and hand-declared with `Date` timestamps
 * (entities) — the shape the API mappers/services consume. Single source of
 * truth for enum spellings is the database, so they can't drift.
 */

type Enums = Database['public']['Enums'];

export type Conference = Enums['conference'];
export type PlayerPosition = Enums['player_position'];
export type GameStatus = Enums['game_status'];
export type GameType = Enums['game_type'];
export type InjuryStatus = Enums['injury_status'];
export type LineupRole = Enums['lineup_role'];
export type LineupConfirmation = Enums['lineup_confirmation'];
export type StatType = Enums['stat_type'];

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  conference: Conference;
  division: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  teamId: string;
  fullName: string;
  position: PlayerPosition;
  height: number;
  weight: number;
  active: boolean;
  /** ESPN headshot URL, or null when no ESPN match exists. */
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Season {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Game {
  id: string;
  seasonId: string;
  date: Date;
  status: GameStatus;
  gameType: GameType;
  homeScore: number | null;
  awayScore: number | null;
  overtimePeriods: number;
  homeTeamId: string;
  awayTeamId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerGameStat {
  id: string;
  playerId: string;
  /**
   * Team the player suited up for in this game. Null on rows loaded before the
   * per-game team was recorded (see the backfill script); consumers fall back
   * to the player's current team in that case.
   */
  teamId: string | null;
  gameId: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  threePM: number;
  threePA: number;
  fgm: number;
  fga: number;
  ftm: number;
  fta: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  plusMinus: number;
  starter: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropLine {
  id: string;
  playerId: string;
  statType: StatType;
  line: number;
  overOdds: number;
  underOdds: number;
  projection: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InjuryReport {
  id: string;
  playerId: string;
  status: InjuryStatus;
  description: string | null;
  reportedAt: Date;
  expectedReturn: Date | null;
  confirmed: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineupReport {
  id: string;
  playerId: string;
  role: LineupRole;
  confirmation: LineupConfirmation;
  reportedAt: Date;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
