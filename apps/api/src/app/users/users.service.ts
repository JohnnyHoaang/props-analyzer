import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UserDto } from '@props-analyzer/shared-types';
import type { Repositories } from '@props-analyzer/database';
import { REPOSITORIES } from '../database/repositories.token.js';
import { toUserDto } from './users.mapper.js';

/**
 * Authentication is deferred in Phase 1 (see AGENTS.md workflow notes /
 * PLAN.md decision log) — there is no session or login flow. This service
 * always returns the single stub user so the rest of the app has a
 * stable `userId` to build against ahead of a real auth provider.
 */
@Injectable()
export class UsersService {
  constructor(@Inject(REPOSITORIES) private readonly repos: Repositories) {}

  async getCurrentUser(): Promise<UserDto> {
    const user = await this.repos.user.findFirst();

    if (!user) {
      throw new NotFoundException(
        'No stub user found — check mock-data.json or run `pnpm db:seed` when using Postgres.'
      );
    }

    return toUserDto(user);
  }
}
