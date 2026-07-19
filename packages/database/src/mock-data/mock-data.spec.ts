import { gameFixtures } from './games.js';
import { playerFixtures } from './players.js';
import { playerGameStatFixtures } from './player-game-stats.js';
import { seasonFixtures } from './seasons.js';
import { teamFixtures } from './teams.js';
import { userFixtures } from './users.js';

describe('mock-data fixtures', () => {
  const teamIds = new Set(teamFixtures.map((t) => t.id));
  const playerIds = new Set(playerFixtures.map((p) => p.id));
  const seasonIds = new Set(seasonFixtures.map((s) => s.id));
  const gameIds = new Set(gameFixtures.map((g) => g.id));

  it('has unique ids within every fixture list', () => {
    for (const fixtures of [
      userFixtures,
      teamFixtures,
      playerFixtures,
      seasonFixtures,
      gameFixtures,
    ]) {
      const ids = fixtures.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('every player references a real team', () => {
    for (const player of playerFixtures) {
      expect(teamIds.has(player.teamId)).toBe(true);
    }
  });

  it('every game references a real season and two distinct real teams', () => {
    for (const game of gameFixtures) {
      expect(seasonIds.has(game.seasonId)).toBe(true);
      expect(teamIds.has(game.homeTeamId)).toBe(true);
      expect(teamIds.has(game.awayTeamId)).toBe(true);
      expect(game.homeTeamId).not.toBe(game.awayTeamId);
    }
  });

  it('is a full round-robin: every team plays every other team exactly once', () => {
    expect(gameFixtures).toHaveLength(15); // C(6, 2)
    const pairings = new Set(
      gameFixtures.map(
        (g) => [g.homeTeamId, g.awayTeamId].sort().join(':')
      )
    );
    expect(pairings.size).toBe(15);
  });

  it('generates exactly one box score per player for every game they played', () => {
    for (const game of gameFixtures) {
      const rowsForGame = playerGameStatFixtures.filter(
        (s) => s.gameId === game.id
      );
      const rosterSize = playerFixtures.filter(
        (p) => p.teamId === game.homeTeamId || p.teamId === game.awayTeamId
      ).length;
      expect(rowsForGame).toHaveLength(rosterSize);
    }

    for (const stat of playerGameStatFixtures) {
      expect(playerIds.has(stat.playerId)).toBe(true);
      expect(gameIds.has(stat.gameId)).toBe(true);
    }
  });

  it('produces internally consistent box scores', () => {
    for (const stat of playerGameStatFixtures) {
      expect(stat.fgm).toBeLessThanOrEqual(stat.fga);
      expect(stat.threePM).toBeLessThanOrEqual(stat.threePA);
      expect(stat.threePA).toBeLessThanOrEqual(stat.fga);
      expect(stat.ftm).toBeLessThanOrEqual(stat.fta);
      expect(stat.minutes).toBeGreaterThan(0);
      expect(stat.minutes).toBeLessThanOrEqual(48);

      const expectedPoints =
        (stat.fgm - stat.threePM) * 2 + stat.threePM * 3 + stat.ftm;
      expect(stat.points).toBe(expectedPoints);
    }
  });

  it('produces deterministic output across repeated generation', async () => {
    // Re-import via a fresh module registry to confirm the PRNG is seeded,
    // not relying on Math.random or wall-clock time.
    jest.resetModules();
    const rerun = await import('./player-game-stats.js');
    expect(rerun.playerGameStatFixtures).toEqual(playerGameStatFixtures);
  });
});
