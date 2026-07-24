import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ListGamesQuery } from '@props-analyzer/validation';
import type {
  GameBoxScoreEntryDto,
  GameWithTeamsDto,
} from '@props-analyzer/shared-types';
import type { Repositories } from '@props-analyzer/database';
import { REPOSITORIES } from '../database/repositories.token.js';
import { toGameBoxScoreEntryDto } from '../players/players.mapper.js';
import { toGameWithTeamsDto } from './games.mapper.js';

@Injectable()
export class GamesService {
  constructor(@Inject(REPOSITORIES) private readonly repos: Repositories) {}

  async findAll(query: ListGamesQuery): Promise<GameWithTeamsDto[]> {
    const games = await this.repos.game.list({
      seasonId: query.seasonId,
      status: query.status,
      gameType: query.gameType,
      teamId: query.teamId,
      limit: query.limit,
      cursor: query.cursor,
    });

    return games.map(toGameWithTeamsDto);
  }

  async findById(id: string): Promise<GameWithTeamsDto> {
    const game = await this.repos.game.findByIdWithTeams(id);

    if (!game) {
      throw new NotFoundException(`Game ${id} not found`);
    }

    return toGameWithTeamsDto(game);
  }

  async findBoxScore(gameId: string): Promise<GameBoxScoreEntryDto[]> {
    const game = await this.repos.game.findById(gameId);

    if (!game) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }

    const stats = await this.repos.playerGameStat.listByGameWithPlayer(gameId);

    return stats.map(toGameBoxScoreEntryDto);
  }
}
