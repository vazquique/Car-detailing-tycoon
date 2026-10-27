// Player price per service, as a multiplier of the base price.
import type { GameState, ServiceId } from '../types';
import { ECONOMY } from '../data/economy';
import { clamp } from '../sim/economy';
import { produce } from './produce';

export function snapPrice(mult: number): number {
  const snapped = Math.round(mult / ECONOMY.priceStep) * ECONOMY.priceStep;
  return Math.round(clamp(ECONOMY.priceMin, ECONOMY.priceMax, snapped) * 100) / 100;
}

export function setPrice(s: GameState, p: { service: ServiceId; mult: number }): GameState {
  return produce(s, (d) => {
    const next = snapPrice(p.mult);
    if (d.prices[p.service] === next) return false;
    d.prices[p.service] = next;
    return true;
  });
}
