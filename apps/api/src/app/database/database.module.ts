import { Global, Module } from '@nestjs/common';
import { loadEnv } from '@props-analyzer/configuration';
import {
  createMockDataClient,
  createMockRepositories,
  createPrismaDataClient,
  createSupabaseRepositories,
  loadMockDataFile,
  type DataClient,
  type Repositories,
} from '@props-analyzer/database';
import { SupabaseService } from '../supabase/supabase.service.js';
import { DATA_CLIENT } from './data-client.token.js';
import { REPOSITORIES } from './repositories.token.js';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: DATA_CLIENT,
      useFactory: (prisma: PrismaService): DataClient => {
        const { DATA_SOURCE, MOCK_DATA_PATH } = loadEnv(process.env, [
          'DATA_SOURCE',
          'MOCK_DATA_PATH',
        ]);

        if (DATA_SOURCE === 'mock') {
          const data = loadMockDataFile(MOCK_DATA_PATH);
          return createMockDataClient(data);
        }

        return createPrismaDataClient(prisma.client);
      },
      inject: [PrismaService],
    },
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

        // 'supabase' (and, transitionally, 'postgres') read through Supabase.
        return createSupabaseRepositories(supabase.admin);
      },
      inject: [SupabaseService],
    },
  ],
  exports: [DATA_CLIENT, REPOSITORIES],
})
export class DatabaseModule {}
