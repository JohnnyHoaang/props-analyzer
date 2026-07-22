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
    <tr className="border-b border-line-800 transition-colors last:border-0 hover:bg-ink-750">
      <td className="px-4 py-3">
        <Link
          href={`/players/${player.id}`}
          className="font-semibold text-azure-400 hover:text-azure-300"
        >
          {player.fullName}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="rounded-md bg-ink-700 px-2 py-0.5 text-xs font-bold tracking-wide text-slate-300">
          {player.team.abbreviation}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-400">{formatPosition(player.position)}</td>
      <td className="tabular px-4 py-3 text-slate-400">{formatHeight(player.height)}</td>
      <td className="tabular px-4 py-3 text-slate-400">{formatWeight(player.weight)}</td>
      <td className="px-4 py-3">
        {player.active ? (
          <span className="rounded-full bg-mint-500/15 px-2.5 py-0.5 text-xs font-semibold text-mint-400">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-ink-700 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
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
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
          Players
        </h1>
        <p className="mt-2 text-slate-400">
          Browse all players; filter by team, position, or active status.
        </p>
      </div>

      <PlayerFilters teams={teams} value={filters} />

      {loadError ? (
        <ErrorState title="Couldn't load players" message={loadError} />
      ) : players.length === 0 ? (
        <p className="text-sm text-slate-500">No players match those filters.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line-800 bg-ink-800">
          <table className="w-full text-left text-sm">
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
