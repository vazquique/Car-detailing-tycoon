// Paid courses: a worker goes up one level instantly.
import type { GameState } from '../types';
import { STAFF } from '../data/staff';
import { courseCost } from '../sim/staff';
import { produce, spend } from './produce';

export function trainWorker(s: GameState, p: { workerId: number }): GameState {
  return produce(s, (d) => {
    const w = d.workers.find((x) => x.id === p.workerId);
    if (!w || w.level >= STAFF.maxLevel) return false;
    if (!spend(d, courseCost(w.level))) return false;
    w.level++;
    w.xp = 0;
    d.fx.push({ kind: 'levelUp', workerId: w.id });
    return true;
  });
}
