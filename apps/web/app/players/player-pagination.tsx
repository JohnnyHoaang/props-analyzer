import Link from 'next/link';

export interface PlayerPaginationValue {
  teamId?: string;
  position?: string;
  active?: string;
  search?: string;
}

function buildPlayersHref(
  value: PlayerPaginationValue,
  page: number
): string {
  const params = new URLSearchParams();

  if (value.search) {
    params.set('search', value.search);
  }
  if (value.teamId) {
    params.set('teamId', value.teamId);
  }
  if (value.position) {
    params.set('position', value.position);
  }
  if (value.active === 'true') {
    params.set('active', 'true');
  }
  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();
  return query ? `/players?${query}` : '/players';
}

export function PlayerPagination({
  page,
  hasPrevious,
  hasNext,
  value,
}: {
  page: number;
  hasPrevious: boolean;
  hasNext: boolean;
  value: PlayerPaginationValue;
}) {
  if (!hasPrevious && !hasNext) {
    return null;
  }

  return (
    <nav
      aria-label="Player list pagination"
      className="flex items-center justify-between gap-4 rounded-xl border border-line-800 bg-ink-800 px-4 py-3"
    >
      <span className="text-sm text-slate-500">Page {page}</span>
      <div className="flex items-center gap-2">
        {hasPrevious ? (
          <Link
            href={buildPlayersHref(value, page - 1)}
            className="rounded-lg border border-line-700 px-4 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:border-azure-500 hover:text-white"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-line-800 px-4 py-1.5 text-sm font-semibold text-slate-600">
            Previous
          </span>
        )}
        {hasNext ? (
          <Link
            href={buildPlayersHref(value, page + 1)}
            className="rounded-lg border border-line-700 px-4 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:border-azure-500 hover:text-white"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-lg border border-line-800 px-4 py-1.5 text-sm font-semibold text-slate-600">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
