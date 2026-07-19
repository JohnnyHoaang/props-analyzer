import { Injectable, NotFoundException } from '@nestjs/common';
import type { UserDto } from '@props-analyzer/shared-types';
import { PrismaService } from '../database/prisma.service.js';
import { toUserDto } from './users.mapper.js';

/**
 * Authentication is deferred in Phase 1 (see AGENTS.md workflow notes /
 * PLAN.md decision log) — there is no session or login flow. This service
 * always returns the single seeded stub user so the rest of the app has a
 * stable `userId` to build against ahead of a real auth provider.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentUser(): Promise<UserDto> {
    const user = await this.prisma.client.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!user) {
      throw new NotFoundException(
        'No stub user found — has the database been seeded? (pnpm --filter database db:seed)'
      );
    }

    return toUserDto(user);
  }
}
