import type {
  Game,
  Player,
  PlayerGameStat,
  PropLine,
  Team,
  User,
} from '@prisma/client';
import type { Database } from '../supabase/types.js';

/**
 * Maps snake_case Supabase rows (string timestamps) back to the internal
 * entity shapes the API's mappers/services already consume (camelCase, `Date`
 * objects — the same shape Prisma returned). Inverse of `bdl/rows.ts`.
 * Deterministic, no side effects, unit-tested.
 */

type Rows = Database['public']['Tables'];

export function toTeamEntity(row: Rows['teams']['Row']): Team {
  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation,
    conference: row.conference,
    division: row.division,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toPlayerEntity(row: Rows['players']['Row']): Player {
  return {
    id: row.id,
    teamId: row.team_id,
    fullName: row.full_name,
    position: row.position,
    height: row.height,
    weight: row.weight,
    active: row.active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toGameEntity(row: Rows['games']['Row']): Game {
  return {
    id: row.id,
    seasonId: row.season_id,
    date: new Date(row.date),
    status: row.status,
    gameType: row.game_type,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    homeScore: row.home_score,
    awayScore: row.away_score,
    overtimePeriods: row.overtime_periods,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toPlayerGameStatEntity(
  row: Rows['player_game_stats']['Row']
): PlayerGameStat {
  return {
    id: row.id,
    playerId: row.player_id,
    gameId: row.game_id,
    minutes: row.minutes,
    points: row.points,
    rebounds: row.rebounds,
    assists: row.assists,
    threePM: row.three_pm,
    threePA: row.three_pa,
    fgm: row.fgm,
    fga: row.fga,
    ftm: row.ftm,
    fta: row.fta,
    steals: row.steals,
    blocks: row.blocks,
    turnovers: row.turnovers,
    fouls: row.fouls,
    plusMinus: row.plus_minus,
    starter: row.starter,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toPropLineEntity(row: Rows['prop_lines']['Row']): PropLine {
  return {
    id: row.id,
    playerId: row.player_id,
    statType: row.stat_type,
    line: row.line,
    overOdds: row.over_odds,
    underOdds: row.under_odds,
    projection: row.projection,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toUserEntity(row: Rows['profiles']['Row']): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
