import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/game/sim/newGame';
import { runTicks } from '../src/game/sim/tick';
import {
  serialize,
  deserialize,
  exportSave,
  importSave,
  saveGame,
  loadGame,
  type StorageLike,
} from '../src/game/save/save';
import { SAVE_BACKUP_KEY, SAVE_KEY } from '../src/game/constants';

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('save and load', () => {
  it('round-trips the state', () => {
    const s = createInitialState(9);
    runTicks(s, 120);
    const back = deserialize(serialize(s));
    expect(back).not.toBeNull();
    expect(back?.money).toBe(s.money);
    expect(back?.stats.carsServed).toBe(s.stats.carsServed);
    expect(back?.bays.length).toBe(s.bays.length);
  });

  it('a loaded game keeps simulating like the original', () => {
    const s = createInitialState(9);
    runTicks(s, 60);
    const back = deserialize(serialize(s));
    expect(back).not.toBeNull();
    if (!back) return;
    runTicks(s, 60);
    runTicks(back, 60);
    expect(back.money).toBeCloseTo(s.money);
  });

  it('export/import works with accents and rejects garbage', () => {
    const s = createInitialState(9);
    s.reviews.push({
      id: 1,
      name: 'Óscar Ñ.',
      model: 'Colibrí',
      vehicle: 'compact',
      stars: 5,
      text: '¡Increíble!',
      day: 1,
    });
    const code = exportSave(s);
    expect(importSave(code)?.reviews[0]?.name).toBe('Óscar Ñ.');
    expect(importSave('esto no es una partida')).toBeNull();
    expect(importSave(btoa('{"version":1,"state":{"money":"x"}}'))).toBeNull();
  });

  it('a corrupt save is backed up and a new game starts', () => {
    const store = memoryStorage();
    store.setItem(SAVE_KEY, '{roto');
    const r = loadGame(store);
    expect(r.state).toBeNull();
    expect(r.corrupt).toBe(true);
    expect(store.getItem(SAVE_BACKUP_KEY)).toBe('{roto');
    expect(store.getItem(SAVE_KEY)).toBeNull();
  });

  it('saves to storage and loads back', () => {
    const store = memoryStorage();
    const s = createInitialState(4);
    s.money = 1234;
    expect(saveGame(s, store)).toBe(true);
    expect(loadGame(store).state?.money).toBe(1234);
  });

  it('fills in fields missing from older saves', () => {
    const s = createInitialState(4);
    const raw = JSON.parse(serialize(s)) as { state: Record<string, unknown> };
    delete (raw.state.upgrades as Record<string, unknown>).permits;
    const back = deserialize(JSON.stringify(raw));
    expect(back?.upgrades.permits).toBe(0);
  });
});
