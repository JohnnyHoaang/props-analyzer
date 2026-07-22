import { gameFixtures } from './games.js';
import { playerFixtures } from './players.js';
import { addDays, toISODateTime } from './dates.js';

export type LineupRoleFixture = 'STARTER' | 'BENCH' | 'OUT';
export type LineupConfirmationFixture = 'EXPECTED' | 'CONFIRMED';

export interface LineupReportFixture {
  id: string;
  playerId: string;
  role: LineupRoleFixture;
  confirmation: LineupConfirmationFixture;
  reportedAt: string; // ISO datetime
  source: string;
}

interface LineupArcStep {
  /** Days after the season's first game. */
  daysAfterStart: number;
  role: LineupRoleFixture;
  confirmation: LineupConfirmationFixture;
}

const EARLIEST_GAME_DATE = new Date(
  Math.min(...gameFixtures.map((game) => new Date(game.date).getTime()))
);
const LATEST_GAME_DATE = new Date(
  Math.max(...gameFixtures.map((game) => new Date(game.date).getTime()))
);
/** Kept identical to injuries.ts's MOCK_NOW so both fixtures agree on
 * "today" in the mock timeline. */
const MOCK_NOW = addDays(LATEST_GAME_DATE, 2);
const NOW_OFFSET_DAYS = Math.round(
  (MOCK_NOW.getTime() - EARLIEST_GAME_DATE.getTime()) / (24 * 60 * 60 * 1000)
);

const SOURCE = 'Mock beat-writer wire';

/** Starting all season: one early confirmation, one current confirmation. */
const STARTER_ARC: LineupArcStep[] = [
  { daysAfterStart: 5, role: 'STARTER', confirmation: 'CONFIRMED' },
  { daysAfterStart: NOW_OFFSET_DAYS, role: 'STARTER', confirmation: 'CONFIRMED' },
];

/**
 * Role-change narratives for the three players whose roster spot moved
 * this season. Day offsets deliberately line up with the matching player's
 * arc in injuries.ts, so the two fixtures tell one consistent story.
 */
const LINEUP_ARCS: Record<string, LineupArcStep[]> = {
  // Injury arc: ACTIVE -> QUESTIONABLE (day 40) -> OUT (current).
  'player-meridian-3': [
    { daysAfterStart: 5, role: 'STARTER', confirmation: 'CONFIRMED' },
    { daysAfterStart: 40, role: 'STARTER', confirmation: 'CONFIRMED' },
    { daysAfterStart: NOW_OFFSET_DAYS, role: 'OUT', confirmation: 'CONFIRMED' },
  ],

  // Injury arc: ACTIVE -> QUESTIONABLE (day 48, back tightness) -> DOUBTFUL
  // (current) — still starting until the tightness was first reported,
  // then downgraded to a bench/uncertain role as it lingered.
  'player-harborview-3': [
    { daysAfterStart: 5, role: 'STARTER', confirmation: 'CONFIRMED' },
    { daysAfterStart: 48, role: 'STARTER', confirmation: 'CONFIRMED' },
    { daysAfterStart: NOW_OFFSET_DAYS, role: 'BENCH', confirmation: 'EXPECTED' },
  ],

  // Healthy all season — a pure rotation change, not injury-driven.
  'player-lakeshore-3': [
    { daysAfterStart: 5, role: 'STARTER', confirmation: 'CONFIRMED' },
    { daysAfterStart: 40, role: 'BENCH', confirmation: 'EXPECTED' },
    { daysAfterStart: NOW_OFFSET_DAYS, role: 'BENCH', confirmation: 'EXPECTED' },
  ],
};

export const lineupReportFixtures: LineupReportFixture[] = playerFixtures.flatMap(
  (player) => {
    const arc = LINEUP_ARCS[player.id] ?? STARTER_ARC;

    return arc.map((step, stepIndex) => ({
      id: `lineup-${player.id}-${stepIndex + 1}`,
      playerId: player.id,
      role: step.role,
      confirmation: step.confirmation,
      reportedAt: toISODateTime(
        addDays(EARLIEST_GAME_DATE, step.daysAfterStart)
      ),
      source: SOURCE,
    }));
  }
);
