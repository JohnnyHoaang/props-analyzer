import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { PlayersService } from './players.service.js';

describe('PlayersService', () => {
  let service: PlayersService;
  const now = new Date('2025-11-01T00:00:00.000Z');

  const mockTeam = {
    id: 'team-cascade',
    name: 'Cascade Ironhawks',
    abbreviation: 'CAS',
    conference: 'WESTERN' as const,
    division: 'Pacific',
    createdAt: now,
    updatedAt: now,
  };

  const mockPlayer = {
    id: 'player-cascade-1',
    teamId: 'team-cascade',
    fullName: 'Deshawn Ortiz',
    position: 'PG' as const,
    height: 74,
    weight: 190,
    active: true,
    createdAt: now,
    updatedAt: now,
    team: mockTeam,
  };

  const mockGame = {
    id: 'game-001',
    date: now,
    homeTeamId: 'team-cascade',
    awayTeamId: 'team-meridian',
    homeScore: 108,
    awayScore: 101,
  };

  const mockStat = {
    id: 'stat-1',
    playerId: 'player-cascade-1',
    gameId: 'game-001',
    minutes: 32,
    points: 20,
    rebounds: 4,
    assists: 7,
    threePM: 2,
    threePA: 5,
    fgm: 8,
    fga: 15,
    ftm: 2,
    fta: 3,
    steals: 1,
    blocks: 0,
    turnovers: 2,
    fouls: 2,
    plusMinus: 7,
    starter: true,
    createdAt: now,
    updatedAt: now,
    game: mockGame,
  };

  const prismaMock = {
    client: {
      player: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      playerGameStat: {
        findMany: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PlayersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(PlayersService);
  });

  describe('findAll', () => {
    it('builds a Prisma where clause from the query filters', async () => {
      prismaMock.client.player.findMany.mockResolvedValue([mockPlayer]);

      const result = await service.findAll({
        limit: 50,
        teamId: 'team-cascade',
        position: 'PG',
        active: true,
      });

      expect(prismaMock.client.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teamId: 'team-cascade', position: 'PG', active: true },
          take: 50,
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0].team.abbreviation).toBe('CAS');
    });

    it('applies cursor pagination when a cursor is provided', async () => {
      prismaMock.client.player.findMany.mockResolvedValue([]);

      await service.findAll({ limit: 10, cursor: 'player-cascade-1' });

      expect(prismaMock.client.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'player-cascade-1' },
          skip: 1,
        })
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      prismaMock.client.player.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findGameLog', () => {
    it('throws NotFoundException for an unknown player', async () => {
      prismaMock.client.player.findUnique.mockResolvedValue(null);

      await expect(
        service.findGameLog('missing', { limit: 10 })
      ).rejects.toThrow(NotFoundException);
    });

    it('marks games as home/away relative to the player team', async () => {
      prismaMock.client.player.findUnique.mockResolvedValue(mockPlayer);
      prismaMock.client.playerGameStat.findMany.mockResolvedValue([
        mockStat,
      ]);

      const [entry] = await service.findGameLog('player-cascade-1', {
        limit: 10,
      });

      expect(entry.isHome).toBe(true);
      expect(entry.opponentTeamId).toBe('team-meridian');
    });
  });
});
