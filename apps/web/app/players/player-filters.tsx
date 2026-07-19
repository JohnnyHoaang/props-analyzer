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
      className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Team</span>
        <select
          name="teamId"
          defaultValue={value.teamId ?? ''}
          className="rounded border border-slate-300 px-2 py-1.5"
        >
          <option value="">All teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Position</span>
        <select
          name="position"
          defaultValue={value.position ?? ''}
          className="rounded border border-slate-300 px-2 py-1.5"
        >
          <option value="">All positions</option>
          {PLAYER_POSITIONS.map((position) => (
            <option key={position} value={position}>
              {formatPosition(position)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 pb-1.5 text-sm text-slate-700">
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={value.active === 'true'}
          className="h-4 w-4 rounded border-slate-300"
        />
        Active only
      </label>

      <button
        type="submit"
        className="rounded bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        Apply
      </button>
    </form>
  );
}
