import { Injectable } from '@nestjs/common';
import { loadEnv } from '@props-analyzer/configuration';
import { createAdminClient } from '@supabase/server/core';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Singleton service-role Supabase client for server-side, RLS-bypassing
 * access (catalog reads in later phases, ingestion). Constructed lazily on
 * first `admin` access — like PrismaService, the API can boot without
 * SUPABASE_* creds; only code that actually touches Supabase requires them.
 *
 * Phase 1: provided and exported by SupabaseModule but injected nowhere.
 */
@Injectable()
export class SupabaseService {
  private cached: SupabaseClient | null = null;

  get admin(): SupabaseClient {
    if (!this.cached) {
      // loadEnv validates format but treats these as optional (they must be, so
      // unrelated loadEnv calls don't fail) — so assert presence explicitly to
      // fail fast with a readable message rather than deep inside supabase-js.
      const { SUPABASE_URL, SUPABASE_SECRET_KEY } = loadEnv(process.env, [
        'SUPABASE_URL',
        'SUPABASE_SECRET_KEY',
      ]);
      if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
        throw new Error(
          'SUPABASE_URL and SUPABASE_SECRET_KEY are required to create the ' +
            'admin Supabase client.'
        );
      }
      this.cached = createAdminClient();
    }
    return this.cached;
  }
}
