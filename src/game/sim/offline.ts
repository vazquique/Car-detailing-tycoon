// Offline progress: money (and half XP) for the time away.
import type { GameState } from '../types';
import { OFFLINE } from '../data/economy';
import { MANAGER, TRAIT_BY_ID } from '../data/staff';
import { PRESTIGE } from '../data/prestige';
import { incomePerSecond } from './bays';
import { giveXp } from './staff';

export interface OfflineResult {
  /** Real seconds away. */
  away: number;
  /** Seconds that counted (after the cap). */
  counted: number;
  efficiency: number;
  money: number;
  capHours: number;
}

export function offlineCapHours(s: GameState): number {
  return (
    OFFLINE.baseCapHours +
    (s.support.manager ? MANAGER.offlineCapHours : 0) +
    PRESTIGE.trustedOfflineHours * s.prestige.nodes.trustedPartner
  );
}

export function offlineEfficiency(s: GameState): number {
  return Math.min(
    OFFLINE.maxEfficiency,
    OFFLINE.baseEfficiency +
      (s.support.manager ? MANAGER.offlineEfficiency : 0) +
      PRESTIGE.trustedOfflineEfficiency * s.prestige.nodes.trustedPartner,
  );
}

export function computeOffline(s: GameState, secondsAway: number): OfflineResult {
  const capHours = offlineCapHours(s);
  const counted = Math.max(0, Math.min(secondsAway, capHours * 3600));
  const efficiency = offlineEfficiency(s);
  const rate = Math.max(0, incomePerSecond(s, OFFLINE.historySeconds));
  return { away: secondsAway, counted, efficiency, money: rate * counted * efficiency, capHours };
}

/** Applies offline gains: money and half the recent XP rate. Calendar does not move. */
export function applyOffline(s: GameState, r: OfflineResult): void {
  s.money += r.money;
  s.stats.totalEarned += r.money;
  s.runStats.totalEarned += r.money;
  for (const w of s.workers) {
    // xpRate already includes the trait bonus, so undo it before giveXp applies it.
    giveXp(s, w, (w.xpRate * r.counted * OFFLINE.xpShare) / TRAIT_BY_ID[w.trait].xpMult, false);
  }
}
