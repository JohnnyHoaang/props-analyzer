import type { GameStatus, GameType } from './enums.js';
import type { TeamDto } from './team.js';

export interface GameDto {
  id: string;
  seasonId: string;
  date: string;
  status: GameStatus;
  gameType: GameType;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  overtimePeriods: number;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `GET /games` and `GET /games/:id`. */
export interface GameWithTeamsDto extends GameDto {
  homeTeam: TeamDto;
  awayTeam: TeamDto;
}
