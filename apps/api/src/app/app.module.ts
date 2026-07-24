import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { GamesModule } from './games/games.module.js';
import { HealthModule } from './health/health.module.js';
import { PlayersModule } from './players/players.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { TeamsModule } from './teams/teams.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    SupabaseModule,
    DatabaseModule,
    HealthModule,
    UsersModule,
    TeamsModule,
    PlayersModule,
    GamesModule,
  ],
})
export class AppModule {}
