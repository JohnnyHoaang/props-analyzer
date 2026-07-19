import type { TeamDto } from '@props-analyzer/shared-types';
import { apiFetch, type ApiRequestOptions } from './http.js';

/** `GET /teams` */
export function listTeams(options?: ApiRequestOptions): Promise<TeamDto[]> {
  return apiFetch<TeamDto[]>('/teams', options);
}

/** `GET /teams/:id` */
export function getTeam(
  id: string,
  options?: ApiRequestOptions
): Promise<TeamDto> {
  return apiFetch<TeamDto>(`/teams/${encodeURIComponent(id)}`, options);
}
