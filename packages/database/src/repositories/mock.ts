import type {
  Game,
  Player,
  PlayerGameStat,
  PropLine,
  Team,
  User,
} from '../entity-types.js';
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
 * Mock repositories backed directly by the in-memory fixtures. No database and
 * no Prisma — just arrays with timestamps added, so `DATA_SOURCE=mock` and the
 * test suite run without any external service.
 */

const MOCK_EPOCH = new Date('2025-01-01T00:00:00.000Z');

function withTimestamps<T>(record: T): T & { createdAt: Date; updatedAt: Date } {
  return { ...record, createdAt: MOCK_EPOCH, updatedAt: MOCK_EPOCH };
}

interface Store {
  teams: Team[];
  teamsById: Map<string, Team>;
  players: Player[];
  playersById: Map<string, Player>;
  games: Game[];
  gamesById: Map<string, Game>;
  stats: PlayerGameStat[];
  propLines: PropLine[];
  users: User[];
}

function buildStore(data: MockDataFile): Store {
  const teams = data.teams.map((team) => withTimestamps(team) as Team);
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  const players = data.players.map((player) => withTimestamps(player) as Player);
  const playersById = new Map(players.map((player) => [player.id, player]));

  const games = data.games.map(
    (game) => withTimestamps({ ...game, date: new Date(game.date) }) as Game
  );
  const gamesById = new Map(games.map((game) => [game.id, game]));

  const stats = data.playerGameStats.map(
    (stat) =>
      withTimestamps({
        ...stat,
        id: `stat-${stat.playerId}-${stat.gameId}`,
      }) as PlayerGameStat
  );

  const propLines = data.propLines.map(
    (propLine) => withTimestamps(propLine) as PropLine
  );
  const users = data.users.map((user) => withTimestamps(user) as User);

  return {
    teams,
    teamsById,
    players,
    playersById,
    games,
    gamesById,
    stats,
    propLines,
    users,
  };
}

export function createMockRepositories(data: MockDataFile): Repositories {
  const store = buildStore(data);

  const requireTeam = (teamId: string): Team => {
    const team = store.teamsById.get(teamId);
    if (!team) throw new Error(`Mock data is missing team ${teamId}`);
    return team;
  };
  const requireGame = (gameId: string): Game => {
    const game = store.gamesById.get(gameId);
    if (!game) throw new Error(`Mock data is missing game ${gameId}`);
    return game;
  };
  const requirePlayer = (playerId: string): Player => {
    const player = store.playersById.get(playerId);
    if (!player) throw new Error(`Mock data is missing player ${playerId}`);
    return player;
  };

  return {
    team: {
      async list() {
        return [...store.teams].sort((a, b) => a.name.localeCompare(b.name));
      },
      async findById(id) {
        return store.teamsById.get(id) ?? null;
      },
    },

    player: {
      async list(filter: PlayerListFilter): Promise<PlayerWithTeam[]> {
        const search = filter.search?.toLowerCase();
        let rows = store.players.filter(
          (p) =>
            (!filter.teamId || p.teamId === filter.teamId) &&
            (!filter.position || p.position === filter.position) &&
            (filter.active === undefined || p.active === filter.active) &&
            (!search || p.fullName.toLowerCase().includes(search))
        );
        rows.sort((a, b) => a.fullName.localeCompare(b.fullName));

        if (filter.cursor !== undefined) {
          const index = rows.findIndex((r) => r.id === filter.cursor);
          if (index >= 0) rows = rows.slice(index + 1);
          if (filter.limit !== undefined) rows = rows.slice(0, filter.limit);
        } else if (filter.limit !== undefined) {
          const from = (filter.page - 1) * filter.limit;
          rows = rows.slice(from, from + filter.limit);
        }

        return rows.map((p) => ({ ...p, team: requireTeam(p.teamId) }));
      },
      async findByIdWithTeam(id) {
        const player = store.playersById.get(id);
        return player ? { ...player, team: requireTeam(player.teamId) } : null;
      },
      async findById(id) {
        return store.playersById.get(id) ?? null;
      },
    },

    game: {
      async list(filter: GameListFilter): Promise<GameWithTeams[]> {
        let rows = store.games.filter(
          (g) =>
            (!filter.seasonId || g.seasonId === filter.seasonId) &&
            (!filter.status || g.status === filter.status) &&
            (!filter.gameType || g.gameType === filter.gameType) &&
            (!filter.teamId ||
              g.homeTeamId === filter.teamId ||
              g.awayTeamId === filter.teamId)
        );
        rows.sort((a, b) => b.date.getTime() - a.date.getTime());

        if (filter.cursor) {
          const index = rows.findIndex((r) => r.id === filter.cursor);
          if (index >= 0) rows = rows.slice(index + 1);
        }
        if (filter.limit !== undefined) rows = rows.slice(0, filter.limit);

        return rows.map((g) => ({
          ...g,
          homeTeam: requireTeam(g.homeTeamId),
          awayTeam: requireTeam(g.awayTeamId),
        }));
      },
      async findByIdWithTeams(id) {
        const game = store.gamesById.get(id);
        return game
          ? {
              ...game,
              homeTeam: requireTeam(game.homeTeamId),
              awayTeam: requireTeam(game.awayTeamId),
            }
          : null;
      },
      async findById(id) {
        return store.gamesById.get(id) ?? null;
      },
    },

    playerGameStat: {
      async listByPlayerWithGame(
        playerId,
        options
      ): Promise<PlayerGameStatWithGame[]> {
        const rows = store.stats
          .filter((s) => s.playerId === playerId)
          .map((s) => ({ ...s, game: requireGame(s.gameId) }));
        rows.sort((a, b) => {
          const diff = a.game.date.getTime() - b.game.date.getTime();
          return options.order === 'asc' ? diff : -diff;
        });
        return options.limit !== undefined
          ? rows.slice(0, options.limit)
          : rows;
      },
      async listByGameWithPlayer(gameId): Promise<PlayerGameStatWithPlayer[]> {
        return store.stats
          .filter((s) => s.gameId === gameId)
          .map((s) => ({ ...s, player: requirePlayer(s.playerId) }))
          .sort(
            (a, b) =>
              Number(b.starter) - Number(a.starter) || b.points - a.points
          );
      },
    },

    propLine: {
      async listByPlayer(playerId) {
        return store.propLines.filter((p) => p.playerId === playerId);
      },
    },

    user: {
      async findFirst() {
        return (
          [...store.users].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          )[0] ?? null
        );
      },
    },
  };
}
