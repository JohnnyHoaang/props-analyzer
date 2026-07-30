import { gameFixtures } from './games.js';
import { playerFixtures, type PlayerFixture } from './players.js';
import { hashString, mulberry32, randInt } from './random.js';

export interface PlayerGameStatFixture {
  playerId: string;
  /** Team the player suited up for in this game (mock players never move). */
  teamId: string;
  gameId: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  threePM: number;
  threePA: number;
  fgm: number;
  fga: number;
  ftm: number;
  fta: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  plusMinus: number;
  starter: boolean;
}

interface Archetype {
  minutes: [number, number];
  fga: [number, number];
  threePaShare: number; // fraction of fga that are three-point attempts
  threePct: number;
  fg2Pct: number;
  fta: [number, number];
  ftPct: number;
  rebounds: [number, number];
  assists: [number, number];
  steals: [number, number];
  blocks: [number, number];
  turnovers: [number, number];
  fouls: [number, number];
}

const ARCHETYPES: Record<PlayerFixture['position'], Archetype> = {
  PG: {
    minutes: [26, 37],
    fga: [10, 19],
    threePaShare: 0.45,
    threePct: 0.36,
    fg2Pct: 0.5,
    fta: [1, 6],
    ftPct: 0.82,
    rebounds: [2, 6],
    assists: [5, 11],
    steals: [1, 3],
    blocks: [0, 1],
    turnovers: [1, 4],
    fouls: [0, 4],
  },
  SG: {
    minutes: [26, 37],
    fga: [12, 21],
    threePaShare: 0.5,
    threePct: 0.37,
    fg2Pct: 0.47,
    fta: [1, 6],
    ftPct: 0.84,
    rebounds: [2, 5],
    assists: [2, 6],
    steals: [1, 3],
    blocks: [0, 1],
    turnovers: [1, 3],
    fouls: [0, 4],
  },
  SF: {
    minutes: [25, 36],
    fga: [9, 17],
    threePaShare: 0.35,
    threePct: 0.34,
    fg2Pct: 0.49,
    fta: [1, 5],
    ftPct: 0.78,
    rebounds: [4, 8],
    assists: [2, 5],
    steals: [0, 2],
    blocks: [0, 2],
    turnovers: [1, 3],
    fouls: [1, 4],
  },
  PF: {
    minutes: [24, 35],
    fga: [7, 15],
    threePaShare: 0.15,
    threePct: 0.31,
    fg2Pct: 0.53,
    fta: [2, 6],
    ftPct: 0.72,
    rebounds: [6, 11],
    assists: [1, 4],
    steals: [0, 2],
    blocks: [0, 2],
    turnovers: [1, 3],
    fouls: [1, 5],
  },
  C: {
    minutes: [22, 34],
    fga: [5, 12],
    threePaShare: 0.03,
    threePct: 0.25,
    fg2Pct: 0.58,
    fta: [2, 7],
    ftPct: 0.68,
    rebounds: [8, 14],
    assists: [0, 3],
    steals: [0, 1],
    blocks: [1, 3],
    turnovers: [1, 3],
    fouls: [2, 5],
  },
};

function generateStatLine(
  player: PlayerFixture,
  gameId: string,
  won: boolean,
  margin: number
): PlayerGameStatFixture {
  const rng = mulberry32(hashString(`${gameId}:${player.id}`));
  const archetype = ARCHETYPES[player.position];

  const minutes = randInt(rng, archetype.minutes);
  const fga = randInt(rng, archetype.fga);
  const threePA = Math.min(
    fga,
    Math.round(fga * archetype.threePaShare)
  );
  const threePM = Math.min(
    threePA,
    Math.round(threePA * archetype.threePct * (0.8 + rng() * 0.4))
  );
  const twoPA = fga - threePA;
  const twoPM = Math.min(
    twoPA,
    Math.round(twoPA * archetype.fg2Pct * (0.8 + rng() * 0.4))
  );
  const fgm = twoPM + threePM;

  const fta = randInt(rng, archetype.fta);
  const ftm = Math.min(
    fta,
    Math.round(fta * archetype.ftPct * (0.85 + rng() * 0.3))
  );

  const points = twoPM * 2 + threePM * 3 + ftm;
  const rebounds = randInt(rng, archetype.rebounds);
  const assists = randInt(rng, archetype.assists);
  const steals = randInt(rng, archetype.steals);
  const blocks = randInt(rng, archetype.blocks);
  const turnovers = randInt(rng, archetype.turnovers);
  const fouls = randInt(rng, archetype.fouls);

  const plusMinusNoise = randInt(rng, [-4, 4]);
  const plusMinus = (won ? 1 : -1) * Math.max(1, Math.round(margin / 2)) +
    plusMinusNoise;

  return {
    playerId: player.id,
    teamId: player.teamId,
    gameId,
    minutes,
    points,
    rebounds,
    assists,
    threePM,
    threePA,
    fgm,
    fga,
    ftm,
    fta,
    steals,
    blocks,
    turnovers,
    fouls,
    plusMinus,
    starter: true,
  };
}

const playersByTeam = new Map<string, PlayerFixture[]>();
for (const player of playerFixtures) {
  const teamPlayers = playersByTeam.get(player.teamId) ?? [];
  teamPlayers.push(player);
  playersByTeam.set(player.teamId, teamPlayers);
}

/**
 * Every player on both participating teams gets one box-score row per
 * completed game (6 rows per game x 15 games = 90 rows).
 */
export const playerGameStatFixtures: PlayerGameStatFixture[] =
  gameFixtures.flatMap((game) => {
    const margin = Math.abs(game.homeScore - game.awayScore);
    const homePlayers = playersByTeam.get(game.homeTeamId) ?? [];
    const awayPlayers = playersByTeam.get(game.awayTeamId) ?? [];
    const homeWon = game.homeScore > game.awayScore;

    return [
      ...homePlayers.map((player) =>
        generateStatLine(player, game.id, homeWon, margin)
      ),
      ...awayPlayers.map((player) =>
        generateStatLine(player, game.id, !homeWon, margin)
      ),
    ];
  });
