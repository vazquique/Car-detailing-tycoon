// Save migrations by version. Each step upgrades raw data from version N to N+1.
import { SAVE_VERSION } from '../constants';

type RawState = Record<string, unknown>;

const MIGRATIONS: Record<number, (raw: RawState) => RawState> = {
  // Example for the future: 1: (raw) => ({ ...raw, newField: 0 }),
};

export function migrate(raw: RawState, fromVersion: number): RawState | null {
  if (fromVersion > SAVE_VERSION || fromVersion < 1) return null;
  let data = raw;
  for (let v = fromVersion; v < SAVE_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) return null;
    data = step(data);
  }
  return data;
}
