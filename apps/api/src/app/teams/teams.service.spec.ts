import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { REPOSITORIES } from '../database/repositories.token.js';
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

  const repos = {
    team: {
      list: jest.fn(),
      findById: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [TeamsService, { provide: REPOSITORIES, useValue: repos }],
    }).compile();

    service = moduleRef.get(TeamsService);
  });

  describe('findAll', () => {
    it('maps teams to TeamDto', async () => {
      repos.team.list.mockResolvedValue([mockTeam]);

      const result = await service.findAll();

      expect(repos.team.list).toHaveBeenCalled();
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
      repos.team.findById.mockResolvedValue(mockTeam);

      const result = await service.findById('team-cascade');

      expect(result.id).toBe('team-cascade');
    });

    it('throws NotFoundException when the team does not exist', async () => {
      repos.team.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
