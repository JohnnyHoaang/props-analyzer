import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ListPlayersQuery,
  PlayerGameLogQuery,
} from '@props-analyzer/validation';
import type {
  PlayerGameLogEntryDto,
  PlayerWithTeamDto,
} from '@props-analyzer/shared-types';
import type { Prisma } from '@props-analyzer/database';
import { PrismaService } from '../database/prisma.service.js';
import { toPlayerGameLogEntryDto, toPlayerWithTeamDto } from './players.mapper.js';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListPlayersQuery): Promise<PlayerWithTeamDto[]> {
    const where: Prisma.PlayerWhereInput = {
      ...(query.teamId ? { teamId: query.teamId } : {}),
      ...(query.position ? { position: query.position } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
    };

    const players = await this.prisma.client.player.findMany({
      where,
      include: { team: true },
      orderBy: { fullName: 'asc' },
      take: query.limit,
      ...(query.cursor
        ? { cursor: { id: query.cursor }, skip: 1 }
        : {}),
    });

    return players.map(toPlayerWithTeamDto);
  }

  async findById(id: string): Promise<PlayerWithTeamDto> {
    const player = await this.prisma.client.player.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!player) {
      throw new NotFoundException(`Player ${id} not found`);
    }

    return toPlayerWithTeamDto(player);
  }

  async findGameLog(
    playerId: string,
    query: PlayerGameLogQuery
  ): Promise<PlayerGameLogEntryDto[]> {
    const player = await this.prisma.client.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    const stats = await this.prisma.client.playerGameStat.findMany({
      where: { playerId },
      include: { game: true },
      orderBy: { game: { date: 'desc' } },
      take: query.limit,
    });

    return stats.map((stat) => toPlayerGameLogEntryDto(stat, player.teamId));
  }
}
