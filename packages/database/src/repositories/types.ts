import type {
  Game,
  GameStatus,
  GameType,
  Player,
  PlayerGameStat,
  PlayerPosition,
  PropLine,
  Team,
  User,
} from '@prisma/client';

/** Entities joined with their related rows, as the API mappers expect them. */
export type PlayerWithTeam = Player & { team: Team };
export type GameWithTeams = Game & { homeTeam: Team; awayTeam: Team };
export type PlayerGameStatWithGame = PlayerGameStat & { game: Game };
export type PlayerGameStatWithPlayer = PlayerGameStat & { player: Player };

export interface PlayerListFilter {
  teamId?: string;
  position?: PlayerPosition;
  active?: boolean;
  /** Case-insensitive substring match on full name. */
  search?: string;
  /** Omit to fetch every match. */
  limit?: number;
  /** Keyset cursor (a player id); when set, `page` is ignored. */
  cursor?: string;
  /** 1-based page index; used for offset pagination when `cursor` is absent. */
  page: number;
}

export interface GameListFilter {
  seasonId?: string;
  status?: GameStatus;
  gameType?: GameType;
  teamId?: string;
  limit?: number;
  /** Keyset cursor (a game id). */
  cursor?: string;
}

export interface TeamRepository {
  /** All teams, ordered by name ascending. */
  list(): Promise<Team[]>;
  findById(id: string): Promise<Team | null>;
}

export interface PlayerRepository {
  /** Players (with their team) matching the filter, ordered by full name. */
  list(filter: PlayerListFilter): Promise<PlayerWithTeam[]>;
  findByIdWithTeam(id: string): Promise<PlayerWithTeam | null>;
  findById(id: string): Promise<Player | null>;
}

export interface GameRepository {
  /** Games (with both teams) matching the filter, ordered by date descending. */
  list(filter: GameListFilter): Promise<GameWithTeams[]>;
  findByIdWithTeams(id: string): Promise<GameWithTeams | null>;
  findById(id: string): Promise<Game | null>;
}

export interface PlayerGameStatRepository {
  /** One player's box scores (with each game), ordered by game date. */
  listByPlayerWithGame(
    playerId: string,
    options: { order: 'asc' | 'desc'; limit?: number }
  ): Promise<PlayerGameStatWithGame[]>;
  /** One game's box score (with each player), starters first then points desc. */
  listByGameWithPlayer(gameId: string): Promise<PlayerGameStatWithPlayer[]>;
}

export interface PropLineRepository {
  listByPlayer(playerId: string): Promise<PropLine[]>;
}

export interface UserRepository {
  /** The stub "current user" — earliest profile by creation time. */
  findFirst(): Promise<User | null>;
}

/** The full set of domain repositories the API depends on. */
export interface Repositories {
  team: TeamRepository;
  player: PlayerRepository;
  game: GameRepository;
  playerGameStat: PlayerGameStatRepository;
  propLine: PropLineRepository;
  user: UserRepository;
}
