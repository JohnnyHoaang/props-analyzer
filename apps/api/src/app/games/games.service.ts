import { Injectable, NotFoundException } from '@nestjs/common';
import type { ListGamesQuery } from '@props-analyzer/validation';
import type {
  GameBoxScoreEntryDto,
  GameWithTeamsDto,
} from '@props-analyzer/shared-types';
import type { Prisma } from '@props-analyzer/database';
import { PrismaService } from '../database/prisma.service.js';
import { toGameBoxScoreEntryDto } from '../players/players.mapper.js';
import { toGameWithTeamsDto } from './games.mapper.js';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListGamesQuery): Promise<GameWithTeamsDto[]> {
    const where: Prisma.GameWhereInput = {
      ...(query.seasonId ? { seasonId: query.seasonId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.gameType ? { gameType: query.gameType } : {}),
      ...(query.teamId
        ? { OR: [{ homeTeamId: query.teamId }, { awayTeamId: query.teamId }] }
        : {}),
    };

    const games = await this.prisma.client.game.findMany({
      where,
      include: { homeTeam: true, awayTeam: true },
      orderBy: { date: 'desc' },
      take: query.limit,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    return games.map(toGameWithTeamsDto);
  }

  async findById(id: string): Promise<GameWithTeamsDto> {
    const game = await this.prisma.client.game.findUnique({
      where: { id },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!game) {
      throw new NotFoundException(`Game ${id} not found`);
    }

    return toGameWithTeamsDto(game);
  }

  async findBoxScore(gameId: string): Promise<GameBoxScoreEntryDto[]> {
    const game = await this.prisma.client.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }

    const stats = await this.prisma.client.playerGameStat.findMany({
      where: { gameId },
      include: { player: true },
      orderBy: [{ starter: 'desc' }, { points: 'desc' }],
    });

    return stats.map(toGameBoxScoreEntryDto);
  }
}
