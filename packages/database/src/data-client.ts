import type {
  Game,
  InjuryReport,
  LineupReport,
  Player,
  PlayerGameStat,
  Prisma,
  PrismaClient,
  PropLine,
  Team,
  User,
} from '@prisma/client';

type PlayerWithTeam = Player & { team: Team };
type GameWithTeams = Game & { homeTeam: Team; awayTeam: Team };
type PlayerGameStatWithGame = PlayerGameStat & { game: Game };
type PlayerGameStatWithPlayer = PlayerGameStat & { player: Player };

/** Subset of PrismaClient used by apps/api services. Both the real Prisma
 * client and the JSON-backed mock client implement this shape. */
export interface DataClient {
  user: {
    findFirst(args: {
      orderBy: { createdAt: 'asc' | 'desc' };
    }): Promise<User | null>;
  };
  team: {
    findMany(args: { orderBy?: { name: 'asc' | 'desc' } }): Promise<Team[]>;
    findUnique(args: { where: { id: string } }): Promise<Team | null>;
  };
  player: {
    findMany(
      args: Prisma.PlayerFindManyArgs
    ): Promise<PlayerWithTeam[] | Player[]>;
    findUnique(
      args: Prisma.PlayerFindUniqueArgs
    ): Promise<PlayerWithTeam | Player | null>;
  };
  game: {
    findMany(
      args: Prisma.GameFindManyArgs
    ): Promise<GameWithTeams[] | Game[]>;
    findUnique(
      args: Prisma.GameFindUniqueArgs
    ): Promise<GameWithTeams | Game | null>;
  };
  playerGameStat: {
    findMany(
      args: Prisma.PlayerGameStatFindManyArgs
    ): Promise<
      PlayerGameStatWithGame[] | PlayerGameStatWithPlayer[] | PlayerGameStat[]
    >;
  };
  injuryReport: {
    findMany(args: Prisma.InjuryReportFindManyArgs): Promise<InjuryReport[]>;
  };
  lineupReport: {
    findMany(args: Prisma.LineupReportFindManyArgs): Promise<LineupReport[]>;
  };
  propLine: {
    findMany(args: Prisma.PropLineFindManyArgs): Promise<PropLine[]>;
  };
}

export function createPrismaDataClient(prisma: PrismaClient): DataClient {
  return {
    user: prisma.user,
    team: prisma.team,
    player: prisma.player,
    game: prisma.game,
    playerGameStat: prisma.playerGameStat,
    injuryReport: prisma.injuryReport,
    lineupReport: prisma.lineupReport,
    propLine: prisma.propLine,
  } as unknown as DataClient;
}
