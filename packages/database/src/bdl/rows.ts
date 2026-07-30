import type { GameFixture } from '../mock-data/games.js';
import type { PlayerGameStatFixture } from '../mock-data/player-game-stats.js';
import type { PlayerFixture } from '../mock-data/players.js';
import type { SeasonFixture } from '../mock-data/seasons.js';
import type { TeamFixture } from '../mock-data/teams.js';
import type { Database } from '../supabase/types.js';

/**
 * Pure adapters from the internal fixture shapes (produced by `map.ts`, which
 * still use the Prisma-era camelCase field names) to the snake_case Supabase
 * `Insert` rows. Kept separate from the importer so the field renaming is
 * unit-tested and the importer stays about I/O. Deterministic, no side effects.
 */

type Tables = Database['public']['Tables'];
export type TeamRow = Tables['teams']['Insert'];
export type PlayerRow = Tables['players']['Insert'];
export type SeasonRow = Tables['seasons']['Insert'];
export type GameRow = Tables['games']['Insert'];
export type PlayerGameStatRow = Tables['player_game_stats']['Insert'];

export function teamRow(team: TeamFixture): TeamRow {
  return {
    id: team.id,
    name: team.name,
    abbreviation: team.abbreviation,
    conference: team.conference,
    division: team.division,
  };
}

export function playerRow(player: PlayerFixture): PlayerRow {
  return {
    id: player.id,
    team_id: player.teamId,
    full_name: player.fullName,
    position: player.position,
    height: player.height,
    weight: player.weight,
    active: player.active,
  };
}

export function seasonRow(season: SeasonFixture): SeasonRow {
  return {
    id: season.id,
    label: season.label,
    start_date: season.startDate,
    end_date: season.endDate,
  };
}

export function gameRow(game: GameFixture): GameRow {
  return {
    id: game.id,
    season_id: game.seasonId,
    date: game.date,
    status: game.status,
    game_type: game.gameType,
    home_team_id: game.homeTeamId,
    away_team_id: game.awayTeamId,
    home_score: game.homeScore,
    away_score: game.awayScore,
    overtime_periods: game.overtimePeriods,
  };
}

export function statRow(stat: PlayerGameStatFixture): PlayerGameStatRow {
  return {
    // The fixture has no id (Prisma defaulted a cuid); derive a deterministic
    // one so re-runs upsert the same row. The (player_id, game_id) unique
    // constraint is what upsert conflicts on.
    id: `${stat.playerId}-${stat.gameId}`,
    player_id: stat.playerId,
    team_id: stat.teamId,
    game_id: stat.gameId,
    minutes: stat.minutes,
    points: stat.points,
    rebounds: stat.rebounds,
    assists: stat.assists,
    three_pm: stat.threePM,
    three_pa: stat.threePA,
    fgm: stat.fgm,
    fga: stat.fga,
    ftm: stat.ftm,
    fta: stat.fta,
    steals: stat.steals,
    blocks: stat.blocks,
    turnovers: stat.turnovers,
    fouls: stat.fouls,
    plus_minus: stat.plusMinus,
    starter: stat.starter,
  };
}
