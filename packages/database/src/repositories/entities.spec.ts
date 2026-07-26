import {
  toGameEntity,
  toPlayerEntity,
  toPlayerGameStatEntity,
  toPropLineEntity,
  toTeamEntity,
  toUserEntity,
} from './entities.js';

describe('row -> entity mappers', () => {
  const ts = '2025-11-01T00:00:00.000Z';

  it('toTeamEntity converts timestamps to Date', () => {
    const team = toTeamEntity({
      id: '1',
      name: 'Atlanta Hawks',
      abbreviation: 'ATL',
      conference: 'EASTERN',
      division: 'Southeast',
      created_at: ts,
      updated_at: ts,
    });
    expect(team.createdAt).toBeInstanceOf(Date);
    expect(team.createdAt.toISOString()).toBe(ts);
    expect(team.conference).toBe('EASTERN');
  });

  it('toPlayerEntity renames snake_case columns', () => {
    const player = toPlayerEntity({
      id: '10',
      team_id: '1',
      full_name: 'Trae Young',
      position: 'PG',
      height: 73,
      weight: 164,
      active: true,
      image_url: null,
      created_at: ts,
      updated_at: ts,
    });
    expect(player.teamId).toBe('1');
    expect(player.fullName).toBe('Trae Young');
  });

  it('toGameEntity converts date + preserves nullable scores', () => {
    const game = toGameEntity({
      id: '100',
      season_id: 'season-2025-26',
      date: ts,
      status: 'FINAL',
      game_type: 'REGULAR_SEASON',
      home_score: null,
      away_score: 108,
      overtime_periods: 1,
      home_team_id: '1',
      away_team_id: '2',
      created_at: ts,
      updated_at: ts,
    });
    expect(game.date).toBeInstanceOf(Date);
    expect(game.homeScore).toBeNull();
    expect(game.awayScore).toBe(108);
    expect(game.homeTeamId).toBe('1');
    expect(game.overtimePeriods).toBe(1);
  });

  it('toPlayerGameStatEntity renames three_pm/plus_minus etc.', () => {
    const stat = toPlayerGameStatEntity({
      id: '10-100',
      player_id: '10',
      game_id: '100',
      minutes: 34,
      points: 30,
      rebounds: 4,
      assists: 10,
      three_pm: 5,
      three_pa: 11,
      fgm: 10,
      fga: 20,
      ftm: 5,
      fta: 6,
      steals: 2,
      blocks: 0,
      turnovers: 3,
      fouls: 2,
      plus_minus: 7,
      starter: true,
      created_at: ts,
      updated_at: ts,
    });
    expect(stat.threePM).toBe(5);
    expect(stat.threePA).toBe(11);
    expect(stat.plusMinus).toBe(7);
    expect(stat.playerId).toBe('10');
    expect(stat.gameId).toBe('100');
  });

  it('toPropLineEntity renames odds columns', () => {
    const prop = toPropLineEntity({
      id: 'p1',
      player_id: '10',
      stat_type: 'POINTS',
      line: 27.5,
      over_odds: -110,
      under_odds: -110,
      projection: 28.1,
      created_at: ts,
      updated_at: ts,
    });
    expect(prop.overOdds).toBe(-110);
    expect(prop.underOdds).toBe(-110);
    expect(prop.statType).toBe('POINTS');
  });

  it('toUserEntity maps a profile row', () => {
    const user = toUserEntity({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'a@b.com',
      name: 'Test',
      created_at: ts,
      updated_at: ts,
    });
    expect(user.email).toBe('a@b.com');
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});
