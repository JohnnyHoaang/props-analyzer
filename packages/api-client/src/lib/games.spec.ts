import { getGame, getGameBoxScore, listGames } from './games.js';

function mockFetchOnce(body: unknown) {
  const fetchMock = jest
    .fn()
    .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(body) });

  (globalThis as { fetch: typeof fetch }).fetch = fetchMock as never;

  return fetchMock;
}

describe('games api-client', () => {
  it('lists games with only the provided filters', async () => {
    const fetchMock = mockFetchOnce([]);

    await listGames({ baseUrl: 'http://api.test', status: 'FINAL' });

    const [requestedUrl] = fetchMock.mock.calls[0] as [URL];
    expect(requestedUrl.pathname).toBe('/api/games');
    expect(requestedUrl.searchParams.get('status')).toBe('FINAL');
    expect(requestedUrl.searchParams.has('teamId')).toBe(false);
  });

  it('fetches a single game by id', async () => {
    const fetchMock = mockFetchOnce({ id: 'g1' });

    await getGame('g1', { baseUrl: 'http://api.test' });

    const [requestedUrl] = fetchMock.mock.calls[0] as [URL];
    expect(requestedUrl.pathname).toBe('/api/games/g1');
  });

  it('fetches a box score for a game', async () => {
    const fetchMock = mockFetchOnce([]);

    await getGameBoxScore('g1', { baseUrl: 'http://api.test' });

    const [requestedUrl] = fetchMock.mock.calls[0] as [URL];
    expect(requestedUrl.pathname).toBe('/api/games/g1/players');
  });
});
