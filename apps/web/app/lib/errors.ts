import { ApiClientError } from '@props-analyzer/api-client';

/**
 * Renders a friendly message for known failure modes (API unreachable, DB
 * not seeded yet, 404s) instead of letting a fetch failure crash the whole
 * page — Phase 1 has no live data, so a missing/empty DB is expected in
 * some environments.
 */
export function describeApiError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 404) {
      return 'Not found.';
    }
    return `${error.message} (status ${error.status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
}
