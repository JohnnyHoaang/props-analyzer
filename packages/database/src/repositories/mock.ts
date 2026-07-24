import { createMockDataClient } from '../mock-data/mock-data-client.js';
import type { MockDataFile } from '../mock-data/types.js';
import type {
  GameListFilter,
  GameWithTeams,
  PlayerGameStatWithGame,
  PlayerGameStatWithPlayer,
  PlayerListFilter,
  PlayerWithTeam,
  Repositories,
} from './types.js';

/**
 * Mock repositories backed by the existing in-memory `createMockDataClient`.
 * Rather than reimplement filtering/sorting/pagination, this adapts the
 * already-tested Prisma-shaped mock client to the domain repository methods —
 * so `DATA_SOURCE=mock` and the test suite keep their exact behavior while
 * services depend only on the repository interfaces.
 */
export function createMockRepositories(data: MockDataFile): Repositories {
  const db = createMockDataClient(data);

  return {
    team: {
      list: () => db.team.findMany({ orderBy: { name: 'asc' } }),
      findById: (id) => db.team.findUnique({ where: { id } }),
    },

    player: {
      list: (filter: PlayerListFilter) => {
        const where = {
          ...(filter.teamId ? { teamId: filter.teamId } : {}),
          ...(filter.position ? { position: filter.position } : {}),
          ...(filter.active !== undefined ? { active: filter.active } : {}),
          ...(filter.search
            ? { fullName: { contains: filter.search, mode: 'insensitive' as const } }
            : {}),
        };

        const pagination =
          filter.cursor !== undefined
            ? {
                cursor: { id: filter.cursor },
                skip: 1,
                ...(filter.limit !== undefined ? { take: filter.limit } : {}),
              }
            : filter.limit !== undefined
              ? { take: filter.limit, skip: (filter.page - 1) * filter.limit }
              : {};

        return db.player.findMany({
          where,
          include: { team: true },
          orderBy: { fullName: 'asc' },
          ...pagination,
        }) as Promise<PlayerWithTeam[]>;
      },
      findByIdWithTeam: (id) =>
        db.player.findUnique({
          where: { id },
          include: { team: true },
        }) as Promise<PlayerWithTeam | null>,
      findById: (id) => db.player.findUnique({ where: { id } }),
    },

    game: {
      list: (filter: GameListFilter) => {
        const where = {
          ...(filter.seasonId ? { seasonId: filter.seasonId } : {}),
          ...(filter.status ? { status: filter.status } : {}),
          ...(filter.gameType ? { gameType: filter.gameType } : {}),
          ...(filter.teamId
            ? {
                OR: [
                  { homeTeamId: filter.teamId },
                  { awayTeamId: filter.teamId },
                ],
              }
            : {}),
        };

        return db.game.findMany({
          where,
          include: { homeTeam: true, awayTeam: true },
          orderBy: { date: 'desc' },
          ...(filter.limit !== undefined ? { take: filter.limit } : {}),
          ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
        }) as Promise<GameWithTeams[]>;
      },
      findByIdWithTeams: (id) =>
        db.game.findUnique({
          where: { id },
          include: { homeTeam: true, awayTeam: true },
        }) as Promise<GameWithTeams | null>,
      findById: (id) => db.game.findUnique({ where: { id } }),
    },

    playerGameStat: {
      listByPlayerWithGame: (playerId, options) =>
        db.playerGameStat.findMany({
          where: { playerId },
          include: { game: true },
          orderBy: { game: { date: options.order } },
          ...(options.limit !== undefined ? { take: options.limit } : {}),
        }) as Promise<PlayerGameStatWithGame[]>,
      listByGameWithPlayer: (gameId) =>
        db.playerGameStat.findMany({
          where: { gameId },
          include: { player: true },
          orderBy: [{ starter: 'desc' }, { points: 'desc' }],
        }) as Promise<PlayerGameStatWithPlayer[]>,
    },

    propLine: {
      listByPlayer: (playerId) =>
        db.propLine.findMany({ where: { playerId } }),
    },

    user: {
      findFirst: () => db.user.findFirst({ orderBy: { createdAt: 'asc' } }),
    },
  };
}
