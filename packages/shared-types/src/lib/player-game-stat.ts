export interface PlayerGameStatDto {
  id: string;
  playerId: string;
  gameId: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  threePM: number;
  threePA: number;
  fgm: number;
  fga: number;
  ftm: number;
  fta: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  plusMinus: number;
  starter: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response shape for `GET /players/:id/game-log` — one row per completed
 * game, with just enough game/opponent context to render a game-log table
 * without a second round-trip.
 */
export interface PlayerGameLogEntryDto extends PlayerGameStatDto {
  game: {
    id: string;
    date: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
  };
  opponentTeamId: string;
  isHome: boolean;
}
