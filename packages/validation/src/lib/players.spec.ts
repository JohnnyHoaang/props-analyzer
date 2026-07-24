import { listPlayersQuerySchema, playerGameLogQuerySchema } from './players.js';

describe('listPlayersQuerySchema', () => {
  it('leaves limit unset when nothing is provided so every player is returned', () => {
    const result = listPlayersQuerySchema.parse({});
    expect(result).toEqual({});
  });

  it('coerces string query params to the right types', () => {
    const result = listPlayersQuerySchema.parse({
      teamId: 'team-cascade',
      position: 'PG',
      active: 'true',
      limit: '25',
    });

    expect(result).toEqual({
      teamId: 'team-cascade',
      position: 'PG',
      active: true,
      limit: 25,
    });
  });

  it('rejects an invalid position', () => {
    expect(() =>
      listPlayersQuerySchema.parse({ position: 'NOT_A_POSITION' })
    ).toThrow();
  });

  it('accepts a large limit since players are uncapped', () => {
    expect(listPlayersQuerySchema.parse({ limit: '1000' })).toEqual({
      limit: 1000,
    });
  });
});

describe('playerGameLogQuerySchema', () => {
  it('defaults to the last 10 games', () => {
    expect(playerGameLogQuerySchema.parse({})).toEqual({ limit: 10 });
  });
});
