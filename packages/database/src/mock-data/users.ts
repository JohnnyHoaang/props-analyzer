export interface UserFixture {
  id: string;
  email: string;
  name: string;
}

/**
 * Authentication is deferred in Phase 1 — this is the single stubbed
 * "current user" the API returns from `GET /users/me` until a real auth
 * provider is chosen.
 */
export const userFixtures: UserFixture[] = [
  {
    id: 'user-stub-1',
    email: 'demo@props-analyzer.local',
    name: 'Demo User',
  },
];
