import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ListPlayersQuery,
  PlayerGameLogQuery,
} from '@props-analyzer/validation';
import type {
  PlayerGameLogEntryDto,
  PropLineDto,
  PlayerWithTeamDto,
} from '@props-analyzer/shared-types';
import { PROP_STAT_TYPES } from '@props-analyzer/shared-types';
import type { DataClient, Game, Player, PlayerGameStat, Prisma, PropLine, Team } from '@props-analyzer/database';
import { DATA_CLIENT } from '../database/data-client.token.js';
import {
  toPlayerGameLogEntryDto,
  toPlayerWithTeamDto,
  toPropLineDto,
  type PropGameContext,
} from './players.mapper.js';

@Injectable()
export class PlayersService {
  constructor(@Inject(DATA_CLIENT) private readonly db: DataClient) {}

  async findAll(query: ListPlayersQuery): Promise<PlayerWithTeamDto[]> {
    const where: Prisma.PlayerWhereInput = {
      ...(query.teamId ? { teamId: query.teamId } : {}),
      ...(query.position ? { position: query.position } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
    };

    const players = (await this.db.player.findMany({
      where,
      include: { team: true },
      orderBy: { fullName: 'asc' },
      take: query.limit,
      ...(query.cursor
        ? { cursor: { id: query.cursor }, skip: 1 }
        : {}),
    })) as Array<Player & { team: Team }>;

    return players.map(toPlayerWithTeamDto);
  }

  async findById(id: string): Promise<PlayerWithTeamDto> {
    const player = (await this.db.player.findUnique({
      where: { id },
      include: { team: true },
    })) as (Player & { team: Team }) | null;

    if (!player) {
      throw new NotFoundException(`Player ${id} not found`);
    }

    return toPlayerWithTeamDto(player);
  }

  async findGameLog(
    playerId: string,
    query: PlayerGameLogQuery
  ): Promise<PlayerGameLogEntryDto[]> {
    const player = await this.db.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    const stats = (await this.db.playerGameStat.findMany({
      where: { playerId },
      include: { game: true },
      orderBy: { game: { date: 'desc' } },
      take: query.limit,
    })) as Array<PlayerGameStat & { game: Game }>;

    return stats.map((stat) => toPlayerGameLogEntryDto(stat, player.teamId));
  }

  /**
   * Every prop market for a player, each with its full per-game series
   * (chronological). The series is derived from the box scores here rather
   * than stored, so it always reflects the latest games; only the line/odds/
   * projection come from the stored PropLine rows.
   */
  async findProps(playerId: string): Promise<PropLineDto[]> {
    const player = await this.db.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    const [propLines, stats, teams] = await Promise.all([
      this.db.propLine.findMany({ where: { playerId } }) as Promise<PropLine[]>,
      this.db.playerGameStat.findMany({
        where: { playerId },
        include: { game: true },
        orderBy: { game: { date: 'asc' } },
      }) as Promise<Array<PlayerGameStat & { game: Game }>>,
      this.db.team.findMany({}) as Promise<Team[]>,
    ]);

    const abbreviationByTeamId = new Map(
      teams.map((team) => [team.id, team.abbreviation])
    );

    const games: PropGameContext[] = stats.map((stat) => {
      const isHome = stat.game.homeTeamId === player.teamId;
      const opponentTeamId = isHome
        ? stat.game.awayTeamId
        : stat.game.homeTeamId;

      return {
        gameId: stat.game.id,
        date: stat.game.date.toISOString(),
        opponentAbbreviation:
          abbreviationByTeamId.get(opponentTeamId) ?? opponentTeamId,
        isHome,
        stat,
      };
    });

    return propLines
      .map((propLine) => toPropLineDto(propLine, games))
      .sort(
        (a, b) =>
          PROP_STAT_TYPES.indexOf(a.statType) -
          PROP_STAT_TYPES.indexOf(b.statType)
      );
  }
}
