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
    <li className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-750">
      <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {formatDate(game.date)}
      </span>
      <span className="flex flex-1 items-center gap-2 font-display text-sm font-bold">
        <span className={!homeWon ? 'text-white' : 'text-slate-500'}>
          {game.awayTeam.abbreviation}
        </span>
        <span className="text-slate-600">@</span>
        <span className={homeWon ? 'text-white' : 'text-slate-500'}>
          {game.homeTeam.abbreviation}
        </span>
      </span>
      <span className="tabular w-20 shrink-0 text-right font-display text-sm font-bold text-white">
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
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-slate-400">
          <Link href="/players" className="font-semibold text-azure-400 hover:text-azure-300">
            Browse players →
          </Link>
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          Recent completed games
        </h2>
        {loadError ? (
          <ErrorState title="Couldn't load games" message={loadError} />
        ) : games.length === 0 ? (
          <p className="text-sm text-slate-500">No completed games yet.</p>
        ) : (
          <ul className="divide-y divide-line-800 overflow-hidden rounded-xl border border-line-800 bg-ink-800">
            {games.map((game) => (
              <GameRow key={game.id} game={game} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
