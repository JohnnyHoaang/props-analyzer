import { PLAYER_POSITIONS, type TeamDto } from '@props-analyzer/shared-types';
import { formatPosition } from '../lib/format';

export interface PlayerFiltersValue {
  teamId?: string;
  position?: string;
  active?: string;
}

/**
 * Plain GET form — the browser handles navigation/query-string updates on
 * submit, so filtering works without any client-side JS.
 */
export function PlayerFilters({
  teams,
  value,
}: {
  teams: TeamDto[];
  value: PlayerFiltersValue;
}) {
  return (
    <form
      method="get"
      action="/players"
      className="flex flex-wrap items-end gap-4 rounded-xl border border-line-800 bg-ink-800 p-4"
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Team
        </span>
        <select
          name="teamId"
          defaultValue={value.teamId ?? ''}
          className="rounded-lg border border-line-700 bg-ink-750 px-3 py-1.5 text-slate-200 focus:border-azure-500 focus:outline-none"
        >
          <option value="">All teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Position
        </span>
        <select
          name="position"
          defaultValue={value.position ?? ''}
          className="rounded-lg border border-line-700 bg-ink-750 px-3 py-1.5 text-slate-200 focus:border-azure-500 focus:outline-none"
        >
          <option value="">All positions</option>
          {PLAYER_POSITIONS.map((position) => (
            <option key={position} value={position}>
              {formatPosition(position)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 pb-1.5 text-sm text-slate-300">
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={value.active === 'true'}
          className="h-4 w-4 rounded border-line-700 bg-ink-750 accent-azure-500"
        />
        Active only
      </label>

      <button
        type="submit"
        className="rounded-lg bg-azure-500 px-5 py-1.5 text-sm font-bold text-white transition-colors hover:bg-azure-600"
      >
        Apply
      </button>
    </form>
  );
}
