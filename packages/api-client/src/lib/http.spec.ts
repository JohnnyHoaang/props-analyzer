import { ApiClientError, apiFetch } from './http.js';

function mockFetchOnce(response: {
  ok: boolean;
  status: number;
  body: unknown;
}) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: () => Promise.resolve(response.body),
  });

  (globalThis as { fetch: typeof fetch }).fetch = fetchMock as never;

  return fetchMock;
}

describe('apiFetch', () => {
  it('returns the parsed JSON body on a 2xx response', async () => {
    mockFetchOnce({ ok: true, status: 200, body: { hello: 'world' } });

    const result = await apiFetch<{ hello: string }>('/health', {
      baseUrl: 'http://api.test',
    });

    expect(result).toEqual({ hello: 'world' });
  });

  it('requests the given path under the /api global prefix', async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, body: {} });

    await apiFetch('/players/abc', { baseUrl: 'http://api.test' });

    const [requestedUrl] = fetchMock.mock.calls[0] as [URL];
    expect(requestedUrl.toString()).toBe('http://api.test/api/players/abc');
  });

  it('serializes query params, dropping undefined/null entries', async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, body: [] });

    await apiFetch('/players', {
      baseUrl: 'http://api.test',
      query: { teamId: 'team-1', active: true, position: undefined },
    });

    const [requestedUrl] = fetchMock.mock.calls[0] as [URL];
    expect(requestedUrl.search).toBe('?teamId=team-1&active=true');
  });

  it('throws an ApiClientError with the response status and body on failure', async () => {
    mockFetchOnce({
      ok: false,
      status: 404,
      body: { message: 'Player not found' },
    });

    await expect(
      apiFetch('/players/missing', { baseUrl: 'http://api.test' })
    ).rejects.toMatchObject(
      new ApiClientError('Player not found', 404, {
        message: 'Player not found',
      })
    );
  });

  it('falls back to a generic message when the error body has no message field', async () => {
    mockFetchOnce({ ok: false, status: 500, body: undefined });

    await expect(
      apiFetch('/players', { baseUrl: 'http://api.test' })
    ).rejects.toThrow(/failed with 500/);
  });
});
