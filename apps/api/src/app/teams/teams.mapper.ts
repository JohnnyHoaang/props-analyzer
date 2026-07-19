import type { Team } from '@props-analyzer/database';
import type { TeamDto } from '@props-analyzer/shared-types';

export function toTeamDto(team: Team): TeamDto {
  return {
    id: team.id,
    name: team.name,
    abbreviation: team.abbreviation,
    conference: team.conference,
    division: team.division,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}
