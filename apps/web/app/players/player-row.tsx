'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { PlayerWithTeamDto } from '@props-analyzer/shared-types';
import { formatHeight, formatPosition, formatWeight } from '../lib/format';

export function PlayerRow({ player }: { player: PlayerWithTeamDto }) {
  const [imageError, setImageError] = useState(false);

  const initials = player.fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2);

  return (
    <tr className="border-b border-line-800 transition-colors last:border-0 hover:bg-ink-750">
      <td className="px-4 py-3">
        <Link href={`/players/${player.id}`} className="flex items-center gap-3">
          {player.imageUrl && !imageError ? (
            <img
              src={player.imageUrl}
              alt={player.fullName}
              onError={() => setImageError(true)}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-slate-400">
              {initials}
            </div>
          )}
          <span className="font-semibold text-azure-400 hover:text-azure-300">
            {player.fullName}
          </span>
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/teams/${player.team.id}`}
          className="rounded-md bg-ink-700 px-2 py-0.5 text-xs font-bold tracking-wide text-slate-300 transition-colors hover:text-white"
        >
          {player.team.abbreviation}
        </Link>
      </td>
      <td className="px-4 py-3 text-slate-400">{formatPosition(player.position)}</td>
      <td className="tabular px-4 py-3 text-slate-400">{formatHeight(player.height)}</td>
      <td className="tabular px-4 py-3 text-slate-400">{formatWeight(player.weight)}</td>
      <td className="px-4 py-3">
        {player.active ? (
          <span className="rounded-full bg-mint-500/15 px-2.5 py-0.5 text-xs font-semibold text-mint-400">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-ink-700 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
            Inactive
          </span>
        )}
      </td>
    </tr>
  );
}
