import type { PlayerPosition } from './enums.js';
import type { TeamDto } from './team.js';

export interface PlayerDto {
  id: string;
  teamId: string;
  fullName: string;
  position: PlayerPosition;
  height: number; // inches
  weight: number; // pounds
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `GET /players` and `GET /players/:id`. */
export interface PlayerWithTeamDto extends PlayerDto {
  team: TeamDto;
}
