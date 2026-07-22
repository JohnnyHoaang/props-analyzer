import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { TeamDto } from '@props-analyzer/shared-types';
import type { DataClient } from '@props-analyzer/database';
import { DATA_CLIENT } from '../database/data-client.token.js';
import { toTeamDto } from './teams.mapper.js';

@Injectable()
export class TeamsService {
  constructor(@Inject(DATA_CLIENT) private readonly db: DataClient) {}

  async findAll(): Promise<TeamDto[]> {
    const teams = await this.db.team.findMany({
      orderBy: { name: 'asc' },
    });

    return teams.map(toTeamDto);
  }

  async findById(id: string): Promise<TeamDto> {
    const team = await this.db.team.findUnique({ where: { id } });

    if (!team) {
      throw new NotFoundException(`Team ${id} not found`);
    }

    return toTeamDto(team);
  }
}
