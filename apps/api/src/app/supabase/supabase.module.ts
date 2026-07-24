import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service.js';

/**
 * Provides the singleton service-role Supabase client. Global so later
 * phases can inject SupabaseService without re-importing. Phase 1 does not
 * add this to AppModule — it stays dormant until a consumer needs it.
 */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
