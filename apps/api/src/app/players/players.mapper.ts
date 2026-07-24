import type {
  Game,
  Player,
  PlayerGameStat,
  PropLine,
  Team,
} from '@props-analyzer/database';
import type {
  GameBoxScoreEntryDto,
  PlayerDto,
  PlayerGameLogEntryDto,
  PropLineDto,
  PropStatType,
  PropGameDto,
  PlayerWithTeamDto,
} from '@props-analyzer/shared-types';
import { statValueForType } from '@props-analyzer/shared-types';
import { toTeamDto } from '../teams/teams.mapper.js';

export function toPlayerDto(player: Player): PlayerDto {
  return {
    id: player.id,
    teamId: player.teamId,
    fullName: player.fullName,
    position: player.position,
    height: player.height,
    weight: player.weight,
    active: player.active,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
  };
}

export function toPlayerWithTeamDto(
  player: Player & { team: Team }
): PlayerWithTeamDto {
  return {
    ...toPlayerDto(player),
    team: toTeamDto(player.team),
  };
}

function toPlayerGameStatDto(stat: PlayerGameStat) {
  return {
    id: stat.id,
    playerId: stat.playerId,
    gameId: stat.gameId,
    minutes: stat.minutes,
    points: stat.points,
    rebounds: stat.rebounds,
    assists: stat.assists,
    threePM: stat.threePM,
    threePA: stat.threePA,
    fgm: stat.fgm,
    fga: stat.fga,
    ftm: stat.ftm,
    fta: stat.fta,
    steals: stat.steals,
    blocks: stat.blocks,
    turnovers: stat.turnovers,
    fouls: stat.fouls,
    plusMinus: stat.plusMinus,
    starter: stat.starter,
    createdAt: stat.createdAt.toISOString(),
    updatedAt: stat.updatedAt.toISOString(),
  };
}

/**
 * `isHome`/`opponentTeamId` depend on which team the player was on for that
 * game, so the caller passes `playerTeamId` explicitly rather than this
 * mapper re-deriving it (a game row alone doesn't say which side the player
 * was on).
 */
export function toPlayerGameLogEntryDto(
  stat: PlayerGameStat & { game: Game },
  playerTeamId: string
): PlayerGameLogEntryDto {
  const { game } = stat;
  const isHome = game.homeTeamId === playerTeamId;

  return {
    ...toPlayerGameStatDto(stat),
    game: {
      id: game.id,
      date: game.date.toISOString(),
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
    },
    opponentTeamId: isHome ? game.awayTeamId : game.homeTeamId,
    isHome,
  };
}

export function toGameBoxScoreEntryDto(
  stat: PlayerGameStat & { player: Player }
): GameBoxScoreEntryDto {
  return {
    ...toPlayerGameStatDto(stat),
    player: toPlayerDto(stat.player),
  };
}

/**
 * Per-game context shared by every market for one player — computed once by
 * the caller (opponent/home-away don't change between markets, only the
 * stat value does).
 */
export interface PropGameContext {
  gameId: string;
  date: string;
  opponentAbbreviation: string;
  isHome: boolean;
  /** Final margin from the player's team perspective (see PropGameDto.margin). */
  margin: number;
  stat: PlayerGameStat;
}

export function toPropLineDto(
  propLine: PropLine,
  games: PropGameContext[]
): PropLineDto {
  const statType = propLine.statType as PropStatType;

  const series: PropGameDto[] = games.map((context) => ({
    gameId: context.gameId,
    date: context.date,
    opponentAbbreviation: context.opponentAbbreviation,
    isHome: context.isHome,
    margin: context.margin,
    value: statValueForType(context.stat, statType),
  }));

  return {
    playerId: propLine.playerId,
    statType,
    line: propLine.line,
    overOdds: propLine.overOdds,
    underOdds: propLine.underOdds,
    projection: propLine.projection,
    games: series,
  };
}
