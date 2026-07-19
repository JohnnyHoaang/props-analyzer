import { getPlayer, getPlayerGameLog, listPlayers } from './players.js';

function mockFetchOnce(body: unknown) {
  const fetchMock = jest
    .fn()
    .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(body) });

  (globalThis as { fetch: typeof fetch }).fetch = fetchMock as never;

  return fetchMock;
}

describe('players api-client', () => {
  it('lists players with only the provided filters', async () => {
    const fetchMock = mockFetchOnce([]);

    await listPlayers({
      baseUrl: 'http://api.test',
      teamId: 'team-1',
      position: 'PG',
    });

    const [requestedUrl] = fetchMock.mock.calls[0] as [URL];
    expect(requestedUrl.pathname).toBe('/api/players');
    expect(requestedUrl.searchParams.get('teamId')).toBe('team-1');
    expect(requestedUrl.searchParams.get('position')).toBe('PG');
    expect(requestedUrl.searchParams.has('active')).toBe(false);
    expect(requestedUrl.searchParams.has('cursor')).toBe(false);
  });

  it('fetches a single player by id', async () => {
    const fetchMock = mockFetchOnce({ id: 'p1' });

    await getPlayer('p1', { baseUrl: 'http://api.test' });

    const [requestedUrl] = fetchMock.mock.calls[0] as [URL];
    expect(requestedUrl.pathname).toBe('/api/players/p1');
  });

  it("fetches a player's game log with a limit", async () => {
    const fetchMock = mockFetchOnce([]);

    await getPlayerGameLog('p1', { baseUrl: 'http://api.test', limit: 5 });

    const [requestedUrl] = fetchMock.mock.calls[0] as [URL];
    expect(requestedUrl.pathname).toBe('/api/players/p1/game-log');
    expect(requestedUrl.searchParams.get('limit')).toBe('5');
  });
});
