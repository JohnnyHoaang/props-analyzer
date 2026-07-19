import {
  CONFERENCES,
  GAME_STATUSES,
  GAME_TYPES,
  PLAYER_POSITIONS,
} from './enums.js';

// These must stay in sync with the enums in
// packages/database/prisma/schema.prisma.
describe('enum constants', () => {
  it('matches the Prisma Conference enum', () => {
    expect(CONFERENCES).toEqual(['EASTERN', 'WESTERN']);
  });

  it('matches the Prisma PlayerPosition enum', () => {
    expect(PLAYER_POSITIONS).toEqual(['PG', 'SG', 'SF', 'PF', 'C']);
  });

  it('matches the Prisma GameStatus enum', () => {
    expect(GAME_STATUSES).toEqual(['SCHEDULED', 'FINAL', 'POSTPONED']);
  });

  it('matches the Prisma GameType enum', () => {
    expect(GAME_TYPES).toEqual(['REGULAR_SEASON', 'PLAYOFFS']);
  });
});
