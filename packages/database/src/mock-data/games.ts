import { seasonFixtures } from './seasons.js';
import { teamFixtures } from './teams.js';
import { hashString, mulberry32, randInt } from './random.js';
import { addDays, toISODate } from './dates.js';

export interface GameFixture {
  id: string;
  seasonId: string;
  date: string; // ISO date
  status: 'SCHEDULED' | 'FINAL' | 'POSTPONED';
  gameType: 'REGULAR_SEASON' | 'PLAYOFFS';
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  overtimePeriods: number;
}

const SEASON_ID = seasonFixtures[0].id;
const START_DATE = new Date('2025-11-01T00:00:00.000Z');
const DAYS_BETWEEN_ROUNDS = 3;
/** Each pair of teams meets this many times (must be even so wins/losses at
 * home stay balanced — half home, half away per pairing). */
const MEETINGS_PER_PAIR = 4;

/**
 * Standard "circle method" round-robin scheduler: holds one team fixed and
 * rotates the rest, producing `teams.length - 1` rounds where every team
 * plays exactly once per round (so a round can be scheduled on a single
 * date without double-booking any team).
 */
function buildRoundRobinRounds(teamIds: string[]): Array<Array<[string, string]>> {
  const n = teamIds.length;
  const fixed = teamIds[0];
  let rotating = teamIds.slice(1);
  const rounds: Array<Array<[string, string]>> = [];

  for (let round = 0; round < n - 1; round++) {
    const arranged = [fixed, ...rotating];
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < n / 2; i++) {
      pairs.push([arranged[i], arranged[n - 1 - i]]);
    }
    rounds.push(pairs);
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }

  return rounds;
}

function generateScore(gameId: string): {
  homeScore: number;
  awayScore: number;
  overtimePeriods: number;
} {
  const rng = mulberry32(hashString(`score:${gameId}`));
  const homeAdvantage = 3;

  let homeScore = randInt(rng, [96, 125]) + homeAdvantage;
  let awayScore = randInt(rng, [96, 125]);
  let overtimePeriods = 0;

  if (homeScore === awayScore) {
    overtimePeriods = 1;
    const extra = randInt(rng, [4, 9]);
    if (rng() < 0.5) {
      homeScore += extra;
    } else {
      awayScore += extra;
    }
  }

  return { homeScore, awayScore, overtimePeriods };
}

/**
 * A balanced regular-season schedule: every pair of the six mock teams
 * meets four times (twice at each team's home court), built from
 * `MEETINGS_PER_PAIR` repeats of a single round-robin so no team ever plays
 * twice on the same date. All games are final — Phase 1 only deals with
 * completed box scores (see AGENTS.md: no live game tracking).
 */
function buildGameFixtures(): GameFixture[] {
  const rounds = buildRoundRobinRounds(teamFixtures.map((team) => team.id));
  const games: GameFixture[] = [];
  let globalIndex = 0;

  for (let leg = 0; leg < MEETINGS_PER_PAIR; leg++) {
    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
      const dateIndex = leg * rounds.length + roundIndex;
      const date = toISODate(
        addDays(START_DATE, dateIndex * DAYS_BETWEEN_ROUNDS)
      );

      for (const [teamA, teamB] of rounds[roundIndex]) {
        // Alternate which side of the pairing hosts, so across
        // MEETINGS_PER_PAIR legs each team hosts exactly half the meetings.
        const [homeTeamId, awayTeamId] =
          leg % 2 === 0 ? [teamA, teamB] : [teamB, teamA];

        globalIndex++;
        const id = `game-${String(globalIndex).padStart(3, '0')}`;
        const { homeScore, awayScore, overtimePeriods } = generateScore(id);

        games.push({
          id,
          seasonId: SEASON_ID,
          date,
          status: 'FINAL',
          gameType: 'REGULAR_SEASON',
          homeTeamId,
          awayTeamId,
          homeScore,
          awayScore,
          overtimePeriods,
        });
      }
    }
  }

  return games;
}

export const gameFixtures: GameFixture[] = buildGameFixtures();
