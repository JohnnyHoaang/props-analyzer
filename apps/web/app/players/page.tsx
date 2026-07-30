import { listPlayers, listTeams } from '@props-analyzer/api-client';
import type { PlayerPosition, PlayerWithTeamDto, TeamDto } from '@props-analyzer/shared-types';
import { ErrorState } from '../components/error-state';
import { describeApiError } from '../lib/errors';
import { PlayerFilters } from './player-filters';
import { PlayerPagination } from './player-pagination';
import { PlayerRow } from './player-row';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

interface PlayersPageProps {
  searchParams: Promise<{
    teamId?: string;
    position?: string;
    active?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const filters = await searchParams;
  const page = Math.max(1, Number.parseInt(filters.page ?? '1', 10) || 1);
  const filterValue = {
    teamId: filters.teamId,
    position: filters.position,
    active: filters.active,
    search: filters.search,
  };

  let teams: TeamDto[] = [];
  let players: PlayerWithTeamDto[] = [];
  let loadError: string | null = null;

  try {
    [teams, players] = await Promise.all([
      listTeams(),
      listPlayers({
        teamId: filters.teamId || undefined,
        position: (filters.position as PlayerPosition) || undefined,
        active: filters.active === 'true' ? true : undefined,
        search: filters.search || undefined,
        page,
        limit: PAGE_SIZE + 1,
      }),
    ]);
  } catch (error) {
    loadError = describeApiError(error);
  }

  const hasNext = players.length > PAGE_SIZE;
  const visiblePlayers = hasNext ? players.slice(0, PAGE_SIZE) : players;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
          Players
        </h1>
        <p className="mt-2 text-slate-400">
          Search and browse players; filter by team, position, or active status.
        </p>
      </div>

      <PlayerFilters teams={teams} value={filters} />

      {loadError ? (
        <ErrorState title="Couldn't load players" message={loadError} />
      ) : visiblePlayers.length === 0 ? (
        <p className="text-sm text-slate-500">No players match those filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-line-800 bg-ink-800">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-line-800 text-xs font-bold uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Height</th>
                  <th className="px-4 py-3">Weight</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {visiblePlayers.map((player) => (
                  <PlayerRow key={player.id} player={player} />
                ))}
              </tbody>
            </table>
          </div>

          <PlayerPagination
            page={page}
            hasPrevious={page > 1}
            hasNext={hasNext}
            value={filterValue}
          />
        </>
      )}
    </div>
  );
}
