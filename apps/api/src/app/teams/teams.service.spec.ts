import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DATA_CLIENT } from '../database/data-client.token.js';
import { TeamsService } from './teams.service.js';

describe('TeamsService', () => {
  let service: TeamsService;
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

  const dbMock = {
    team: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [TeamsService, { provide: DATA_CLIENT, useValue: dbMock }],
    }).compile();

    service = moduleRef.get(TeamsService);
  });

  describe('findAll', () => {
    it('maps Prisma teams to TeamDto, sorted by name', async () => {
      dbMock.team.findMany.mockResolvedValue([mockTeam]);

      const result = await service.findAll();

      expect(dbMock.team.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([
        {
          id: 'team-cascade',
          name: 'Cascade Ironhawks',
          abbreviation: 'CAS',
          conference: 'WESTERN',
          division: 'Pacific',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ]);
    });
  });

  describe('findById', () => {
    it('returns the mapped team when found', async () => {
      dbMock.team.findUnique.mockResolvedValue(mockTeam);

      const result = await service.findById('team-cascade');

      expect(result.id).toBe('team-cascade');
    });

    it('throws NotFoundException when the team does not exist', async () => {
      dbMock.team.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
