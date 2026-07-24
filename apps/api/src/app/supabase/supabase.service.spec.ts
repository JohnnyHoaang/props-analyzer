import { createAdminClient } from '@props-analyzer/database/supabase';
import { SupabaseService } from './supabase.service.js';

// createAdminClient builds a real supabase-js client (needs env + a WebSocket
// impl). This unit test covers SupabaseService's own logic — lazy construction
// and memoization — so we stub the factory.
jest.mock('@props-analyzer/database/supabase', () => ({
  createAdminClient: jest.fn(() => ({ from: jest.fn() })),
}));

const createAdminClientMock = createAdminClient as jest.Mock;

describe('SupabaseService', () => {
  beforeEach(() => {
    createAdminClientMock.mockClear();
    createAdminClientMock.mockReturnValue({ from: jest.fn() });
  });

  it('does not construct a client until admin is accessed', () => {
    const service = new SupabaseService();
    expect(service).toBeDefined();
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it('returns a client exposing from() when accessed', () => {
    const service = new SupabaseService();
    expect(typeof service.admin.from).toBe('function');
  });

  it('memoizes the client — createAdminClient is called once', () => {
    const service = new SupabaseService();
    expect(service.admin).toBe(service.admin);
    expect(createAdminClientMock).toHaveBeenCalledTimes(1);
  });
});
