import type { Game, Team } from '@props-analyzer/database';
import type { GameDto, GameWithTeamsDto } from '@props-analyzer/shared-types';
import { toTeamDto } from '../teams/teams.mapper.js';

export function toGameDto(game: Game): GameDto {
  return {
    id: game.id,
    seasonId: game.seasonId,
    date: game.date.toISOString(),
    status: game.status,
    gameType: game.gameType,
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    overtimePeriods: game.overtimePeriods,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  };
}

export function toGameWithTeamsDto(
  game: Game & { homeTeam: Team; awayTeam: Team }
): GameWithTeamsDto {
  return {
    ...toGameDto(game),
    homeTeam: toTeamDto(game.homeTeam),
    awayTeam: toTeamDto(game.awayTeam),
  };
}
