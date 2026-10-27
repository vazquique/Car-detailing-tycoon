// Saving and loading the game. Every storage access is wrapped in try/catch.
import type { GameState } from '../types';
import { SAVE_BACKUP_KEY, SAVE_KEY, SAVE_VERSION } from '../constants';
import { createInitialState } from '../sim/newGame';
import { migrate } from './migrations';

interface SaveFile {
  version: number;
  savedAt: number;
  state: GameState;
}

export function serialize(s: GameState, now = Date.now()): string {
  const state: GameState = { ...s, fx: [], savedAt: now };
  const file: SaveFile = { version: SAVE_VERSION, savedAt: now, state };
  return JSON.stringify(file);
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Fills missing keys of plain records (new equipment, upgrades...) from the defaults. */
function fillRecord(target: unknown, defaults: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...defaults };
  if (isObj(target)) {
    for (const k of Object.keys(defaults)) {
      const v = target[k];
      if (typeof v === typeof defaults[k]) out[k] = v;
    }
  }
  return out;
}

/** Checks the shape of a state and repairs safe defaults. Returns null if it is unusable. */
export function validateState(raw: unknown): GameState | null {
  if (!isObj(raw)) return null;
  const required = ['money', 'reputation', 'day', 'minute', 'location', 'rng'];
  for (const k of required) if (!isNum(raw[k])) return null;
  const arrays = ['bays', 'queue', 'workers', 'candidates', 'reviews', 'achievements'];
  for (const k of arrays) if (!Array.isArray(raw[k])) return null;
  if ((raw.bays as unknown[]).length === 0) return null;

  const defaults = createInitialState(1);
  const merged: Record<string, unknown> = { ...defaults, ...raw };
  merged.equipment = fillRecord(raw.equipment, defaults.equipment);
  merged.upgrades = fillRecord(raw.upgrades, defaults.upgrades);
  merged.prices = fillRecord(raw.prices, defaults.prices);
  merged.marketingOwned = fillRecord(raw.marketingOwned, defaults.marketingOwned);
  merged.support = fillRecord(raw.support, defaults.support);
  merged.stats = fillRecord(raw.stats, { ...defaults.stats });
  merged.runStats = fillRecord(raw.runStats, { ...defaults.runStats });
  merged.dayStats = fillRecord(raw.dayStats, { ...defaults.dayStats });
  merged.planned = fillRecord(raw.planned, defaults.planned);
  const prestige = fillRecord(raw.prestige, { ...defaults.prestige });
  prestige.nodes = fillRecord(
    isObj(raw.prestige) ? raw.prestige.nodes : undefined,
    defaults.prestige.nodes,
  );
  merged.prestige = prestige;
  merged.fx = [];
  if (!Array.isArray(merged.incomeRing)) merged.incomeRing = defaults.incomeRing;
  const s = merged as unknown as GameState;
  if (s.reputation < 1 || s.reputation > 5) s.reputation = Math.min(5, Math.max(1, s.reputation));
  return s;
}

export function deserialize(text: string): GameState | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isObj(parsed) || !isNum(parsed.version) || !isObj(parsed.state)) return null;
    const migrated = migrate(parsed.state, parsed.version);
    if (!migrated) return null;
    const s = validateState(migrated);
    if (s && isNum(parsed.savedAt)) s.savedAt = parsed.savedAt;
    return s;
  } catch {
    return null;
  }
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function storage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function saveGame(s: GameState, store: StorageLike | null = storage()): boolean {
  if (!store) return false;
  try {
    store.setItem(SAVE_KEY, serialize(s));
    return true;
  } catch {
    return false;
  }
}

export interface LoadResult {
  state: GameState | null;
  corrupt: boolean;
}

export function loadGame(store: StorageLike | null = storage()): LoadResult {
  if (!store) return { state: null, corrupt: false };
  let text: string | null;
  try {
    text = store.getItem(SAVE_KEY);
  } catch {
    return { state: null, corrupt: false };
  }
  if (!text) return { state: null, corrupt: false };
  const state = deserialize(text);
  if (state) return { state, corrupt: false };
  try {
    store.setItem(SAVE_BACKUP_KEY, text);
    store.removeItem(SAVE_KEY);
  } catch {
    // Storage full or blocked: nothing else we can do.
  }
  return { state: null, corrupt: true };
}

export function clearSave(store: StorageLike | null = storage()): void {
  try {
    store?.removeItem(SAVE_KEY);
  } catch {
    // Ignore blocked storage.
  }
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(b64: string): string {
  const bin = atob(b64.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function exportSave(s: GameState): string {
  return toBase64(serialize(s));
}

export function importSave(code: string): GameState | null {
  try {
    return deserialize(fromBase64(code));
  } catch {
    return null;
  }
}
