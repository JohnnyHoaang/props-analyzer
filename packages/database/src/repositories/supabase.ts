import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types.js';
import {
  toGameEntity,
  toPlayerEntity,
  toPlayerGameStatEntity,
  toPropLineEntity,
  toTeamEntity,
  toUserEntity,
} from './entities.js';
import type {
  GameListFilter,
  GameWithTeams,
  PlayerGameStatWithGame,
  PlayerGameStatWithPlayer,
  PlayerListFilter,
  PlayerWithTeam,
  Repositories,
} from './types.js';

type Rows = Database['public']['Tables'];
type TeamRow = Rows['teams']['Row'];
type PlayerRow = Rows['players']['Row'];
type GameRow = Rows['games']['Row'];
type StatRow = Rows['player_game_stats']['Row'];

type PlayerRowWithTeam = PlayerRow & { team: TeamRow };
type GameRowWithTeams = GameRow & { homeTeam: TeamRow; awayTeam: TeamRow };
type StatRowWithGame = StatRow & { game: GameRow };
type StatRowWithPlayer = StatRow & { player: PlayerRow };

const GAME_TEAMS_SELECT =
  '*, homeTeam:teams!home_team_id(*), awayTeam:teams!away_team_id(*)';

function fail(message: string): never {
  throw new Error(`Supabase query failed: ${message}`);
}

/**
 * Supabase-backed domain repositories. Every method runs a supabase-js query
 * (via the service-role client) and maps the snake_case rows to the internal
 * entity shapes the API mappers consume. RLS is bypassed by the service-role
 * key; the API enforces its own access rules.
 */
export function createSupabaseRepositories(
  client: SupabaseClient<Database>
): Repositories {
  async function playerFullNameById(id: string): Promise<string | null> {
    const { data, error } = await client
      .from('players')
      .select('full_name')
      .eq('id', id)
      .maybeSingle();
    if (error) fail(error.message);
    return data?.full_name ?? null;
  }

  async function gameDateById(id: string): Promise<string | null> {
    const { data, error } = await client
      .from('games')
      .select('date')
      .eq('id', id)
      .maybeSingle();
    if (error) fail(error.message);
    return data?.date ?? null;
  }

  return {
    team: {
      async list() {
        const { data, error } = await client
          .from('teams')
          .select('*')
          .order('name', { ascending: true });
        if (error) fail(error.message);
        return (data ?? []).map(toTeamEntity);
      },
      async findById(id) {
        const { data, error } = await client
          .from('teams')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) fail(error.message);
        return data ? toTeamEntity(data) : null;
      },
    },

    player: {
      async list(filter: PlayerListFilter) {
        let query = client
          .from('players')
          .select('*, team:teams(*)')
          .order('full_name', { ascending: true });

        if (filter.teamId) query = query.eq('team_id', filter.teamId);
        if (filter.position) query = query.eq('position', filter.position);
        if (filter.active !== undefined) query = query.eq('active', filter.active);
        if (filter.search) query = query.ilike('full_name', `%${filter.search}%`);

        if (filter.cursor !== undefined) {
          const cursorName = await playerFullNameById(filter.cursor);
          if (cursorName !== null) query = query.gt('full_name', cursorName);
          if (filter.limit !== undefined) query = query.limit(filter.limit);
        } else if (filter.limit !== undefined) {
          const from = (filter.page - 1) * filter.limit;
          query = query.range(from, from + filter.limit - 1);
        }

        const { data, error } = await query;
        if (error) fail(error.message);
        return ((data ?? []) as PlayerRowWithTeam[]).map((row) => ({
          ...toPlayerEntity(row),
          team: toTeamEntity(row.team),
        })) as PlayerWithTeam[];
      },
      async findByIdWithTeam(id) {
        const { data, error } = await client
          .from('players')
          .select('*, team:teams(*)')
          .eq('id', id)
          .maybeSingle();
        if (error) fail(error.message);
        if (!data) return null;
        const row = data as PlayerRowWithTeam;
        return { ...toPlayerEntity(row), team: toTeamEntity(row.team) };
      },
      async findById(id) {
        const { data, error } = await client
          .from('players')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) fail(error.message);
        return data ? toPlayerEntity(data) : null;
      },
    },

    game: {
      async list(filter: GameListFilter) {
        let query = client
          .from('games')
          .select(GAME_TEAMS_SELECT)
          .order('date', { ascending: false });

        if (filter.seasonId) query = query.eq('season_id', filter.seasonId);
        if (filter.status) query = query.eq('status', filter.status);
        if (filter.gameType) query = query.eq('game_type', filter.gameType);
        if (filter.teamId) {
          query = query.or(
            `home_team_id.eq.${filter.teamId},away_team_id.eq.${filter.teamId}`
          );
        }
        if (filter.cursor) {
          const cursorDate = await gameDateById(filter.cursor);
          if (cursorDate !== null) query = query.lt('date', cursorDate);
        }
        if (filter.limit !== undefined) query = query.limit(filter.limit);

        const { data, error } = await query;
        if (error) fail(error.message);
        return ((data ?? []) as unknown as GameRowWithTeams[]).map((row) => ({
          ...toGameEntity(row),
          homeTeam: toTeamEntity(row.homeTeam),
          awayTeam: toTeamEntity(row.awayTeam),
        })) as GameWithTeams[];
      },
      async findByIdWithTeams(id) {
        const { data, error } = await client
          .from('games')
          .select(GAME_TEAMS_SELECT)
          .eq('id', id)
          .maybeSingle();
        if (error) fail(error.message);
        if (!data) return null;
        const row = data as unknown as GameRowWithTeams;
        return {
          ...toGameEntity(row),
          homeTeam: toTeamEntity(row.homeTeam),
          awayTeam: toTeamEntity(row.awayTeam),
        };
      },
      async findById(id) {
        const { data, error } = await client
          .from('games')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) fail(error.message);
        return data ? toGameEntity(data) : null;
      },
    },

    playerGameStat: {
      async listByPlayerWithGame(playerId, options) {
        const { data, error } = await client
          .from('player_game_stats')
          .select('*, game:games(*)')
          .eq('player_id', playerId);
        if (error) fail(error.message);

        // PostgREST can't order a parent by an embedded column, so sort the
        // (single player's) rows by game date here.
        const rows = ((data ?? []) as StatRowWithGame[]).slice().sort((a, b) => {
          const diff =
            new Date(a.game.date).getTime() - new Date(b.game.date).getTime();
          return options.order === 'asc' ? diff : -diff;
        });

        const limited =
          options.limit !== undefined ? rows.slice(0, options.limit) : rows;
        return limited.map((row) => ({
          ...toPlayerGameStatEntity(row),
          game: toGameEntity(row.game),
        })) as PlayerGameStatWithGame[];
      },
      async listByGameWithPlayer(gameId) {
        const { data, error } = await client
          .from('player_game_stats')
          .select('*, player:players(*)')
          .eq('game_id', gameId)
          .order('starter', { ascending: false })
          .order('points', { ascending: false });
        if (error) fail(error.message);
        return ((data ?? []) as StatRowWithPlayer[]).map((row) => ({
          ...toPlayerGameStatEntity(row),
          player: toPlayerEntity(row.player),
        })) as PlayerGameStatWithPlayer[];
      },
    },

    propLine: {
      async listByPlayer(playerId) {
        const { data, error } = await client
          .from('prop_lines')
          .select('*')
          .eq('player_id', playerId);
        if (error) fail(error.message);
        return (data ?? []).map(toPropLineEntity);
      },
    },

    user: {
      async findFirst() {
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (error) fail(error.message);
        return data ? toUserEntity(data) : null;
      },
    },
  };
}
