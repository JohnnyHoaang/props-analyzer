import Link from 'next/link';
import { listGames } from '@props-analyzer/api-client';
import type { GameWithTeamsDto } from '@props-analyzer/shared-types';
import { ErrorState } from './components/error-state';
import { describeApiError } from './lib/errors';
import { formatDate } from './lib/format';

// This reads live data from the API on every request; without this it
// would get statically prerendered once at build time and never update.
export const dynamic = 'force-dynamic';

function GameRow({ game }: { game: GameWithTeamsDto }) {
  const homeWon = (game.homeScore ?? 0) >= (game.awayScore ?? 0);

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="w-24 shrink-0 text-sm text-slate-500">
        {formatDate(game.date)}
      </span>
      <span className="flex-1 text-sm">
        <span className={!homeWon ? 'font-semibold text-slate-900' : undefined}>
          {game.awayTeam.abbreviation}
        </span>
        <span className="text-slate-400"> @ </span>
        <span className={homeWon ? 'font-semibold text-slate-900' : undefined}>
          {game.homeTeam.abbreviation}
        </span>
      </span>
      <span className="w-20 shrink-0 text-right text-sm text-slate-600">
        {game.awayScore}–{game.homeScore}
      </span>
    </li>
  );
}

export default async function DashboardPage() {
  let games: GameWithTeamsDto[] = [];
  let loadError: string | null = null;

  try {
    games = await listGames({ status: 'FINAL', limit: 10 });
  } catch (error) {
    loadError = describeApiError(error);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Mock data for Phase 1 — no live tracking, completed games only.{' '}
          <Link href="/players" className="font-medium text-blue-600 hover:underline">
            Browse players →
          </Link>
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">
          Recent completed games
        </h2>
        {loadError ? (
          <ErrorState title="Couldn't load games" message={loadError} />
        ) : games.length === 0 ? (
          <p className="text-sm text-slate-500">No completed games yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {games.map((game) => (
              <GameRow key={game.id} game={game} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
