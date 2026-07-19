import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const now = new Date('2025-11-01T00:00:00.000Z');

  const prismaMock = {
    client: { user: { findFirst: jest.fn() } },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('returns the mapped stub user', async () => {
    prismaMock.client.user.findFirst.mockResolvedValue({
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

  it('throws NotFoundException when the database has not been seeded', async () => {
    prismaMock.client.user.findFirst.mockResolvedValue(null);

    await expect(service.getCurrentUser()).rejects.toThrow(NotFoundException);
  });
});
