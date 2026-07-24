import type {
  Game,
  InjuryReport,
  LineupReport,
  Player,
  PlayerGameStat,
  Prisma,
  PropLine,
  Team,
  User,
} from '@prisma/client';
import type { DataClient } from '../data-client.js';
import type { MockDataFile } from './types.js';

const MOCK_EPOCH = new Date('2025-01-01T00:00:00.000Z');

function withTimestamps<T extends { id: string }>(
  record: T
): T & { createdAt: Date; updatedAt: Date } {
  return {
    ...record,
    createdAt: MOCK_EPOCH,
    updatedAt: MOCK_EPOCH,
  };
}

function withStatTimestamps(
  record: Omit<PlayerGameStat, 'id' | 'createdAt' | 'updatedAt'>,
  id: string
): PlayerGameStat {
  return {
    ...record,
    id,
    createdAt: MOCK_EPOCH,
    updatedAt: MOCK_EPOCH,
  };
}

interface MockStore {
  users: User[];
  teams: Team[];
  players: Player[];
  games: Game[];
  playerGameStats: PlayerGameStat[];
  injuryReports: InjuryReport[];
  lineupReports: LineupReport[];
  propLines: PropLine[];
  teamsById: Map<string, Team>;
  playersById: Map<string, Player>;
  gamesById: Map<string, Game>;
}

function buildStore(data: MockDataFile): MockStore {
  const teams = data.teams.map((team) => withTimestamps(team));
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  const players = data.players.map((player) => withTimestamps(player));
  const playersById = new Map(players.map((player) => [player.id, player]));

  const games = data.games.map((game) =>
    withTimestamps({ ...game, date: new Date(game.date) })
  );
  const gamesById = new Map(games.map((game) => [game.id, game]));

  const users = data.users.map((user) => withTimestamps(user));

  const playerGameStats = data.playerGameStats.map((stat) =>
    withStatTimestamps(stat, `stat-${stat.playerId}-${stat.gameId}`)
  );

  const injuryReports = data.injuryReports.map((report) =>
    withTimestamps({
      ...report,
      reportedAt: new Date(report.reportedAt),
      expectedReturn: report.expectedReturn
        ? new Date(report.expectedReturn)
        : null,
    })
  );

  const lineupReports = data.lineupReports.map((report) =>
    withTimestamps({ ...report, reportedAt: new Date(report.reportedAt) })
  );

  const propLines = data.propLines.map((propLine) => withTimestamps(propLine));

  return {
    users,
    teams,
    players,
    games,
    playerGameStats,
    injuryReports,
    lineupReports,
    propLines,
    teamsById,
    playersById,
    gamesById,
  };
}

function matchesPlayerWhere(
  player: Player,
  where: Prisma.PlayerWhereInput | undefined
): boolean {
  if (!where) {
    return true;
  }

  if (where.teamId && player.teamId !== where.teamId) {
    return false;
  }

  if (where.position && player.position !== where.position) {
    return false;
  }

  if (where.active !== undefined && player.active !== where.active) {
    return false;
  }

  if (where.id && player.id !== where.id) {
    return false;
  }

  if (where.fullName && typeof where.fullName === 'object') {
    const fullNameFilter = where.fullName;

    if ('contains' in fullNameFilter && typeof fullNameFilter.contains === 'string') {
      const haystack =
        fullNameFilter.mode === 'insensitive'
          ? player.fullName.toLowerCase()
          : player.fullName;
      const needle =
        fullNameFilter.mode === 'insensitive'
          ? fullNameFilter.contains.toLowerCase()
          : fullNameFilter.contains;

      if (!haystack.includes(needle)) {
        return false;
      }
    }
  }

  return true;
}

function matchesGameWhere(
  game: Game,
  where: Prisma.GameWhereInput | undefined
): boolean {
  if (!where) {
    return true;
  }

  if (where.seasonId && game.seasonId !== where.seasonId) {
    return false;
  }

  if (where.status && game.status !== where.status) {
    return false;
  }

  if (where.gameType && game.gameType !== where.gameType) {
    return false;
  }

  if (where.id && game.id !== where.id) {
    return false;
  }

  if (where.OR?.length) {
    const matchesTeam = where.OR.some((clause) => {
      if ('homeTeamId' in clause && clause.homeTeamId) {
        return game.homeTeamId === clause.homeTeamId;
      }
      if ('awayTeamId' in clause && clause.awayTeamId) {
        return game.awayTeamId === clause.awayTeamId;
      }
      return false;
    });

    if (!matchesTeam) {
      return false;
    }
  }

  return true;
}

function sortPlayers(
  players: Player[],
  orderBy:
    | Prisma.PlayerOrderByWithRelationInput
    | Prisma.PlayerOrderByWithRelationInput[]
    | undefined
): Player[] {
  const sorted = [...players];
  const clause = Array.isArray(orderBy) ? orderBy[0] : orderBy;

  if (clause?.fullName === 'asc') {
    sorted.sort((a, b) => a.fullName.localeCompare(b.fullName));
  } else if (clause?.fullName === 'desc') {
    sorted.sort((a, b) => b.fullName.localeCompare(a.fullName));
  }

  return sorted;
}

function sortGames(
  games: Game[],
  orderBy:
    | Prisma.GameOrderByWithRelationInput
    | Prisma.GameOrderByWithRelationInput[]
    | undefined
): Game[] {
  const sorted = [...games];
  const clause = Array.isArray(orderBy) ? orderBy[0] : orderBy;

  if (clause?.date === 'asc') {
    sorted.sort((a, b) => a.date.getTime() - b.date.getTime());
  } else if (clause?.date === 'desc') {
    sorted.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  return sorted;
}

function applyCursor<T extends { id: string }>(
  rows: T[],
  cursor: Prisma.PlayerWhereUniqueInput | Prisma.GameWhereUniqueInput | undefined,
  skip: number | undefined
): T[] {
  if (!cursor?.id) {
    return rows;
  }

  const index = rows.findIndex((row) => row.id === cursor.id);
  if (index < 0) {
    return rows;
  }

  return rows.slice(index + (skip ?? 0));
}

function sortPlayerGameStats(
  stats: PlayerGameStat[],
  orderBy:
    | Prisma.PlayerGameStatOrderByWithRelationInput
    | Prisma.PlayerGameStatOrderByWithRelationInput[]
    | undefined,
  gamesById: Map<string, Game>
): PlayerGameStat[] {
  const sorted = [...stats];

  if (Array.isArray(orderBy)) {
    sorted.sort((a, b) => {
      for (const clause of orderBy) {
        if (clause.starter !== undefined) {
          const starterDiff =
            clause.starter === 'desc'
              ? Number(b.starter) - Number(a.starter)
              : Number(a.starter) - Number(b.starter);
          if (starterDiff !== 0) {
            return starterDiff;
          }
        }

        if (clause.points !== undefined) {
          const pointsDiff =
            clause.points === 'desc'
              ? b.points - a.points
              : a.points - b.points;
          if (pointsDiff !== 0) {
            return pointsDiff;
          }
        }
      }

      return 0;
    });

    return sorted;
  }

  if (orderBy?.game?.date) {
    sorted.sort((a, b) => {
      const aDate = gamesById.get(a.gameId)?.date.getTime() ?? 0;
      const bDate = gamesById.get(b.gameId)?.date.getTime() ?? 0;
      return orderBy.game?.date === 'asc' ? aDate - bDate : bDate - aDate;
    });
  }

  return sorted;
}

function requireTeam(store: MockStore, teamId: string): Team {
  const team = store.teamsById.get(teamId);
  if (!team) {
    throw new Error(`Mock data is missing team ${teamId}`);
  }
  return team;
}

function requireGame(store: MockStore, gameId: string): Game {
  const game = store.gamesById.get(gameId);
  if (!game) {
    throw new Error(`Mock data is missing game ${gameId}`);
  }
  return game;
}

function requirePlayer(store: MockStore, playerId: string): Player {
  const player = store.playersById.get(playerId);
  if (!player) {
    throw new Error(`Mock data is missing player ${playerId}`);
  }
  return player;
}

export function createMockDataClient(data: MockDataFile): DataClient {
  const store = buildStore(data);

  return {
    user: {
      async findFirst(args) {
        const sorted = [...store.users];

        if (args?.orderBy?.createdAt === 'asc') {
          sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        } else if (args?.orderBy?.createdAt === 'desc') {
          sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }

        return sorted[0] ?? null;
      },
    },

    team: {
      async findMany(args) {
        const sorted = [...store.teams];

        if (args?.orderBy?.name === 'asc') {
          sorted.sort((a, b) => a.name.localeCompare(b.name));
        } else if (args?.orderBy?.name === 'desc') {
          sorted.sort((a, b) => b.name.localeCompare(a.name));
        }

        return sorted;
      },

      async findUnique(args) {
        return store.teamsById.get(args.where.id) ?? null;
      },
    },

    player: {
      async findMany(args) {
        let rows = store.players.filter((player) =>
          matchesPlayerWhere(player, args.where)
        );
        rows = sortPlayers(rows, args.orderBy);
        rows = applyCursor(rows, args.cursor, args.skip);

        if (args.take !== undefined) {
          rows = rows.slice(0, args.take);
        }

        if (args.include?.team) {
          return rows.map((player) => ({
            ...player,
            team: requireTeam(store, player.teamId),
          }));
        }

        return rows;
      },

      async findUnique(args) {
        const player = store.playersById.get(args.where.id ?? '');
        if (!player) {
          return null;
        }

        if (args.include?.team) {
          return {
            ...player,
            team: requireTeam(store, player.teamId),
          };
        }

        return player;
      },
    },

    game: {
      async findMany(args) {
        let rows = store.games.filter((game) =>
          matchesGameWhere(game, args.where)
        );
        rows = sortGames(rows, args.orderBy);
        rows = applyCursor(rows, args.cursor, args.skip);

        if (args.take !== undefined) {
          rows = rows.slice(0, args.take);
        }

        if (args.include?.homeTeam || args.include?.awayTeam) {
          return rows.map((game) => ({
            ...game,
            ...(args.include?.homeTeam
              ? { homeTeam: requireTeam(store, game.homeTeamId) }
              : {}),
            ...(args.include?.awayTeam
              ? { awayTeam: requireTeam(store, game.awayTeamId) }
              : {}),
          }));
        }

        return rows;
      },

      async findUnique(args) {
        const game = store.gamesById.get(args.where.id ?? '');
        if (!game) {
          return null;
        }

        if (args.include?.homeTeam || args.include?.awayTeam) {
          return {
            ...game,
            ...(args.include?.homeTeam
              ? { homeTeam: requireTeam(store, game.homeTeamId) }
              : {}),
            ...(args.include?.awayTeam
              ? { awayTeam: requireTeam(store, game.awayTeamId) }
              : {}),
          };
        }

        return game;
      },
    },

    playerGameStat: {
      async findMany(args = {}) {
        let rows = store.playerGameStats.filter((stat) => {
          if (args.where?.playerId && stat.playerId !== args.where.playerId) {
            return false;
          }

          if (args.where?.gameId && stat.gameId !== args.where.gameId) {
            return false;
          }

          return true;
        });

        rows = sortPlayerGameStats(rows, args.orderBy, store.gamesById);

        if (args.take !== undefined) {
          rows = rows.slice(0, args.take);
        }

        if (args.include?.game || args.include?.player) {
          return rows.map((stat) => ({
            ...stat,
            ...(args.include?.game
              ? { game: requireGame(store, stat.gameId) }
              : {}),
            ...(args.include?.player
              ? { player: requirePlayer(store, stat.playerId) }
              : {}),
          }));
        }

        return rows;
      },
    },

    injuryReport: {
      async findMany(args = {}) {
        let rows = store.injuryReports.filter(
          (report) =>
            !args.where?.playerId || report.playerId === args.where.playerId
        );

        rows = [...rows].sort(
          (a, b) => b.reportedAt.getTime() - a.reportedAt.getTime()
        );

        if (args.take !== undefined) {
          rows = rows.slice(0, args.take);
        }

        return rows;
      },
    },

    lineupReport: {
      async findMany(args = {}) {
        let rows = store.lineupReports.filter(
          (report) =>
            !args.where?.playerId || report.playerId === args.where.playerId
        );

        rows = [...rows].sort(
          (a, b) => b.reportedAt.getTime() - a.reportedAt.getTime()
        );

        if (args.take !== undefined) {
          rows = rows.slice(0, args.take);
        }

        return rows;
      },
    },

    propLine: {
      async findMany(args = {}) {
        let rows = store.propLines.filter(
          (propLine) =>
            !args.where?.playerId || propLine.playerId === args.where.playerId
        );

        if (args.take !== undefined) {
          rows = rows.slice(0, args.take);
        }

        return rows;
      },
    },
  };
}
