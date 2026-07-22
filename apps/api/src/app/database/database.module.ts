import { Global, Module } from '@nestjs/common';
import { loadEnv } from '@props-analyzer/configuration';
import {
  createMockDataClient,
  createPrismaDataClient,
  loadMockDataFile,
  type DataClient,
} from '@props-analyzer/database';
import { DATA_CLIENT } from './data-client.token.js';
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
  ],
  exports: [DATA_CLIENT],
})
export class DatabaseModule {}
