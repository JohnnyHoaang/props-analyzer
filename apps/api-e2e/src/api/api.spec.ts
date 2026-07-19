import axios from 'axios';

// These specs hit a running `apps/api` instance backed by the seeded mock
// data (see packages/database/src/mock-data). Locally: `docker-compose up -d`,
// `pnpm db:migrate:deploy`, `pnpm db:seed`, then `nx e2e api-e2e`.

describe('GET /api/health', () => {
  it('reports ok without requiring any request body', async () => {
    const res = await axios.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({ status: 'ok' });
    expect(typeof res.data.timestamp).toBe('string');
  });
});

describe('GET /api/teams', () => {
  it('lists the seeded teams', async () => {
    const res = await axios.get('/api/teams');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      abbreviation: expect.any(String),
    });
  });
});

describe('GET /api/players', () => {
  it('lists seeded players and supports fetching one by id', async () => {
    const listRes = await axios.get('/api/players');

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.data)).toBe(true);
    expect(listRes.data.length).toBeGreaterThan(0);

    const [player] = listRes.data;
    expect(player).toMatchObject({
      id: expect.any(String),
      fullName: expect.any(String),
      position: expect.any(String),
    });

    const detailRes = await axios.get(`/api/players/${player.id}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.data.id).toBe(player.id);
  });

  it('returns a game log for a seeded player', async () => {
    const { data: players } = await axios.get('/api/players');
    const [player] = players;

    const res = await axios.get(`/api/players/${player.id}/game-log`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});

describe('GET /api/games', () => {
  it('lists seeded games and supports fetching one by id', async () => {
    const listRes = await axios.get('/api/games');

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.data)).toBe(true);
    expect(listRes.data.length).toBeGreaterThan(0);

    const [game] = listRes.data;
    expect(game).toMatchObject({
      id: expect.any(String),
      status: expect.any(String),
    });

    const detailRes = await axios.get(`/api/games/${game.id}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.data.id).toBe(game.id);
  });

  it('returns the box score for a seeded game', async () => {
    const { data: games } = await axios.get('/api/games');
    const [game] = games;

    const res = await axios.get(`/api/games/${game.id}/players`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});

describe('GET /api/users/me', () => {
  it('returns the stubbed current user', async () => {
    const res = await axios.get('/api/users/me');

    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      id: expect.any(String),
      email: expect.any(String),
      name: expect.any(String),
    });
  });
});
