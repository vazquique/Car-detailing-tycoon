// Debug helpers (only active with ?debug=1). Also used by the screenshot script.
import { engine } from '../store/gameStore';
import { useUi } from '../store/uiStore';
import { CALENDAR } from '../game/data/economy';
import { EQUIPMENT } from '../game/data/equipment';
import { LOCATIONS } from '../game/data/locations';
import { addEffect } from '../game/sim/events';
import { spawnVip, spawnWalkIn } from '../game/sim/arrivals';
import { createOffer } from '../game/sim/contracts';
import { refreshCandidates } from '../game/sim/staff';
import { createInitialState, newBay } from '../game/sim/newGame';
import { autoAssignWorkers } from '../game/sim/bays';
import { clearSave } from '../game/save/save';
import type { GameState } from '../game/types';

export const DEBUG =
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('debug') === '1';

function mutate(fn: (s: GameState) => void): void {
  fn(engine.state);
  engine.publish();
}

/** Debug helpers, also used by the screenshot script. */
export const debugApi = {
  addMoney: (v: number) => mutate((s) => (s.money += v)),
  advance: (seconds: number) => engine.advance(seconds),
  speed: (v: number) => (engine.speed = v),
  setLocation: (loc: number) =>
    mutate((s) => {
      s.location = Math.max(0, Math.min(LOCATIONS.length - 1, loc));
    }),
  unlockAll: () =>
    mutate((s) => {
      s.location = LOCATIONS.length - 1;
      for (const e of EQUIPMENT) s.equipment[e.id] = Math.max(1, s.equipment[e.id]);
      s.reputation = 4.8;
      s.money += 5e7;
    }),
  fillBays: (workers: number, level = 5) =>
    mutate((s) => {
      const max = LOCATIONS[s.location]?.maxBays ?? 2;
      while (s.bays.length < max) s.bays.push(newBay(s.nextId++, false));
      for (let i = 0; i < workers; i++) {
        refreshCandidates(s);
        const c = s.candidates[0];
        if (!c) break;
        c.level = level;
        s.workers.push(c);
      }
      refreshCandidates(s);
      autoAssignWorkers(s);
    }),
  fillQueue: (n: number) =>
    mutate((s) => {
      for (let i = 0; i < n; i++) spawnWalkIn(s);
    }),
  /** Prepares a showcase state (used by the screenshot script). */
  stage: (name: 'garage' | 'nave' | 'studio' | 'franchise') =>
    mutate((s) => {
      const loc = name === 'garage' ? 0 : name === 'nave' ? 2 : 3;
      s.location = loc;
      const owned: Record<number, string[]> = {
        0: ['pressureWasher', 'vacuum', 'wheelKit'],
        2: [
          'pressureWasher',
          'vacuum',
          'wheelKit',
          'waxKit',
          'foamCannon',
          'engineKit',
          'headlightKit',
          'extractor',
          'clayKit',
          'orbitalPolisher',
          'rotaryPolisher',
          'inspectionLamps',
          'curingBooth',
        ],
        3: EQUIPMENT.map((e) => e.id),
      };
      for (const id of owned[loc] ?? []) {
        const e = EQUIPMENT.find((x) => x.id === id);
        if (e) s.equipment[e.id] = Math.max(1, s.equipment[e.id]);
      }
      s.reputation = name === 'garage' ? 3.4 : 4.7;
      s.money = name === 'garage' ? 860 : name === 'nave' ? 2_450_000 : 31_800_000;
      s.minute = 13 * 60 + 20;
      const max = LOCATIONS[loc]?.maxBays ?? 2;
      while (s.bays.length < max) s.bays.push(newBay(s.nextId++, false));
      const want = max - 1 - s.workers.length;
      for (let i = 0; i < want; i++) {
        refreshCandidates(s);
        const c = s.candidates[0];
        if (!c) break;
        c.level = name === 'garage' ? 1 : 4 + (i % 6);
        s.workers.push(c);
      }
      refreshCandidates(s);
      autoAssignWorkers(s);
      s.bays.forEach((b, i) => (b.level = Math.min(10, 1 + ((loc * 2 + i) % 6))));
      if (name === 'franchise') s.runStats.totalEarned = 25_000_000;
      for (let i = 0; i < 12; i++) spawnWalkIn(s);
    }),
  rain: () => mutate((s) => (s.weather = 'rain')),
  waterCut: () => mutate((s) => addEffect(s, 'waterCut', 120)),
  vip: () => mutate((s) => spawnVip(s)),
  viral: () => mutate((s) => addEffect(s, 'viral', 120)),
  inspector: () => mutate((s) => (s.planned.inspector = s.minute)),
  offer: () =>
    mutate((s) => {
      const o = createOffer(s);
      if (o) s.contractOffers.push(o);
    }),
  endDay: () => mutate((s) => (s.minute = CALENDAR.closeMinute - 1)),
  reset: () => {
    clearSave();
    engine.replace(createInitialState(Date.now() | 0));
  },
};

declare global {
  interface Window {
    __cdt?: { engine: typeof engine; debug: typeof debugApi; ui: typeof useUi };
  }
}

export function exposeDebug(): void {
  if (DEBUG) window.__cdt = { engine, debug: debugApi, ui: useUi };
}
