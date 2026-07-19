/**
 * Authentication is deferred in Phase 1 (see AGENTS.md workflow notes) —
 * `GET /users/me` always returns the single stubbed user described here.
 */
export interface UserDto {
  id: string;
  email: string;
  name: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
