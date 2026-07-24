import { WebSocket as WsWebSocket } from 'ws';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

// supabase-js constructs a RealtimeClient that needs a global `WebSocket`,
// which Node < 22 lacks. We never use realtime here, but the constructor still
// looks one up, so provide `ws` as a polyfill. Harmless on Node 22+ (the
// native global is already present and left untouched).
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WsWebSocket as unknown as typeof globalThis.WebSocket;
}

/** Service-role Supabase client (bypasses RLS) for server-side scripts. */
export type AdminClient = SupabaseClient<Database>;

/**
 * Builds a service-role Supabase client from `SUPABASE_URL` +
 * `SUPABASE_SECRET_KEY`. Used by ingestion/seed scripts, which write over the
 * REST API and therefore need only the secret key (no direct DB password).
 */
export function createAdminClient(): AdminClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SECRET_KEY are required to create the admin ' +
        'Supabase client.'
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
