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

  it('throws a readable error when a required key is missing', () => {
    expect(() => loadEnv({}, ['DATABASE_URL'])).toThrow(
      /DATABASE_URL/
    );
  });
});
