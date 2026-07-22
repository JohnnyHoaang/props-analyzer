import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MockDataFile } from './types.js';

const PACKAGE_ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

const DEFAULT_RELATIVE_PATH = path.join(
  'packages',
  'database',
  'src',
  'mock-data',
  'mock-data.json'
);

/** Resolve the mock-data JSON path. Prefers `MOCK_DATA_PATH`, then an
 * explicit override, then the repo-default location (works when `cwd` is
 * the monorepo root or `packages/database`). */
export function resolveMockDataPath(customPath?: string): string {
  if (customPath) {
    return customPath;
  }

  const fromEnv = process.env['MOCK_DATA_PATH'];
  if (fromEnv) {
    return fromEnv;
  }

  const fromCwd = path.join(process.cwd(), DEFAULT_RELATIVE_PATH);
  if (fs.existsSync(fromCwd)) {
    return fromCwd;
  }

  return path.join(PACKAGE_ROOT, 'src/mock-data/mock-data.json');
}

export function loadMockDataFile(customPath?: string): MockDataFile {
  const filePath = resolveMockDataPath(customPath);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as MockDataFile;
}
