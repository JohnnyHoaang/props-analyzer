import { listPlayersQuerySchema, playerGameLogQuerySchema } from './players.js';

describe('listPlayersQuerySchema', () => {
  it('applies pagination defaults when nothing is provided', () => {
    const result = listPlayersQuerySchema.parse({});
    expect(result).toEqual({ limit: 50 });
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

  it('rejects a limit above the max', () => {
    expect(() => listPlayersQuerySchema.parse({ limit: '1000' })).toThrow();
  });
});

describe('playerGameLogQuerySchema', () => {
  it('defaults to the last 10 games', () => {
    expect(playerGameLogQuerySchema.parse({})).toEqual({ limit: 10 });
  });
});
