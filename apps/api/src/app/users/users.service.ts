import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UserDto } from '@props-analyzer/shared-types';
import type { DataClient } from '@props-analyzer/database';
import { DATA_CLIENT } from '../database/data-client.token.js';
import { toUserDto } from './users.mapper.js';

/**
 * Authentication is deferred in Phase 1 (see AGENTS.md workflow notes /
 * PLAN.md decision log) — there is no session or login flow. This service
 * always returns the single stub user so the rest of the app has a
 * stable `userId` to build against ahead of a real auth provider.
 */
@Injectable()
export class UsersService {
  constructor(@Inject(DATA_CLIENT) private readonly db: DataClient) {}

  async getCurrentUser(): Promise<UserDto> {
    const user = await this.db.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!user) {
      throw new NotFoundException(
        'No stub user found — check mock-data.json or run `pnpm db:seed` when using Postgres.'
      );
    }

    return toUserDto(user);
  }
}
