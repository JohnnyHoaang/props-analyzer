import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ApiClientError,
  getPlayer,
  getPlayerGameLog,
  listTeams,
} from '@props-analyzer/api-client';
import type {
  PlayerGameLogEntryDto,
  PlayerWithTeamDto,
  TeamDto,
} from '@props-analyzer/shared-types';
import { ErrorState } from '../../components/error-state';
import { describeApiError } from '../../lib/errors';
import {
  formatDate,
  formatHeight,
  formatPlusMinus,
  formatPosition,
  formatShootingSplit,
  formatWeight,
} from '../../lib/format';

interface PlayerDetailPageProps {
  params: Promise<{ playerId: string }>;
}

function GameLogRow({
  entry,
  teamsById,
}: {
  entry: PlayerGameLogEntryDto;
  teamsById: Map<string, TeamDto>;
}) {
  const opponent = teamsById.get(entry.opponentTeamId);

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3 text-slate-600">{formatDate(entry.game.date)}</td>
      <td className="px-4 py-3 text-slate-600">
        {entry.isHome ? 'vs' : '@'} {opponent?.abbreviation ?? entry.opponentTeamId}
      </td>
      <td className="px-4 py-3 text-right">{entry.minutes}</td>
      <td className="px-4 py-3 text-right font-medium text-slate-900">
        {entry.points}
      </td>
      <td className="px-4 py-3 text-right">{entry.rebounds}</td>
      <td className="px-4 py-3 text-right">{entry.assists}</td>
      <td className="px-4 py-3 text-right">{entry.steals}</td>
      <td className="px-4 py-3 text-right">{entry.blocks}</td>
      <td className="px-4 py-3 text-right text-slate-600">
        {formatShootingSplit(entry.fgm, entry.fga)}
      </td>
      <td className="px-4 py-3 text-right text-slate-600">
        {formatShootingSplit(entry.threePM, entry.threePA)}
      </td>
      <td className="px-4 py-3 text-right text-slate-600">
        {formatPlusMinus(entry.plusMinus)}
      </td>
    </tr>
  );
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
  let teamsById = new Map<string, TeamDto>();
  let gameLogError: string | null = null;

  try {
    const [log, teams] = await Promise.all([
      getPlayerGameLog(playerId, { limit: 15 }),
      listTeams(),
    ]);
    gameLog = log;
    teamsById = new Map(teams.map((team) => [team.id, team]));
  } catch (error) {
    gameLogError = describeApiError(error);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/players" className="text-sm text-blue-600 hover:underline">
          ← All players
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {player.fullName}
        </h1>
        <p className="mt-1 text-slate-600">
          {player.team.name} · {formatPosition(player.position)} ·{' '}
          {formatHeight(player.height)}, {formatWeight(player.weight)}
          {!player.active && (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              Inactive
            </span>
          )}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">Game log</h2>
        {gameLogError ? (
          <ErrorState title="Couldn't load the game log" message={gameLogError} />
        ) : gameLog.length === 0 ? (
          <p className="text-sm text-slate-500">No completed games yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Opponent</th>
                  <th className="px-4 py-2 text-right">Min</th>
                  <th className="px-4 py-2 text-right">Pts</th>
                  <th className="px-4 py-2 text-right">Reb</th>
                  <th className="px-4 py-2 text-right">Ast</th>
                  <th className="px-4 py-2 text-right">Stl</th>
                  <th className="px-4 py-2 text-right">Blk</th>
                  <th className="px-4 py-2 text-right">FG</th>
                  <th className="px-4 py-2 text-right">3P</th>
                  <th className="px-4 py-2 text-right">+/-</th>
                </tr>
              </thead>
              <tbody>
                {gameLog.map((entry) => (
                  <GameLogRow key={entry.id} entry={entry} teamsById={teamsById} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
