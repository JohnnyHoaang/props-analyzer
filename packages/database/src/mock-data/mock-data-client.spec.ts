import { createMockDataClient } from './mock-data-client.js';
import { loadMockDataFile } from './load-mock-data.js';

describe('createMockDataClient', () => {
  const data = loadMockDataFile();
  const client = createMockDataClient(data);

  it('lists teams sorted by name', async () => {
    const teams = await client.team.findMany({ orderBy: { name: 'asc' } });

    expect(teams).toHaveLength(6);
    expect(teams[0]?.name.localeCompare(teams[1]?.name ?? '') ?? 0).toBeLessThanOrEqual(
      0
    );
  });

  it('lists players with team relations', async () => {
    const players = await client.player.findMany({
      include: { team: true },
      orderBy: { fullName: 'asc' },
      take: 5,
    });

    expect(players).toHaveLength(5);
    expect(players[0] && 'team' in players[0] ? players[0].team.abbreviation : '').toMatch(
      /^[A-Z]{3}$/
    );
  });

  it('returns a game log ordered by most recent game', async () => {
    const players = await client.player.findMany({ take: 1 });
    const player = players[0];
    expect(player).toBeDefined();

    const stats = await client.playerGameStat.findMany({
      where: { playerId: player!.id },
      include: { game: true },
      orderBy: { game: { date: 'desc' } },
      take: 3,
    });

    expect(stats.length).toBeGreaterThan(0);
    const first = stats[0];
    const last = stats[stats.length - 1];
    expect(
      first && 'game' in first && last && 'game' in last
        ? first.game.date.getTime()
        : 0
    ).toBeGreaterThanOrEqual(
      last && 'game' in last ? last.game.date.getTime() : 0
    );
  });

  it('returns the stub current user', async () => {
    const user = await client.user.findFirst({ orderBy: { createdAt: 'asc' } });

    expect(user).toMatchObject({
      id: 'user-stub-1',
      email: 'demo@props-analyzer.local',
    });
  });

  it('filters injury reports by player and returns full history, most recent first', async () => {
    const reports = await client.injuryReport.findMany({
      where: { playerId: 'player-meridian-3' },
    });

    expect(reports.length).toBeGreaterThan(1);
    expect(reports.every((r) => r.playerId === 'player-meridian-3')).toBe(true);
    // Most recent report first — this player's current status is OUT.
    expect(reports[0]).toMatchObject({ status: 'OUT' });
    expect(reports[0]?.reportedAt).toBeInstanceOf(Date);
    for (let i = 1; i < reports.length; i++) {
      expect(reports[i - 1]!.reportedAt.getTime()).toBeGreaterThanOrEqual(
        reports[i]!.reportedAt.getTime()
      );
    }
  });

  it('filters lineup reports by player and returns full history, most recent first', async () => {
    const reports = await client.lineupReport.findMany({
      where: { playerId: 'player-lakeshore-3' },
    });

    expect(reports.length).toBeGreaterThan(1);
    expect(reports.every((r) => r.playerId === 'player-lakeshore-3')).toBe(true);
    expect(reports[0]).toMatchObject({ role: 'BENCH' });
  });

  it('returns one prop line per market for a player', async () => {
    const propLines = await client.propLine.findMany({
      where: { playerId: 'player-lakeshore-2' },
    });

    expect(propLines.length).toBe(11);
    expect(propLines.every((p) => p.playerId === 'player-lakeshore-2')).toBe(
      true
    );
    const points = propLines.find((p) => p.statType === 'POINTS');
    expect(points?.line).toBeGreaterThan(0);
    expect(points?.createdAt).toBeInstanceOf(Date);
  });
});
