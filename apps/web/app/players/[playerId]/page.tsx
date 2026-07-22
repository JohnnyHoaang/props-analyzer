import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ApiClientError,
  getPlayer,
  getPlayerGameLog,
  getPlayerProps,
  listTeams,
} from '@props-analyzer/api-client';
import type {
  PlayerGameLogEntryDto,
  PropLineDto,
  PlayerWithTeamDto,
  TeamDto,
} from '@props-analyzer/shared-types';
import { ErrorState } from '../../components/error-state';
import { describeApiError } from '../../lib/errors';
import { formatHeight, formatPosition, formatWeight } from '../../lib/format';
import { GameLog } from './game-log';
import { PlayerProps } from './player-props';

interface PlayerDetailPageProps {
  params: Promise<{ playerId: string }>;
}

export default async function PlayerDetailPage({
  params,
}: PlayerDetailPageProps) {
  const { playerId } = await params;

  let player: PlayerWithTeamDto;

  try {
    player = await getPlayer(playerId);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }
    return (
      <ErrorState title="Couldn't load this player" message={describeApiError(error)} />
    );
  }

  let gameLog: PlayerGameLogEntryDto[] = [];
  let teams: TeamDto[] = [];
  let gameLogError: string | null = null;

  // Props degrade independently of the game log — a failure in one shouldn't
  // blank out the other.
  let propLines: PropLineDto[] = [];

  const [gameLogResult, propsResult] = await Promise.allSettled([
    Promise.all([getPlayerGameLog(playerId, { limit: 15 }), listTeams()]),
    getPlayerProps(playerId),
  ]);

  if (gameLogResult.status === 'fulfilled') {
    const [log, teamsList] = gameLogResult.value;
    gameLog = log;
    teams = teamsList;
  } else {
    gameLogError = describeApiError(gameLogResult.reason);
  }

  if (propsResult.status === 'fulfilled') {
    propLines = propsResult.value;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/players"
          className="text-sm font-semibold text-slate-500 hover:text-azure-400"
        >
          ← All players
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-line-800 bg-ink-800">
        <div
          className="absolute inset-y-0 left-0 w-64 bg-gradient-to-br from-azure-500 to-ink-900"
          style={{ clipPath: 'polygon(0 0, 85% 0, 60% 100%, 0 100%)' }}
        />
        <div className="relative flex flex-wrap items-center gap-6 px-8 py-8">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-ink-800 bg-ink-900 font-display text-3xl font-extrabold text-white shadow-lg">
            {player.fullName
              .split(' ')
              .map((part) => part.charAt(0))
              .join('')
              .slice(0, 2)}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Player Profile
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
                {player.fullName}
              </h1>
              {player.active ? (
                <span className="rounded-full bg-mint-500/15 px-2.5 py-0.5 text-xs font-semibold text-mint-400">
                  Active
                </span>
              ) : (
                <span className="rounded-full bg-ink-700 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-slate-400">
              {player.team.name} · {formatPosition(player.position)} ·{' '}
              {formatHeight(player.height)}, {formatWeight(player.weight)}
            </p>
          </div>
        </div>
      </div>

      {propLines.length > 0 ? (
        <PlayerProps
          playerName={player.fullName}
          propLines={propLines}
          entries={gameLog}
          teams={teams}
          gameLogError={gameLogError}
        />
      ) : (
        <GameLog entries={gameLog} teams={teams} error={gameLogError} />
      )}
    </div>
  );
}
