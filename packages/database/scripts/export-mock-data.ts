import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  gameFixtures,
  injuryReportFixtures,
  lineupReportFixtures,
  playerFixtures,
  playerGameStatFixtures,
  propLineFixtures,
  seasonFixtures,
  teamFixtures,
  userFixtures,
} from '../src/mock-data/index.js';
import type { MockDataFile } from '../src/mock-data/types.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(dirname, '../src/mock-data/mock-data.json');

const data: MockDataFile = {
  users: userFixtures,
  teams: teamFixtures,
  players: playerFixtures,
  seasons: seasonFixtures,
  games: gameFixtures,
  playerGameStats: playerGameStatFixtures,
  injuryReports: injuryReportFixtures,
  lineupReports: lineupReportFixtures,
  propLines: propLineFixtures,
};

fs.writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Wrote ${outPath}`);
