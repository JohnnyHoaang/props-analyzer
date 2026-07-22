import type { PlayerGameStatFixture } from './player-game-stats.js';
import type { PlayerFixture } from './players.js';
import type { SeasonFixture } from './seasons.js';
import type { TeamFixture } from './teams.js';
import type { UserFixture } from './users.js';
import type { GameFixture } from './games.js';
import type { InjuryReportFixture } from './injuries.js';
import type { LineupReportFixture } from './lineups.js';
import type { PropLineFixture } from './prop-lines.js';

/** On-disk mock dataset — the single source of truth for mock mode and
 * optional Postgres seeding. Edit this file (or regenerate via
 * `pnpm db:export-mock-data`) and restart the API to pick up changes. */
export interface MockDataFile {
  users: UserFixture[];
  teams: TeamFixture[];
  players: PlayerFixture[];
  seasons: SeasonFixture[];
  games: GameFixture[];
  playerGameStats: PlayerGameStatFixture[];
  injuryReports: InjuryReportFixture[];
  lineupReports: LineupReportFixture[];
  propLines: PropLineFixture[];
}
