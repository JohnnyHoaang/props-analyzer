import type { GameFixture } from '../mock-data/games.js';
import type { PlayerGameStatFixture } from '../mock-data/player-game-stats.js';
import type { PlayerFixture } from '../mock-data/players.js';
import type { SeasonFixture } from '../mock-data/seasons.js';
import type { TeamFixture } from '../mock-data/teams.js';
import type { BdlGame, BdlPlayer, BdlStat, BdlTeam } from './client.js';

/**
 * Pure mappers from balldontlie (BDL) API objects to the internal DTOs the
 * database expects (the same shapes as the mock-data fixtures, so the mapped
 * result is a valid Prisma create/upsert payload). No side effects — every
 * function here is deterministic and unit-tested in `map.spec.ts`.
 *
 * BDL ids are used verbatim as the primary keys (just the numeric id as a
 * string) so re-running the importer upserts the same rows instead of creating
 * duplicates.
 */

/** Fallbacks for BDL records missing non-null schema fields (confirmed decision). */
export const DEFAULT_POSITION: PlayerFixture['position'] = 'SF';
export const DEFAULT_HEIGHT = 0;
export const DEFAULT_WEIGHT = 0;

export function teamId(bdlId: number): string {
  return String(bdlId);
}

export function playerId(bdlId: number): string {
  return String(bdlId);
}

export function mapConference(conference: string): TeamFixture['conference'] {
  return conference === 'East' ? 'EASTERN' : 'WESTERN';
}

/**
 * BDL positions are coarse (G, F, C, G-F, F-C) and don't distinguish PG/SG or
 * SF/PF, so this heuristic is intentionally approximate. Empty or unknown
 * values fall back to `DEFAULT_POSITION`.
 */
export function mapPosition(
  position: string | null | undefined
): PlayerFixture['position'] {
  switch ((position ?? '').trim().toUpperCase()) {
    case 'G':
      return 'PG';
    case 'G-F':
      return 'SG';
    case 'F':
      return 'SF';
    case 'F-C':
      return 'PF';
    case 'C':
      return 'C';
    default:
      return DEFAULT_POSITION;
  }
}

/**
 * BDL sends height as feet-inches, e.g. "6-8". Returns total inches, or
 * `DEFAULT_HEIGHT` when the value is empty or malformed.
 */
export function parseHeight(height: string | null | undefined): number {
  const match = /^(\d+)-(\d+)$/.exec((height ?? '').trim());
  if (!match) {
    return DEFAULT_HEIGHT;
  }
  const feet = Number(match[1]);
  const inches = Number(match[2]);
  return feet * 12 + inches;
}

/** BDL sends weight as a pounds string, e.g. "210". */
export function parseWeight(weight: string | null | undefined): number {
  const parsed = Number.parseInt((weight ?? '').trim(), 10);
  return Number.isNaN(parsed) ? DEFAULT_WEIGHT : parsed;
}

/**
 * BDL's /teams response includes a handful of defunct/non-NBA teams with blank
 * conference and division. Only rows with a real conference and division are
 * kept so the database holds the 30 current franchises.
 */
export function isRealNbaTeam(team: BdlTeam): boolean {
  return (
    (team.conference === 'East' || team.conference === 'West') &&
    team.division.trim().length > 0
  );
}

export function mapTeam(team: BdlTeam): TeamFixture {
  return {
    id: teamId(team.id),
    name: team.full_name,
    abbreviation: team.abbreviation,
    conference: mapConference(team.conference),
    division: team.division,
  };
}

export function mapPlayer(player: BdlPlayer): PlayerFixture {
  return {
    id: playerId(player.id),
    teamId: teamId(player.team.id),
    fullName: `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim(),
    position: mapPosition(player.position),
    height: parseHeight(player.height),
    weight: parseWeight(player.weight),
    active: true,
  };
}

/** BDL uses the starting year for a season, e.g. 2025 → the "2025-26" season. */
export function seasonLabel(year: number): string {
  return `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
}

/**
 * Builds a Season fixture from a BDL starting year. The id is deterministic
 * (`season-<label>`, matching the mock `season-2025-26`) so re-running upserts
 * the same row. Start/end dates are approximate season bounds (Oct–Jun) since
 * BDL doesn't expose them here.
 */
export function mapSeason(year: number): SeasonFixture {
  const label = seasonLabel(year);
  return {
    id: `season-${label}`,
    label,
    startDate: new Date(`${year}-10-01`).toISOString(),
    endDate: new Date(`${year + 1}-06-30`).toISOString(),
  };
}

export function mapGameType(postseason: boolean): GameFixture['gameType'] {
  return postseason ? 'PLAYOFFS' : 'REGULAR_SEASON';
}

/** Regulation is 4 periods; anything beyond is overtime. */
export function overtimePeriods(period: number): number {
  return Math.max(0, period - 4);
}

/** BDL marks completed games with status `"Final"`. */
export function isFinalGame(status: string): boolean {
  return status.trim().toLowerCase() === 'final';
}

/**
 * BDL sends minutes played as a string — usually just the whole minutes
 * ("34"), occasionally "MM:SS". Returns whole minutes, or 0 when missing
 * (a DNP), which the importer uses to skip the row.
 */
export function parseMinutes(min: string | null | undefined): number {
  const raw = (min ?? '').trim();
  if (!raw) {
    return 0;
  }
  const minutes = Number.parseInt(raw.split(':')[0], 10);
  return Number.isNaN(minutes) ? 0 : minutes;
}

export function mapGame(game: BdlGame, seasonId: string): GameFixture {
  return {
    id: String(game.id),
    seasonId,
    date: new Date(game.date).toISOString(),
    status: 'FINAL',
    gameType: mapGameType(game.postseason),
    homeTeamId: teamId(game.home_team.id),
    awayTeamId: teamId(game.visitor_team.id),
    homeScore: game.home_team_score,
    awayScore: game.visitor_team_score,
    overtimePeriods: overtimePeriods(game.period),
  };
}

/**
 * Maps a BDL box score to a PlayerGameStatFixture. BDL has no plus/minus on
 * some rows (defaults to 0) and no starter flag (defaults to false).
 */
export function mapStat(stat: BdlStat): PlayerGameStatFixture {
  return {
    playerId: playerId(stat.player.id),
    gameId: String(stat.game.id),
    minutes: parseMinutes(stat.min),
    points: stat.pts,
    rebounds: stat.reb,
    assists: stat.ast,
    threePM: stat.fg3m,
    threePA: stat.fg3a,
    fgm: stat.fgm,
    fga: stat.fga,
    ftm: stat.ftm,
    fta: stat.fta,
    steals: stat.stl,
    blocks: stat.blk,
    turnovers: stat.turnover,
    fouls: stat.pf,
    plusMinus: stat.plus_minus ?? 0,
    starter: false,
  };
}
