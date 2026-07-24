import type { MockDataFile } from '../mock-data/types.js';
import { createMockRepositories } from './mock.js';

const data: MockDataFile = {
  users: [{ id: 'u1', email: 'a@b.com', name: 'Alpha' }],
  teams: [
    {
      id: 't1',
      name: 'Zephyrs',
      abbreviation: 'ZEP',
      conference: 'WESTERN',
      division: 'Pacific',
    },
    {
      id: 't2',
      name: 'Anchors',
      abbreviation: 'ANC',
      conference: 'EASTERN',
      division: 'Atlantic',
    },
  ],
  players: [
    { id: 'p1', teamId: 't1', fullName: 'Bianca Ray', position: 'PG', height: 70, weight: 160, active: true },
    { id: 'p2', teamId: 't1', fullName: 'Aaron Cole', position: 'C', height: 84, weight: 250, active: false },
    { id: 'p3', teamId: 't2', fullName: 'Cody Nunez', position: 'SF', height: 79, weight: 210, active: true },
  ],
  seasons: [
    { id: 's1', label: '2025-26', startDate: '2025-10-01', endDate: '2026-06-30' },
  ],
  games: [
    { id: 'g1', seasonId: 's1', date: '2025-11-01', status: 'FINAL', gameType: 'REGULAR_SEASON', homeTeamId: 't1', awayTeamId: 't2', homeScore: 100, awayScore: 98, overtimePeriods: 0 },
    { id: 'g2', seasonId: 's1', date: '2025-11-05', status: 'FINAL', gameType: 'REGULAR_SEASON', homeTeamId: 't2', awayTeamId: 't1', homeScore: 90, awayScore: 95, overtimePeriods: 0 },
  ],
  playerGameStats: [
    { playerId: 'p1', gameId: 'g1', minutes: 30, points: 10, rebounds: 3, assists: 8, threePM: 1, threePA: 3, fgm: 4, fga: 9, ftm: 1, fta: 2, steals: 2, blocks: 0, turnovers: 1, fouls: 2, plusMinus: 5, starter: true },
    { playerId: 'p1', gameId: 'g2', minutes: 28, points: 22, rebounds: 2, assists: 5, threePM: 4, threePA: 8, fgm: 8, fga: 14, ftm: 2, fta: 2, steals: 1, blocks: 0, turnovers: 3, fouls: 1, plusMinus: -2, starter: true },
    { playerId: 'p3', gameId: 'g1', minutes: 25, points: 30, rebounds: 5, assists: 2, threePM: 2, threePA: 6, fgm: 11, fga: 20, ftm: 6, fta: 7, steals: 0, blocks: 1, turnovers: 2, fouls: 3, plusMinus: -5, starter: false },
  ],
  injuryReports: [],
  lineupReports: [],
  propLines: [
    { id: 'pl1', playerId: 'p1', statType: 'POINTS', line: 15.5, overOdds: -110, underOdds: -110, projection: 15.5 },
  ],
};

describe('createMockRepositories', () => {
  const repos = createMockRepositories(data);

  it('lists teams sorted by name', async () => {
    const teams = await repos.team.list();
    expect(teams.map((t) => t.abbreviation)).toEqual(['ANC', 'ZEP']);
    expect(teams[0].createdAt).toBeInstanceOf(Date);
  });

  it('filters players by team and active, and joins the team', async () => {
    const players = await repos.player.list({ teamId: 't1', active: true, page: 1 });
    expect(players).toHaveLength(1);
    expect(players[0].fullName).toBe('Bianca Ray');
    expect(players[0].team.abbreviation).toBe('ZEP');
  });

  it('does a case-insensitive name search', async () => {
    const players = await repos.player.list({ search: 'cody', page: 1 });
    expect(players.map((p) => p.id)).toEqual(['p3']);
  });

  it('applies page-based pagination in name order', async () => {
    const page1 = await repos.player.list({ limit: 1, page: 1 });
    const page2 = await repos.player.list({ limit: 1, page: 2 });
    expect(page1[0].fullName).toBe('Aaron Cole');
    expect(page2[0].fullName).toBe('Bianca Ray');
  });

  it('lists games newest-first with both teams embedded', async () => {
    const games = await repos.game.list({ limit: 10 });
    expect(games.map((g) => g.id)).toEqual(['g2', 'g1']);
    expect(games[0].homeTeam.abbreviation).toBe('ANC');
    expect(games[0].awayTeam.abbreviation).toBe('ZEP');
  });

  it('filters games by team (home or away)', async () => {
    const games = await repos.game.list({ teamId: 't2' });
    expect(games.map((g) => g.id).sort()).toEqual(['g1', 'g2']);
  });

  it("returns a player's game log ordered by date (desc), with game embedded", async () => {
    const log = await repos.playerGameStat.listByPlayerWithGame('p1', {
      order: 'desc',
    });
    expect(log.map((s) => s.gameId)).toEqual(['g2', 'g1']);
    expect(log[0].game.id).toBe('g2');
  });

  it('orders a box score by starter then points, with player embedded', async () => {
    const box = await repos.playerGameStat.listByGameWithPlayer('g1');
    // p1 is a starter (10 pts), p3 is not (30 pts) — starter wins the sort.
    expect(box.map((s) => s.playerId)).toEqual(['p1', 'p3']);
    expect(box[0].player.fullName).toBe('Bianca Ray');
  });

  it('returns prop lines for a player', async () => {
    const props = await repos.propLine.listByPlayer('p1');
    expect(props).toHaveLength(1);
    expect(props[0].statType).toBe('POINTS');
  });

  it('returns the first user', async () => {
    const user = await repos.user.findFirst();
    expect(user?.email).toBe('a@b.com');
  });
});
