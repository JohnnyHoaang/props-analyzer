import { Global, Module } from '@nestjs/common';
import { loadEnv } from '@props-analyzer/configuration';
import {
  createMockRepositories,
  createSupabaseRepositories,
  loadMockDataFile,
  type Repositories,
} from '@props-analyzer/database';
import { SupabaseService } from '../supabase/supabase.service.js';
import { REPOSITORIES } from './repositories.token.js';

@Global()
@Module({
  providers: [
    {
      provide: REPOSITORIES,
      useFactory: (supabase: SupabaseService): Repositories => {
        const { DATA_SOURCE, MOCK_DATA_PATH } = loadEnv(process.env, [
          'DATA_SOURCE',
          'MOCK_DATA_PATH',
        ]);

        if (DATA_SOURCE === 'mock') {
          return createMockRepositories(loadMockDataFile(MOCK_DATA_PATH));
        }

        // 'supabase' reads through the service-role client. (Prisma/postgres
        // is retired in Phase 5; any non-mock source now routes to Supabase.)
        return createSupabaseRepositories(supabase.admin);
      },
      inject: [SupabaseService],
    },
  ],
  exports: [REPOSITORIES],
})
export class DatabaseModule {}
