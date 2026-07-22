import { gameFixtures } from './games.js';
import { playerFixtures } from './players.js';
import { addDays, toISODate, toISODateTime } from './dates.js';

export type InjuryStatusFixture =
  | 'OUT'
  | 'DOUBTFUL'
  | 'QUESTIONABLE'
  | 'PROBABLE'
  | 'ACTIVE';

export interface InjuryReportFixture {
  id: string;
  playerId: string;
  status: InjuryStatusFixture;
  description: string | null;
  reportedAt: string; // ISO datetime
  expectedReturn: string | null; // ISO date
  confirmed: boolean;
  source: string;
}

interface InjuryArcStep {
  /** Days after the season's first game. */
  daysAfterStart: number;
  status: InjuryStatusFixture;
  description: string | null;
  /** Days after the season's first game, or null if not applicable. */
  expectedReturnDaysAfterStart: number | null;
  confirmed: boolean;
}

const EARLIEST_GAME_DATE = new Date(
  Math.min(...gameFixtures.map((game) => new Date(game.date).getTime()))
);
const LATEST_GAME_DATE = new Date(
  Math.max(...gameFixtures.map((game) => new Date(game.date).getTime()))
);
/** "Today" in the mock timeline — a couple of days after the last game in
 * the fixture schedule, so report history reads as current relative to the
 * season rather than the real wall-clock date. */
const MOCK_NOW = addDays(LATEST_GAME_DATE, 2);
const NOW_OFFSET_DAYS = Math.round(
  (MOCK_NOW.getTime() - EARLIEST_GAME_DATE.getTime()) / (24 * 60 * 60 * 1000)
);

const SOURCE = 'Mock beat-writer wire';

/** Healthy all season: one early confirmation, one current confirmation. */
const HEALTHY_ARC: InjuryArcStep[] = [
  {
    daysAfterStart: 5,
    status: 'ACTIVE',
    description: null,
    expectedReturnDaysAfterStart: null,
    confirmed: true,
  },
  {
    daysAfterStart: NOW_OFFSET_DAYS,
    status: 'ACTIVE',
    description: null,
    expectedReturnDaysAfterStart: null,
    confirmed: true,
  },
];

/** Healthy overall, but took a scheduled rest day mid-season (load
 * management) before returning to active — a bit of history without a real
 * injury narrative. */
const REST_DAY_ARC: InjuryArcStep[] = [
  {
    daysAfterStart: 5,
    status: 'ACTIVE',
    description: null,
    expectedReturnDaysAfterStart: null,
    confirmed: true,
  },
  {
    daysAfterStart: 30,
    status: 'QUESTIONABLE',
    description: 'Load management (rest)',
    expectedReturnDaysAfterStart: null,
    confirmed: true,
  },
  {
    daysAfterStart: 32,
    status: 'ACTIVE',
    description: null,
    expectedReturnDaysAfterStart: null,
    confirmed: true,
  },
  {
    daysAfterStart: NOW_OFFSET_DAYS,
    status: 'ACTIVE',
    description: null,
    expectedReturnDaysAfterStart: null,
    confirmed: true,
  },
];

/**
 * Real injury narratives — one per player, each a progression of reports
 * ending at that player's current status (see lineups.ts, which keeps its
 * own arcs for these same players consistent with the dates here).
 */
const INJURY_ARCS: Record<string, InjuryArcStep[]> = {
  'player-cascade-1': REST_DAY_ARC,
  'player-sable-2': REST_DAY_ARC,
  'player-redstone-1': REST_DAY_ARC,
  'player-lakeshore-1': REST_DAY_ARC,

  'player-cascade-2': [
    {
      daysAfterStart: 5,
      status: 'ACTIVE',
      description: null,
      expectedReturnDaysAfterStart: null,
      confirmed: true,
    },
    {
      daysAfterStart: 35,
      status: 'PROBABLE',
      description: 'Right ankle soreness (day-to-day)',
      expectedReturnDaysAfterStart: null,
      confirmed: false,
    },
    {
      daysAfterStart: NOW_OFFSET_DAYS,
      status: 'QUESTIONABLE',
      description: 'Right ankle soreness',
      expectedReturnDaysAfterStart: null,
      confirmed: false,
    },
  ],

  'player-meridian-3': [
    {
      daysAfterStart: 5,
      status: 'ACTIVE',
      description: null,
      expectedReturnDaysAfterStart: null,
      confirmed: true,
    },
    {
      daysAfterStart: 40,
      status: 'QUESTIONABLE',
      description: 'Left knee soreness',
      expectedReturnDaysAfterStart: null,
      confirmed: false,
    },
    {
      daysAfterStart: NOW_OFFSET_DAYS,
      status: 'OUT',
      description: 'Left knee sprain',
      expectedReturnDaysAfterStart: NOW_OFFSET_DAYS + 17,
      confirmed: true,
    },
  ],

  'player-sable-1': [
    {
      daysAfterStart: 5,
      status: 'ACTIVE',
      description: null,
      expectedReturnDaysAfterStart: null,
      confirmed: true,
    },
    {
      daysAfterStart: 45,
      status: 'OUT',
      description: 'Flu-like illness',
      expectedReturnDaysAfterStart: null,
      confirmed: true,
    },
    {
      daysAfterStart: NOW_OFFSET_DAYS,
      status: 'PROBABLE',
      description: 'Illness (return to competition)',
      expectedReturnDaysAfterStart: null,
      confirmed: false,
    },
  ],

  'player-harborview-3': [
    {
      daysAfterStart: 5,
      status: 'ACTIVE',
      description: null,
      expectedReturnDaysAfterStart: null,
      confirmed: true,
    },
    {
      daysAfterStart: 48,
      status: 'QUESTIONABLE',
      description: 'Lower back tightness first reported',
      expectedReturnDaysAfterStart: null,
      confirmed: false,
    },
    {
      daysAfterStart: NOW_OFFSET_DAYS,
      status: 'DOUBTFUL',
      description: 'Lower back tightness',
      expectedReturnDaysAfterStart: null,
      confirmed: false,
    },
  ],

  'player-redstone-2': [
    {
      daysAfterStart: 5,
      status: 'ACTIVE',
      description: null,
      expectedReturnDaysAfterStart: null,
      confirmed: true,
    },
    {
      daysAfterStart: 50,
      status: 'PROBABLE',
      description: 'Right hamstring tightness',
      expectedReturnDaysAfterStart: null,
      confirmed: false,
    },
    {
      daysAfterStart: NOW_OFFSET_DAYS,
      status: 'QUESTIONABLE',
      description: 'Right hamstring strain',
      expectedReturnDaysAfterStart: null,
      confirmed: false,
    },
  ],
};

export const injuryReportFixtures: InjuryReportFixture[] = playerFixtures.flatMap(
  (player) => {
    const arc = INJURY_ARCS[player.id] ?? HEALTHY_ARC;

    return arc.map((step, stepIndex) => ({
      id: `injury-${player.id}-${stepIndex + 1}`,
      playerId: player.id,
      status: step.status,
      description: step.description,
      reportedAt: toISODateTime(
        addDays(EARLIEST_GAME_DATE, step.daysAfterStart)
      ),
      expectedReturn:
        step.expectedReturnDaysAfterStart != null
          ? toISODate(addDays(EARLIEST_GAME_DATE, step.expectedReturnDaysAfterStart))
          : null,
      confirmed: step.confirmed,
      source: SOURCE,
    }));
  }
);
