import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { prisma, type PrismaClient } from '@props-analyzer/database';

/**
 * Thin NestJS wrapper around the shared Prisma singleton from
 * packages/database, so feature services can depend on an injectable,
 * mockable class instead of importing the raw client directly.
 *
 * Deliberately does *not* eagerly `$connect()` in `onModuleInit`: Prisma
 * connects lazily on the first query, so the API can still boot and serve
 * `/api/health` even if Postgres isn't reachable yet (e.g. the
 * docker-compose container is still starting) — only DB-backed routes fail
 * until the database comes up.
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client: PrismaClient = prisma;

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
