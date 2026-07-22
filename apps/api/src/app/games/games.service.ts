import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ListGamesQuery } from '@props-analyzer/validation';
import type {
  GameBoxScoreEntryDto,
  GameWithTeamsDto,
} from '@props-analyzer/shared-types';
import type { DataClient, Game, Player, PlayerGameStat, Prisma, Team } from '@props-analyzer/database';
import { DATA_CLIENT } from '../database/data-client.token.js';
import { toGameBoxScoreEntryDto } from '../players/players.mapper.js';
import { toGameWithTeamsDto } from './games.mapper.js';

@Injectable()
export class GamesService {
  constructor(@Inject(DATA_CLIENT) private readonly db: DataClient) {}

  async findAll(query: ListGamesQuery): Promise<GameWithTeamsDto[]> {
    const where: Prisma.GameWhereInput = {
      ...(query.seasonId ? { seasonId: query.seasonId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.gameType ? { gameType: query.gameType } : {}),
      ...(query.teamId
        ? { OR: [{ homeTeamId: query.teamId }, { awayTeamId: query.teamId }] }
        : {}),
    };

    const games = (await this.db.game.findMany({
      where,
      include: { homeTeam: true, awayTeam: true },
      orderBy: { date: 'desc' },
      take: query.limit,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    })) as Array<Game & { homeTeam: Team; awayTeam: Team }>;

    return games.map(toGameWithTeamsDto);
  }

  async findById(id: string): Promise<GameWithTeamsDto> {
    const game = (await this.db.game.findUnique({
      where: { id },
      include: { homeTeam: true, awayTeam: true },
    })) as (Game & { homeTeam: Team; awayTeam: Team }) | null;

    if (!game) {
      throw new NotFoundException(`Game ${id} not found`);
    }

    return toGameWithTeamsDto(game);
  }

  async findBoxScore(gameId: string): Promise<GameBoxScoreEntryDto[]> {
    const game = await this.db.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }

    const stats = (await this.db.playerGameStat.findMany({
      where: { gameId },
      include: { player: true },
      orderBy: [{ starter: 'desc' }, { points: 'desc' }],
    })) as Array<PlayerGameStat & { player: Player }>;

    return stats.map(toGameBoxScoreEntryDto);
  }
}
