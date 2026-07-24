import { createAdminClient } from '@supabase/server/core';
import { SupabaseService } from './supabase.service.js';

// The real createAdminClient builds a full supabase-js client (RealtimeClient
// needs a native WebSocket / Node 22+). This unit test exercises
// SupabaseService's own logic — lazy construction, env validation, and
// memoization — so we stub the client factory.
jest.mock('@supabase/server/core', () => ({
  createAdminClient: jest.fn(() => ({ from: jest.fn() })),
}));

const createAdminClientMock = createAdminClient as jest.Mock;

describe('SupabaseService', () => {
  const OLD = process.env;
  beforeEach(() => {
    process.env = { ...OLD };
    createAdminClientMock.mockClear();
    createAdminClientMock.mockReturnValue({ from: jest.fn() });
  });
  afterAll(() => {
    process.env = OLD;
  });

  it('does not construct a client until admin is accessed', () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    // eslint-disable-next-line no-new -- constructing alone must not throw
    expect(() => new SupabaseService()).not.toThrow();
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it('throws a readable error when SUPABASE_URL is missing on access', () => {
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_x';
    const service = new SupabaseService();
    expect(() => service.admin).toThrow(/SUPABASE_URL/);
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it('returns a client exposing from() when env is present', () => {
    process.env.SUPABASE_URL = 'https://abc.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_x';
    const service = new SupabaseService();
    expect(typeof service.admin.from).toBe('function');
  });

  it('memoizes the client — createAdminClient is called once', () => {
    process.env.SUPABASE_URL = 'https://abc.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_x';
    const service = new SupabaseService();
    expect(service.admin).toBe(service.admin);
    expect(createAdminClientMock).toHaveBeenCalledTimes(1);
  });
});
