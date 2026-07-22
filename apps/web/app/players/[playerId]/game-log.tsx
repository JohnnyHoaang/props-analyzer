import type {
  PlayerGameLogEntryDto,
  PropLineDto,
  TeamDto,
} from '@props-analyzer/shared-types';
import {
  STAT_TYPE_ABBREVIATIONS,
  statValueForType,
} from '@props-analyzer/shared-types';
import { ErrorState } from '../../components/error-state';
import {
  formatDate,
  formatPlusMinus,
  formatShootingSplit,
} from '../../lib/format';

/** Subtle green/red wash behind the prop cells — the chart's over/under fills
 * at low alpha so the row still reads. */
const OVER_WASH = 'rgba(14, 169, 104, 0.16)';
const UNDER_WASH = 'rgba(239, 68, 68, 0.16)';

function GameLogRow({
  entry,
  teamsById,
  prop,
}: {
  entry: PlayerGameLogEntryDto;
  teamsById: Map<string, TeamDto>;
  prop: PropLineDto | null;
}) {
  const opponent = teamsById.get(entry.opponentTeamId);
  const plusMinus = formatPlusMinus(entry.plusMinus);
  const plusMinusColor =
    entry.plusMinus > 0
      ? 'text-mint-400'
      : entry.plusMinus < 0
        ? 'text-coral-400'
        : 'text-slate-500';

  let propCells = null;
  if (prop) {
    const value = statValueForType(entry, prop.statType);
    const isOver = value > prop.line;
    const wash = isOver ? OVER_WASH : UNDER_WASH;
    const resultColor = isOver ? 'text-mint-400' : 'text-coral-400';

    propCells = (
      <>
        <td
          className="tabular px-4 py-3 text-center font-semibold text-white"
          style={{ backgroundColor: wash }}
        >
          {prop.line}
        </td>
        <td
          className={`tabular px-4 py-3 text-center font-bold ${resultColor}`}
          style={{ backgroundColor: wash }}
        >
          {isOver ? 'O' : 'U'} {value}
        </td>
      </>
    );
  }

  return (
    <tr className="border-b border-line-800 transition-colors last:border-0 hover:bg-ink-750">
      <td className="px-4 py-3 text-slate-500">{formatDate(entry.game.date)}</td>
      <td className="px-4 py-3 font-semibold text-slate-300">
        {entry.isHome ? 'vs' : '@'}{' '}
        {opponent?.abbreviation ?? entry.opponentTeamId}
      </td>
      {propCells}
      <td className="tabular px-4 py-3 text-right text-slate-400">
        {entry.minutes}
      </td>
      <td className="tabular px-4 py-3 text-right font-display text-sm font-bold text-white">
        {entry.points}
      </td>
      <td className="tabular px-4 py-3 text-right text-slate-400">
        {entry.rebounds}
      </td>
      <td className="tabular px-4 py-3 text-right text-slate-400">
        {entry.assists}
      </td>
      <td className="tabular px-4 py-3 text-right text-slate-400">
        {entry.steals}
      </td>
      <td className="tabular px-4 py-3 text-right text-slate-400">
        {entry.blocks}
      </td>
      <td className="tabular px-4 py-3 text-right text-slate-400">
        {formatShootingSplit(entry.fgm, entry.fga)}
      </td>
      <td className="tabular px-4 py-3 text-right text-slate-400">
        {formatShootingSplit(entry.threePM, entry.threePA)}
      </td>
      <td
        className={`tabular px-4 py-3 text-right font-semibold ${plusMinusColor}`}
      >
        {plusMinus}
      </td>
    </tr>
  );
}

/**
 * Shared, hook-free so it renders on the server (no prop selected) or inside
 * the client PlayerProps wrapper (highlighting whichever market is selected in
 * the chart). When `prop` is set, two columns are inserted showing the line
 * and whether the player went over/under it that game.
 */
export function GameLog({
  entries,
  teams,
  error,
  prop = null,
}: {
  entries: PlayerGameLogEntryDto[];
  teams: TeamDto[];
  error?: string | null;
  prop?: PropLineDto | null;
}) {
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  const overCount = prop
    ? entries.filter((entry) => statValueForType(entry, prop.statType) > prop.line)
        .length
    : 0;

  return (
    <section>
      <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">
        Game log
      </h2>
      {prop && entries.length > 0 && (
        <p className="mb-3 text-sm text-slate-400">
          The Over hit{' '}
          <span className="font-bold text-mint-400">
            {overCount}/{entries.length}
          </span>{' '}
          in these games at a line of{' '}
          <span className="tabular font-semibold text-white">{prop.line}</span>.
        </p>
      )}

      {error ? (
        <ErrorState title="Couldn't load the game log" message={error} />
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-500">No completed games yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line-800 bg-ink-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line-800 text-xs font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Opponent</th>
                {prop && (
                  <>
                    <th className="px-4 py-3 text-center">Prop</th>
                    <th className="px-4 py-3 text-center">
                      {STAT_TYPE_ABBREVIATIONS[prop.statType]}
                    </th>
                  </>
                )}
                <th className="px-4 py-3 text-right">Min</th>
                <th className="px-4 py-3 text-right">Pts</th>
                <th className="px-4 py-3 text-right">Reb</th>
                <th className="px-4 py-3 text-right">Ast</th>
                <th className="px-4 py-3 text-right">Stl</th>
                <th className="px-4 py-3 text-right">Blk</th>
                <th className="px-4 py-3 text-right">FG</th>
                <th className="px-4 py-3 text-right">3P</th>
                <th className="px-4 py-3 text-right">+/-</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <GameLogRow
                  key={entry.id}
                  entry={entry}
                  teamsById={teamsById}
                  prop={prop}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
