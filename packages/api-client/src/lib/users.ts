import type { UserDto } from '@props-analyzer/shared-types';
import { apiFetch, type ApiRequestOptions } from './http.js';

/**
 * `GET /users/me` — authentication is deferred in Phase 1, so this always
 * resolves to the single stubbed user (see AGENTS.md workflow notes).
 */
export function getCurrentUser(options?: ApiRequestOptions): Promise<UserDto> {
  return apiFetch<UserDto>('/users/me', options);
}
