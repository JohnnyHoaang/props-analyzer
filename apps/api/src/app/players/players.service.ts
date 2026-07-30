import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ListPlayersQuery,
  PlayerGameLogQuery,
} from '@props-analyzer/validation';
import type {
  PlayerGameLogEntryDto,
  PropLineDto,
  PlayerWithTeamDto,
} from '@props-analyzer/shared-types';
import { PROP_STAT_TYPES } from '@props-analyzer/shared-types';
import type { Repositories } from '@props-analyzer/database';
import { REPOSITORIES } from '../database/repositories.token.js';
import {
  toPlayerGameLogEntryDto,
  toPlayerWithTeamDto,
  toPropLineDto,
  type PropGameContext,
} from './players.mapper.js';

@Injectable()
export class PlayersService {
  constructor(@Inject(REPOSITORIES) private readonly repos: Repositories) {}

  async findAll(query: ListPlayersQuery): Promise<PlayerWithTeamDto[]> {
    const players = await this.repos.player.list({
      teamId: query.teamId,
      position: query.position,
      active: query.active,
      search: query.search,
      limit: query.limit,
      cursor: query.cursor,
      page: query.page,
    });

    return players.map(toPlayerWithTeamDto);
  }

  async findById(id: string): Promise<PlayerWithTeamDto> {
    const player = await this.repos.player.findByIdWithTeam(id);

    if (!player) {
      throw new NotFoundException(`Player ${id} not found`);
    }

    return toPlayerWithTeamDto(player);
  }

  async findGameLog(
    playerId: string,
    query: PlayerGameLogQuery
  ): Promise<PlayerGameLogEntryDto[]> {
    const player = await this.repos.player.findById(playerId);

    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    const stats = await this.repos.playerGameStat.listByPlayerWithGame(
      playerId,
      { order: 'desc', limit: query.limit }
    );

    return stats.map((stat) => toPlayerGameLogEntryDto(stat, player.teamId));
  }

  /**
   * Every prop market for a player, each with its full per-game series
   * (chronological). The series is derived from the box scores here rather
   * than stored, so it always reflects the latest games; only the line/odds/
   * projection come from the stored PropLine rows.
   */
  async findProps(playerId: string): Promise<PropLineDto[]> {
    const player = await this.repos.player.findById(playerId);

    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    const [propLines, stats, teams] = await Promise.all([
      this.repos.propLine.listByPlayer(playerId),
      this.repos.playerGameStat.listByPlayerWithGame(playerId, {
        order: 'asc',
      }),
      this.repos.team.list(),
    ]);

    const abbreviationByTeamId = new Map(
      teams.map((team) => [team.id, team.abbreviation])
    );

    const games: PropGameContext[] = stats.map((stat) => {
      // The team the player suited up for that game (falls back to the player's
      // current team for legacy rows without a per-game team) — so a traded or
      // free-agent player's old-team games aren't all flipped to "away".
      const statTeamId = stat.teamId ?? player.teamId;
      const isHome = stat.game.homeTeamId === statTeamId;
      const opponentTeamId = isHome
        ? stat.game.awayTeamId
        : stat.game.homeTeamId;

      // Signed margin from the player's team perspective. Scores are null only
      // for games without a final result, which are treated as a 0 margin.
      const playerScore = isHome ? stat.game.homeScore : stat.game.awayScore;
      const opponentScore = isHome ? stat.game.awayScore : stat.game.homeScore;
      const margin = (playerScore ?? 0) - (opponentScore ?? 0);

      return {
        gameId: stat.game.id,
        date: stat.game.date.toISOString(),
        opponentAbbreviation:
          abbreviationByTeamId.get(opponentTeamId) ?? opponentTeamId,
        isHome,
        margin,
        stat,
      };
    });

    return propLines
      .map((propLine) => toPropLineDto(propLine, games))
      .sort(
        (a, b) =>
          PROP_STAT_TYPES.indexOf(a.statType) -
          PROP_STAT_TYPES.indexOf(b.statType)
      );
  }
}
