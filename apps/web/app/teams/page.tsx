import Link from 'next/link';
import { listTeams } from '@props-analyzer/api-client';
import type { Conference, TeamDto } from '@props-analyzer/shared-types';
import { ErrorState } from '../components/error-state';
import { describeApiError } from '../lib/errors';
import { formatConference } from '../lib/format';

export const dynamic = 'force-dynamic';

const CONFERENCE_ORDER: Conference[] = ['EASTERN', 'WESTERN'];

function TeamCard({ team }: { team: TeamDto }) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-line-800 bg-ink-800 p-4 text-center transition-colors hover:border-azure-400/40 hover:bg-ink-750"
    >
      <span className="font-display text-3xl font-extrabold tracking-tight text-white transition-colors group-hover:text-azure-300">
        {team.abbreviation}
      </span>
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-slate-300">
        {team.name}
      </span>
      <span className="text-xs text-slate-500">{team.division}</span>
    </Link>
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {conferenceTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
