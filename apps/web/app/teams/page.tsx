import Link from 'next/link';
import { listTeams } from '@props-analyzer/api-client';
import type { Conference, TeamDto } from '@props-analyzer/shared-types';
import { ErrorState } from '../components/error-state';
import { describeApiError } from '../lib/errors';
import { formatConference } from '../lib/format';

export const dynamic = 'force-dynamic';

const CONFERENCE_ORDER: Conference[] = ['EASTERN', 'WESTERN'];

function TeamRow({ team }: { team: TeamDto }) {
  return (
    <tr className="border-b border-line-800 transition-colors last:border-0 hover:bg-ink-750">
      <td className="px-4 py-3">
        <Link
          href={`/teams/${team.id}`}
          className="font-semibold text-azure-400 hover:text-azure-300"
        >
          {team.name}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="rounded-md bg-ink-700 px-2 py-0.5 text-xs font-bold tracking-wide text-slate-300">
          {team.abbreviation}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-400">{formatConference(team.conference)}</td>
      <td className="px-4 py-3 text-slate-400">{team.division}</td>
    </tr>
  );
}

export default async function TeamsPage() {
  let teams: TeamDto[] = [];
  let loadError: string | null = null;

  try {
    teams = await listTeams();
  } catch (error) {
    loadError = describeApiError(error);
  }

  const teamsByConference = CONFERENCE_ORDER.map((conference) => ({
    conference,
    teams: teams
      .filter((team) => team.conference === conference)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.teams.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">Teams</h1>
        <p className="mt-2 text-slate-400">
          Browse NBA teams by conference. Select a team to view its roster.
        </p>
      </div>

      {loadError ? (
        <ErrorState title="Couldn't load teams" message={loadError} />
      ) : teams.length === 0 ? (
        <p className="text-sm text-slate-500">No teams found.</p>
      ) : (
        teamsByConference.map(({ conference, teams: conferenceTeams }) => (
          <section key={conference} className="flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {formatConference(conference)} Conference
            </h2>
            <div className="overflow-hidden rounded-xl border border-line-800 bg-ink-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line-800 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Abbr</th>
                    <th className="px-4 py-3">Conference</th>
                    <th className="px-4 py-3">Division</th>
                  </tr>
                </thead>
                <tbody>
                  {conferenceTeams.map((team) => (
                    <TeamRow key={team.id} team={team} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
