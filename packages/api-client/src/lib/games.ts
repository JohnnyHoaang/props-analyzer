import type {
  GameBoxScoreEntryDto,
  GameStatus,
  GameType,
  GameWithTeamsDto,
} from '@props-analyzer/shared-types';
import { apiFetch, type ApiRequestOptions } from './http.js';

export interface ListGamesOptions extends ApiRequestOptions {
  teamId?: string;
  seasonId?: string;
  status?: GameStatus;
  gameType?: GameType;
  limit?: number;
  cursor?: string;
}

/** `GET /games` */
export function listGames(
  options: ListGamesOptions = {}
): Promise<GameWithTeamsDto[]> {
  const { teamId, seasonId, status, gameType, limit, cursor, ...rest } =
    options;

  return apiFetch<GameWithTeamsDto[]>('/games', {
    ...rest,
    query: { teamId, seasonId, status, gameType, limit, cursor },
  });
}

/** `GET /games/:id` */
export function getGame(
  id: string,
  options?: ApiRequestOptions
): Promise<GameWithTeamsDto> {
  return apiFetch<GameWithTeamsDto>(`/games/${encodeURIComponent(id)}`, options);
}

/** `GET /games/:id/players` — the box score for both teams. */
export function getGameBoxScore(
  id: string,
  options?: ApiRequestOptions
): Promise<GameBoxScoreEntryDto[]> {
  return apiFetch<GameBoxScoreEntryDto[]>(
    `/games/${encodeURIComponent(id)}/players`,
    options
  );
}
