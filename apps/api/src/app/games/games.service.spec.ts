import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DATA_CLIENT } from '../database/data-client.token.js';
import { GamesService } from './games.service.js';

describe('GamesService', () => {
  let service: GamesService;
  const now = new Date('2025-11-01T00:00:00.000Z');

  const mockTeam = (id: string, abbreviation: string) => ({
    id,
    name: `${abbreviation} Team`,
    abbreviation,
    conference: 'WESTERN' as const,
    division: 'Pacific',
    createdAt: now,
    updatedAt: now,
  });

  const mockGame = {
    id: 'game-001',
    seasonId: 'season-2025-26',
    date: now,
    status: 'FINAL' as const,
    gameType: 'REGULAR_SEASON' as const,
    homeTeamId: 'team-cascade',
    awayTeamId: 'team-meridian',
    homeScore: 108,
    awayScore: 101,
    overtimePeriods: 0,
    createdAt: now,
    updatedAt: now,
    homeTeam: mockTeam('team-cascade', 'CAS'),
    awayTeam: mockTeam('team-meridian', 'MER'),
  };

  const dbMock = {
    game: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    playerGameStat: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [GamesService, { provide: DATA_CLIENT, useValue: dbMock }],
    }).compile();

    service = moduleRef.get(GamesService);
  });

  describe('findAll', () => {
    it('filters by either home or away team when teamId is given', async () => {
      dbMock.game.findMany.mockResolvedValue([mockGame]);

      await service.findAll({ limit: 50, teamId: 'team-cascade' });

      expect(dbMock.game.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ homeTeamId: 'team-cascade' }, { awayTeamId: 'team-cascade' }],
          },
        })
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      dbMock.game.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException
      );
    });

    it('maps a found game with its teams', async () => {
      dbMock.game.findUnique.mockResolvedValue(mockGame);

      const result = await service.findById('game-001');

      expect(result.homeTeam.abbreviation).toBe('CAS');
      expect(result.awayTeam.abbreviation).toBe('MER');
    });
  });

  describe('findBoxScore', () => {
    it('throws NotFoundException for an unknown game', async () => {
      dbMock.game.findUnique.mockResolvedValue(null);

      await expect(service.findBoxScore('missing')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
