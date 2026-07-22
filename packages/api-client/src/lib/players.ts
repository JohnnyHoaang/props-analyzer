import type {
  PlayerGameLogEntryDto,
  PlayerPosition,
  PropLineDto,
  PlayerWithTeamDto,
} from '@props-analyzer/shared-types';
import { apiFetch, type ApiRequestOptions } from './http.js';

export interface ListPlayersOptions extends ApiRequestOptions {
  teamId?: string;
  position?: PlayerPosition;
  active?: boolean;
  limit?: number;
  cursor?: string;
}

/** `GET /players` */
export function listPlayers(
  options: ListPlayersOptions = {}
): Promise<PlayerWithTeamDto[]> {
  const { teamId, position, active, limit, cursor, ...rest } = options;

  return apiFetch<PlayerWithTeamDto[]>('/players', {
    ...rest,
    query: { teamId, position, active, limit, cursor },
  });
}

/** `GET /players/:id` */
export function getPlayer(
  id: string,
  options?: ApiRequestOptions
): Promise<PlayerWithTeamDto> {
  return apiFetch<PlayerWithTeamDto>(`/players/${encodeURIComponent(id)}`, options);
}

export interface GetPlayerGameLogOptions extends ApiRequestOptions {
  limit?: number;
}

/** `GET /players/:id/game-log` */
export function getPlayerGameLog(
  id: string,
  options: GetPlayerGameLogOptions = {}
): Promise<PlayerGameLogEntryDto[]> {
  const { limit, ...rest } = options;

  return apiFetch<PlayerGameLogEntryDto[]>(
    `/players/${encodeURIComponent(id)}/game-log`,
    { ...rest, query: { limit } }
  );
}

/** `GET /players/:id/props` */
export function getPlayerProps(
  id: string,
  options?: ApiRequestOptions
): Promise<PropLineDto[]> {
  return apiFetch<PropLineDto[]>(
    `/players/${encodeURIComponent(id)}/props`,
    options
  );
}
