/**
 * balldontlie (BDL) NBA API adapter. This is the only place that talks HTTP to
 * the provider; everything downstream consumes the typed objects returned here
 * and converts them to internal DTOs via `map.ts` (see the AGENTS.md provider
 * flow: Provider → Adapter → Internal DTO → Database).
 *
 * Uses the global `fetch` (Node 18+) so no HTTP dependency is added.
 */

const BASE_URL = 'https://api.balldontlie.io/nba/v1';
const PLAYERS_PER_PAGE = 100;

/**
 * Delay between paginated requests. The provider allows 600 requests/minute
 * (one every 100ms); 150ms keeps a comfortable margin. Loading teams + active
 * players is only ~7 requests total, so this never meaningfully slows a run.
 */
export const RATE_LIMIT_DELAY_MS = 150;

export interface BdlTeam {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

export interface BdlPlayer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  // BDL returns null (not "") for missing biographical fields.
  position: string | null;
  height: string | null;
  weight: string | null;
  team: BdlTeam;
}

/** A single game from `GET /games`. Only the fields the importer maps. */
export interface BdlGame {
  id: number;
  date: string; // "YYYY-MM-DD"
  season: number; // starting year, e.g. 2025 for the 2025-26 season
  status: string; // "Final" for completed games
  period: number; // 4 in regulation; >4 indicates overtime
  postseason: boolean;
  home_team_score: number;
  visitor_team_score: number;
  home_team: { id: number };
  visitor_team: { id: number };
}

/** A single player-game box score from `GET /stats`. `min` is a string. */
export interface BdlStat {
  id: number;
  min: string | null;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  pf: number;
  pts: number;
  plus_minus: number | null;
  player: { id: number };
  team: { id: number };
  game: { id: number };
}

interface BdlListMeta {
  next_cursor?: number | null;
  per_page: number;
}

interface BdlListResponse<T> {
  data: T[];
  meta: BdlListMeta;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function apiKey(): string {
  const key = process.env.BDL_API_KEY;
  if (!key) {
    throw new Error('BDL_API_KEY is not set — cannot call the balldontlie API.');
  }
  return key;
}

/** How many times to retry a 429 before giving up. */
const MAX_RETRIES = 8;
/** Cap on a single backoff wait, so a bogus Retry-After can't stall forever. */
const MAX_BACKOFF_MS = 60_000;

/**
 * Backoff for a rate-limited (429) request: honor the `Retry-After` header when
 * present, otherwise exponential from the base delay (~1.2s, 2.4s, 4.8s, …),
 * capped at MAX_BACKOFF_MS. This rides out the provider's per-minute window
 * instead of failing the whole import on a single 429.
 */
function backoffMs(attempt: number, retryAfter: string | null): number {
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(seconds * 1000, MAX_BACKOFF_MS);
  }
  return Math.min(RATE_LIMIT_DELAY_MS * 2 ** (attempt + 3), MAX_BACKOFF_MS);
}

/**
 * GET a BDL path, retrying HTTP 429 with backoff (up to MAX_RETRIES). Throws on
 * any other non-2xx response with a snippet of the body for easier debugging.
 */
async function getJson<T>(path: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: apiKey() },
    });

    if (response.ok) {
      return (await response.json()) as T;
    }

    if (response.status === 429 && attempt < MAX_RETRIES) {
      await sleep(backoffMs(attempt, response.headers.get('retry-after')));
      continue;
    }

    const body = (await response.text()).slice(0, 300);
    throw new Error(
      `BDL request failed: GET ${path} → ${response.status} ${response.statusText}. ${body}`
    );
  }
}

export async function fetchTeams(): Promise<BdlTeam[]> {
  const { data } = await getJson<BdlListResponse<BdlTeam>>('/teams');
  return data;
}

/**
 * Fetches every active player across BDL's cursor-based pagination, pausing
 * `RATE_LIMIT_DELAY_MS` between pages.
 */
export async function fetchActivePlayers(): Promise<BdlPlayer[]> {
  const players: BdlPlayer[] = [];
  let cursor: number | null | undefined;

  do {
    const query = new URLSearchParams({ per_page: String(PLAYERS_PER_PAGE) });
    if (cursor != null) {
      query.set('cursor', String(cursor));
    }

    const { data, meta } = await getJson<BdlListResponse<BdlPlayer>>(
      `/players/active?${query.toString()}`
    );
    players.push(...data);
    cursor = meta.next_cursor;

    if (cursor != null) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  } while (cursor != null);

  return players;
}

/**
 * Walks BDL's cursor pagination for `path`, appending `cursor`/`per_page` to the
 * caller-provided params and pausing `RATE_LIMIT_DELAY_MS` between pages. The
 * base query (seasons, player filters, etc.) lives in `params`.
 */
async function fetchAllPages<T>(
  path: string,
  params: URLSearchParams
): Promise<T[]> {
  const items: T[] = [];
  let cursor: number | null | undefined;

  do {
    const query = new URLSearchParams(params);
    query.set('per_page', String(PLAYERS_PER_PAGE));
    if (cursor != null) {
      query.set('cursor', String(cursor));
    }

    const { data, meta } = await getJson<BdlListResponse<T>>(
      `${path}?${query.toString()}`
    );
    items.push(...data);
    cursor = meta.next_cursor;

    if (cursor != null) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  } while (cursor != null);

  return items;
}

function seasonsParams(seasons: number[]): URLSearchParams {
  const params = new URLSearchParams();
  for (const season of seasons) {
    params.append('seasons[]', String(season));
  }
  return params;
}

/** Every game across the given seasons (regular season and playoffs). */
export function fetchGames(seasons: number[]): Promise<BdlGame[]> {
  return fetchAllPages<BdlGame>('/games', seasonsParams(seasons));
}

/** Every box score for one player across the given seasons. */
export function fetchPlayerStats(
  playerId: number,
  seasons: number[]
): Promise<BdlStat[]> {
  const params = seasonsParams(seasons);
  params.append('player_ids[]', String(playerId));
  return fetchAllPages<BdlStat>('/stats', params);
}
