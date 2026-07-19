const DEFAULT_BASE_URL = 'http://localhost:3333';

/**
 * Raised for any non-2xx response from the API. Carries the parsed error
 * body (when the API returned JSON, e.g. Nest's `{ message, issues? }`
 * shape from `ZodValidationPipe`) so callers can render something more
 * useful than "request failed".
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/** Drops `undefined`/`null` entries so optional filters don't end up as the literal string "undefined" in the query string. */
function toSearchParams(
  query: Record<string, string | number | boolean | undefined | null>
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }

  return params;
}

export interface ApiRequestOptions {
  /**
   * Overrides `NEXT_PUBLIC_API_URL` (e.g. for server-side requests inside
   * `apps/web` that need to reach the API over a different, internal
   * origin than what's exposed to the browser).
   */
  baseUrl?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

/**
 * Thin `fetch` wrapper shared by every resource module in this package.
 * Always targets the Nest API's `/api` global prefix and always expects
 * (and parses) a JSON body — every Phase 1 endpoint returns one.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const baseUrl =
    options.baseUrl ??
    (typeof process !== 'undefined'
      ? process.env['NEXT_PUBLIC_API_URL']
      : undefined) ??
    DEFAULT_BASE_URL;

  const url = new URL(`/api${path}`, baseUrl);

  if (options.query) {
    url.search = toSearchParams(options.query).toString();
  }

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: options.signal,
  });

  const body = await response
    .json()
    .catch(() => undefined);

  if (!response.ok) {
    const message =
      (body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : undefined) ?? `Request to ${url.pathname} failed with ${response.status}`;

    throw new ApiClientError(message, response.status, body);
  }

  return body as T;
}
