import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { REPOSITORIES } from '../database/repositories.token.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const now = new Date('2025-11-01T00:00:00.000Z');

  const repos = {
    user: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: REPOSITORIES, useValue: repos }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('returns the mapped stub user', async () => {
    repos.user.findFirst.mockResolvedValue({
      id: 'user-stub-1',
      email: 'demo@props-analyzer.local',
      name: 'Demo User',
      createdAt: now,
      updatedAt: now,
    });

    const result = await service.getCurrentUser();

    expect(result).toEqual({
      id: 'user-stub-1',
      email: 'demo@props-analyzer.local',
      name: 'Demo User',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it('throws NotFoundException when no stub user is available', async () => {
    repos.user.findFirst.mockResolvedValue(null);

    await expect(service.getCurrentUser()).rejects.toThrow(NotFoundException);
  });
});
