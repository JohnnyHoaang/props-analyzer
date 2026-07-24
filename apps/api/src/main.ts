import path from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { loadEnv } from '@props-analyzer/configuration';
import { config as loadDotenv } from 'dotenv';
import { AppModule } from './app/app.module.js';

async function bootstrap() {
  // The root .env is the single source of truth (see .env.example); load
  // it explicitly since this app doesn't otherwise run from the repo root.
  // This app's build output is CommonJS (see webpack.config.cjs), so
  // `__dirname` is available natively — no need for the ESM
  // `import.meta.url` dance.
  loadDotenv({ path: path.join(__dirname, '..', '..', '..', '.env') });

  const { API_PORT } = loadEnv(process.env, ['API_PORT']);
  // Cloud Run injects `PORT`; fall back to `API_PORT` for local dev.
  const port = process.env.PORT ? Number(process.env.PORT) : API_PORT;

  const app = await NestFactory.create(AppModule);

  // apps/web runs on a different origin in local dev; the frontend only
  // ever talks to this API, never to external providers directly (see
  // AGENTS.md API rules), so a permissive Phase 1 CORS policy is fine.
  app.enableCors();

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Props Analyzer API')
      .setDescription(
        'Phase 1: players, teams, games and completed box scores from mock data.'
      )
      .setVersion('0.1.0')
      .build()
  );
  SwaggerModule.setup(`${globalPrefix}/docs`, app, swaggerDocument);

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📚 Swagger docs available at: http://localhost:${port}/${globalPrefix}/docs`
  );
}

bootstrap();
