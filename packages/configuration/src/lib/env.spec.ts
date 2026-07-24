import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('parses a valid environment subset', () => {
    const env = loadEnv(
      {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        API_PORT: '3333',
      },
      ['DATABASE_URL', 'API_PORT']
    );

    expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
    expect(env.API_PORT).toBe(3333);
  });

  it('applies defaults for optional keys', () => {
    const env = loadEnv({}, ['API_PORT']);

    expect(env.API_PORT).toBe(3333);
  });

  it('throws a readable error when postgres mode lacks DATABASE_URL', () => {
    expect(() =>
      loadEnv({ DATA_SOURCE: 'postgres' }, ['DATA_SOURCE', 'DATABASE_URL'])
    ).toThrow(/DATABASE_URL/);
  });

  it('defaults DATA_SOURCE to mock so DATABASE_URL is optional', () => {
    const env = loadEnv({}, ['DATA_SOURCE', 'API_PORT']);

    expect(env.DATA_SOURCE).toBe('mock');
    expect(env.API_PORT).toBe(3333);
  });

  it('parses the SUPABASE_* subset', () => {
    const env = loadEnv(
      {
        SUPABASE_URL: 'https://abc.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
        SUPABASE_SECRET_KEY: 'sb_secret_x',
        SUPABASE_JWKS_URL: 'https://abc.supabase.co/auth/v1/.well-known/jwks.json',
      },
      [
        'SUPABASE_URL',
        'SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_SECRET_KEY',
        'SUPABASE_JWKS_URL',
      ]
    );

    expect(env.SUPABASE_URL).toBe('https://abc.supabase.co');
    expect(env.SUPABASE_SECRET_KEY).toBe('sb_secret_x');
  });

  it('rejects a malformed SUPABASE_URL', () => {
    expect(() => loadEnv({ SUPABASE_URL: 'not-a-url' }, ['SUPABASE_URL'])).toThrow(
      /SUPABASE_URL/
    );
  });

  it('allows SUPABASE_* to be absent (optional)', () => {
    const env = loadEnv({}, ['SUPABASE_URL', 'API_PORT']);
    expect(env.SUPABASE_URL).toBeUndefined();
    expect(env.API_PORT).toBe(3333);
  });
});
