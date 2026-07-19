import { Injectable, NotFoundException } from '@nestjs/common';
import type { TeamDto } from '@props-analyzer/shared-types';
import { PrismaService } from '../database/prisma.service.js';
import { toTeamDto } from './teams.mapper.js';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TeamDto[]> {
    const teams = await this.prisma.client.team.findMany({
      orderBy: { name: 'asc' },
    });

    return teams.map(toTeamDto);
  }

  async findById(id: string): Promise<TeamDto> {
    const team = await this.prisma.client.team.findUnique({ where: { id } });

    if (!team) {
      throw new NotFoundException(`Team ${id} not found`);
    }

    return toTeamDto(team);
  }
}
