import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiClientError, getTeam, listPlayers } from '@props-analyzer/api-client';
import type { PlayerWithTeamDto, TeamDto } from '@props-analyzer/shared-types';
import { ErrorState } from '../../components/error-state';
import { describeApiError } from '../../lib/errors';
import { formatConference, formatHeight, formatPosition, formatWeight } from '../../lib/format';

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>;
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

function TeamHeader({ team }: { team: TeamDto }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
        {team.name}
      </h1>
      <span className="rounded-md bg-ink-700 px-2 py-0.5 text-xs font-bold tracking-wide text-slate-300">
        {team.abbreviation}
      </span>
      <span className="text-sm text-slate-500">
        {formatConference(team.conference)} · {team.division}
      </span>
    </div>
  );
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = await params;

  let team: TeamDto;

  try {
    team = await getTeam(teamId);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }
    return (
      <ErrorState title="Couldn't load this team" message={describeApiError(error)} />
    );
  }

  let players: PlayerWithTeamDto[] = [];
  let rosterError: string | null = null;

  try {
    players = await listPlayers({ teamId });
  } catch (error) {
    rosterError = describeApiError(error);
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/teams"
        className="text-sm font-semibold text-slate-500 transition-colors hover:text-azure-400"
      >
        ← All teams
      </Link>

      <TeamHeader team={team} />

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Roster</h2>

        {rosterError ? (
          <ErrorState title="Couldn't load roster" message={rosterError} />
        ) : players.length === 0 ? (
          <p className="text-sm text-slate-500">No players on this roster.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line-800 bg-ink-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line-800 text-xs font-bold uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
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
      </section>
    </div>
  );
}
