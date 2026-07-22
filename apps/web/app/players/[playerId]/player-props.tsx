'use client';

import { useState } from 'react';
import type {
  PlayerGameLogEntryDto,
  PropLineDto,
  PropStatType,
  TeamDto,
} from '@props-analyzer/shared-types';
import { PropAnalysis } from './prop-analysis';
import { GameLog } from './game-log';

/**
 * Owns the one piece of state the chart and the game log share: which market
 * is selected. Picking a stat pill in the chart re-highlights the game log's
 * prop column, so both views always describe the same bet.
 */
export function PlayerProps({
  playerName,
  propLines,
  entries,
  teams,
  gameLogError,
}: {
  playerName: string;
  propLines: PropLineDto[];
  entries: PlayerGameLogEntryDto[];
  teams: TeamDto[];
  gameLogError: string | null;
}) {
  const [selectedStatType, setSelectedStatType] = useState<PropStatType>(
    propLines[0].statType
  );

  const selectedProp =
    propLines.find((prop) => prop.statType === selectedStatType) ??
    propLines[0];

  return (
    <>
      <PropAnalysis
        playerName={playerName}
        propLines={propLines}
        selectedStatType={selectedStatType}
        onSelectStatType={setSelectedStatType}
      />
      <GameLog
        entries={entries}
        teams={teams}
        error={gameLogError}
        prop={selectedProp}
      />
    </>
  );
}
