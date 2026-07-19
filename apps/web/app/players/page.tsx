import Link from 'next/link';
import { listPlayers, listTeams } from '@props-analyzer/api-client';
import type { PlayerPosition, PlayerWithTeamDto, TeamDto } from '@props-analyzer/shared-types';
import { ErrorState } from '../components/error-state';
import { describeApiError } from '../lib/errors';
import { formatHeight, formatPosition, formatWeight } from '../lib/format';
import { PlayerFilters } from './player-filters';

interface PlayersPageProps {
  searchParams: Promise<{
    teamId?: string;
    position?: string;
    active?: string;
  }>;
}

function PlayerRow({ player }: { player: PlayerWithTeamDto }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3">
        <Link
          href={`/players/${player.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {player.fullName}
        </Link>
      </td>
      <td className="px-4 py-3 text-slate-600">{player.team.abbreviation}</td>
      <td className="px-4 py-3 text-slate-600">{formatPosition(player.position)}</td>
      <td className="px-4 py-3 text-slate-600">{formatHeight(player.height)}</td>
      <td className="px-4 py-3 text-slate-600">{formatWeight(player.weight)}</td>
      <td className="px-4 py-3">
        {player.active ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            Inactive
          </span>
        )}
      </td>
    </tr>
  );
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const filters = await searchParams;

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
        limit: 100,
      }),
    ]);
  } catch (error) {
    loadError = describeApiError(error);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Players</h1>
        <p className="mt-1 text-slate-600">
          Browse all players; filter by team, position, or active status.
        </p>
      </div>

      <PlayerFilters teams={teams} value={filters} />

      {loadError ? (
        <ErrorState title="Couldn't load players" message={loadError} />
      ) : players.length === 0 ? (
        <p className="text-sm text-slate-500">No players match those filters.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Team</th>
                <th className="px-4 py-2">Position</th>
                <th className="px-4 py-2">Height</th>
                <th className="px-4 py-2">Weight</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <PlayerRow key={player.id} player={player} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
