import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { TeamDto } from '@props-analyzer/shared-types';
import type { Repositories } from '@props-analyzer/database';
import { REPOSITORIES } from '../database/repositories.token.js';
import { toTeamDto } from './teams.mapper.js';

@Injectable()
export class TeamsService {
  constructor(@Inject(REPOSITORIES) private readonly repos: Repositories) {}

  async findAll(): Promise<TeamDto[]> {
    const teams = await this.repos.team.list();
    return teams.map(toTeamDto);
  }

  async findById(id: string): Promise<TeamDto> {
    const team = await this.repos.team.findById(id);

    if (!team) {
      throw new NotFoundException(`Team ${id} not found`);
    }

    return toTeamDto(team);
  }
}
