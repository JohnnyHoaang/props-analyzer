import { gameFixtures } from './games.js';
import { injuryReportFixtures } from './injuries.js';
import { lineupReportFixtures } from './lineups.js';
import { playerFixtures } from './players.js';
import { playerGameStatFixtures } from './player-game-stats.js';
import {
  PROP_STAT_TYPES_FIXTURE,
  propLineFixtures,
} from './prop-lines.js';
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
      injuryReportFixtures,
      lineupReportFixtures,
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

  it('is a balanced schedule: every pair of teams meets four times (twice home, twice away)', () => {
    expect(gameFixtures).toHaveLength(60); // C(6, 2) pairs x 4 meetings

    const meetingCounts = new Map<string, number>();
    for (const game of gameFixtures) {
      const key = [game.homeTeamId, game.awayTeamId].sort().join(':');
      meetingCounts.set(key, (meetingCounts.get(key) ?? 0) + 1);
    }
    expect(meetingCounts.size).toBe(15); // C(6, 2)
    for (const count of meetingCounts.values()) {
      expect(count).toBe(4);
    }

    const gamesPerTeam = new Map<string, number>();
    const homeGamesPerTeam = new Map<string, number>();
    for (const game of gameFixtures) {
      gamesPerTeam.set(
        game.homeTeamId,
        (gamesPerTeam.get(game.homeTeamId) ?? 0) + 1
      );
      gamesPerTeam.set(
        game.awayTeamId,
        (gamesPerTeam.get(game.awayTeamId) ?? 0) + 1
      );
      homeGamesPerTeam.set(
        game.homeTeamId,
        (homeGamesPerTeam.get(game.homeTeamId) ?? 0) + 1
      );
    }
    for (const teamId of teamIds) {
      expect(gamesPerTeam.get(teamId)).toBe(20);
      expect(homeGamesPerTeam.get(teamId)).toBe(10);
    }
  });

  it('never schedules a team to play itself or play twice on the same date', () => {
    const seenPerDate = new Map<string, Set<string>>();
    for (const game of gameFixtures) {
      expect(game.homeTeamId).not.toBe(game.awayTeamId);
      const teamsOnDate = seenPerDate.get(game.date) ?? new Set<string>();
      expect(teamsOnDate.has(game.homeTeamId)).toBe(false);
      expect(teamsOnDate.has(game.awayTeamId)).toBe(false);
      teamsOnDate.add(game.homeTeamId);
      teamsOnDate.add(game.awayTeamId);
      seenPerDate.set(game.date, teamsOnDate);
    }
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

  it('gives every player at least one injury report and one lineup report, with real history for some', () => {
    // More rows than players proves this is a history, not just one
    // current snapshot per player.
    expect(injuryReportFixtures.length).toBeGreaterThan(playerFixtures.length);
    expect(lineupReportFixtures.length).toBeGreaterThan(playerFixtures.length);

    const injuryPlayerIds = new Set(injuryReportFixtures.map((r) => r.playerId));
    const lineupPlayerIds = new Set(lineupReportFixtures.map((r) => r.playerId));
    expect(injuryPlayerIds).toEqual(playerIds);
    expect(lineupPlayerIds).toEqual(playerIds);
  });

  it("orders each player's injury and lineup history chronologically", () => {
    for (const player of playerFixtures) {
      for (const fixtures of [injuryReportFixtures, lineupReportFixtures]) {
        const history = fixtures.filter((r) => r.playerId === player.id);
        expect(history.length).toBeGreaterThan(0);

        const timestamps = history.map((r) => new Date(r.reportedAt).getTime());
        const sorted = [...timestamps].sort((a, b) => a - b);
        expect(timestamps).toEqual(sorted);
      }
    }
  });

  it('every injury and lineup report references a real player', () => {
    for (const report of injuryReportFixtures) {
      expect(playerIds.has(report.playerId)).toBe(true);
    }
    for (const report of lineupReportFixtures) {
      expect(playerIds.has(report.playerId)).toBe(true);
    }
  });

  it('gives every player one prop line per market, with sane lines and odds', () => {
    expect(propLineFixtures).toHaveLength(
      playerFixtures.length * PROP_STAT_TYPES_FIXTURE.length
    );

    for (const propLine of propLineFixtures) {
      expect(playerIds.has(propLine.playerId)).toBe(true);
      // .5 lines guarantee no exact pushes.
      expect(propLine.line % 1).toBeCloseTo(0.5);
      expect(propLine.line).toBeGreaterThan(0);
      // American odds are never in the illegal -99..+99 gap.
      expect(Math.abs(propLine.overOdds)).toBeGreaterThanOrEqual(100);
      expect(Math.abs(propLine.underOdds)).toBeGreaterThanOrEqual(100);
    }

    // Each player has exactly one line per statType (matches the DB's
    // @@unique([playerId, statType])).
    for (const player of playerFixtures) {
      const forPlayer = propLineFixtures.filter(
        (p) => p.playerId === player.id
      );
      const statTypes = new Set(forPlayer.map((p) => p.statType));
      expect(statTypes.size).toBe(forPlayer.length);
    }
  });

  it('includes at least one non-active injury status and one non-starter lineup role', () => {
    expect(
      injuryReportFixtures.some((r) => r.status !== 'ACTIVE')
    ).toBe(true);
    expect(
      lineupReportFixtures.some((r) => r.role !== 'STARTER')
    ).toBe(true);
  });
});
