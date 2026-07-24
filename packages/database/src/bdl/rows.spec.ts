import { gameRow, playerRow, seasonRow, statRow, teamRow } from './rows.js';

describe('bdl row mappers (fixture -> snake_case Supabase Insert rows)', () => {
  it('teamRow passes through the already-snake_case fields', () => {
    expect(
      teamRow({
        id: '1',
        name: 'Atlanta Hawks',
        abbreviation: 'ATL',
        conference: 'EASTERN',
        division: 'Southeast',
      })
    ).toEqual({
      id: '1',
      name: 'Atlanta Hawks',
      abbreviation: 'ATL',
      conference: 'EASTERN',
      division: 'Southeast',
    });
  });

  it('playerRow renames teamId -> team_id and fullName -> full_name', () => {
    expect(
      playerRow({
        id: '10',
        teamId: '1',
        fullName: 'Trae Young',
        position: 'PG',
        height: 73,
        weight: 164,
        active: true,
      })
    ).toEqual({
      id: '10',
      team_id: '1',
      full_name: 'Trae Young',
      position: 'PG',
      height: 73,
      weight: 164,
      active: true,
    });
  });

  it('seasonRow renames startDate/endDate', () => {
    expect(
      seasonRow({
        id: 'season-2025-26',
        label: '2025-26',
        startDate: '2025-10-01T00:00:00.000Z',
        endDate: '2026-06-30T00:00:00.000Z',
      })
    ).toEqual({
      id: 'season-2025-26',
      label: '2025-26',
      start_date: '2025-10-01T00:00:00.000Z',
      end_date: '2026-06-30T00:00:00.000Z',
    });
  });

  it('gameRow renames every camelCase field', () => {
    expect(
      gameRow({
        id: '100',
        seasonId: 'season-2025-26',
        date: '2025-11-01T00:00:00.000Z',
        status: 'FINAL',
        gameType: 'REGULAR_SEASON',
        homeTeamId: '1',
        awayTeamId: '2',
        homeScore: 110,
        awayScore: 108,
        overtimePeriods: 1,
      })
    ).toEqual({
      id: '100',
      season_id: 'season-2025-26',
      date: '2025-11-01T00:00:00.000Z',
      status: 'FINAL',
      game_type: 'REGULAR_SEASON',
      home_team_id: '1',
      away_team_id: '2',
      home_score: 110,
      away_score: 108,
      overtime_periods: 1,
    });
  });

  it('statRow renames fields and derives a deterministic id', () => {
    expect(
      statRow({
        playerId: '10',
        gameId: '100',
        minutes: 34,
        points: 30,
        rebounds: 4,
        assists: 10,
        threePM: 5,
        threePA: 11,
        fgm: 10,
        fga: 20,
        ftm: 5,
        fta: 6,
        steals: 2,
        blocks: 0,
        turnovers: 3,
        fouls: 2,
        plusMinus: 7,
        starter: true,
      })
    ).toEqual({
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
    });
  });
});
