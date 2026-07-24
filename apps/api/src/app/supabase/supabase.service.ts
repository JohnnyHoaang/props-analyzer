import { Injectable } from '@nestjs/common';
import { createAdminClient, type AdminClient } from '@props-analyzer/database/supabase';

/**
 * Singleton service-role Supabase client for server-side, RLS-bypassing
 * access (catalog reads, ingestion). Constructed lazily on first `admin`
 * access — like PrismaService, the API can boot without SUPABASE_* creds;
 * only code that actually touches Supabase requires them.
 *
 * Delegates to the database package's `createAdminClient`, which validates
 * env, provides the `Database`-typed client, and polyfills WebSocket for
 * Node < 22.
 */
@Injectable()
export class SupabaseService {
  private cached: AdminClient | null = null;

  get admin(): AdminClient {
    if (!this.cached) {
      this.cached = createAdminClient();
    }
    return this.cached;
  }
}
