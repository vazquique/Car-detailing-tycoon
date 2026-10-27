// Derived values for the UI. Pure functions over a state snapshot.
import type { GameState, ServiceId } from '../game/types';
import { SERVICES, SERVICE_BY_ID } from '../game/data/services';
import { EQUIPMENT } from '../game/data/equipment';
import { UPGRADES } from '../game/data/upgrades';
import { MARKETING } from '../game/data/marketing';
import { LOCATIONS } from '../game/data/locations';
import { incomePerSecond } from '../game/sim/bays';
import {
  averageArrivalRate,
  playerPrice,
  isServiceUnlocked,
  servicePriceFactor,
  workerLevel,
} from '../game/sim/economy';
import {
  equipmentBlock,
  equipmentCost,
  upgradeCost,
  upgradeMaxed,
  bayCost,
  maxBays,
} from '../game/actions/purchase';
import { marketingCost, marketingStatus } from '../game/actions/marketing';
import { moveCost, nextLocation } from '../game/actions/relocate';
import { canFranchise } from '../game/actions/prestige';
import { autoAssignTargets } from './selectorsHelpers';
import { CALENDAR, ECONOMY } from '../game/data/economy';
import { VEHICLE_BY_ID } from '../game/data/vehicles';
import { contractsAvailable } from '../game/sim/contracts';

export function incomePerMinute(s: GameState): number {
  return incomePerSecond(s, 120) * 60;
}

export function canBuy(s: GameState, cost: number): boolean {
  return s.money >= 0 && s.money >= cost;
}

/** Ids of things you can afford right now, per tab (for the red dots). */
export function affordableKeys(s: GameState): Record<string, string[]> {
  const upgrades: string[] = [];
  for (const e of EQUIPMENT) {
    if (equipmentBlock(s, e.id) === null && canBuy(s, equipmentCost(s, e.id)))
      upgrades.push(`e:${e.id}:${s.equipment[e.id]}`);
  }
  for (const u of UPGRADES) {
    if (!upgradeMaxed(s, u.id) && s.location >= u.minLocation && canBuy(s, upgradeCost(s, u.id)))
      upgrades.push(`u:${u.id}:${s.upgrades[u.id]}`);
  }
  const staff: string[] = [];
  const freeBay = autoAssignTargets(s) > 0;
  if (freeBay) for (const c of s.candidates) if (canBuy(s, c.hireCost)) staff.push(`c:${c.id}`);
  const marketing: string[] = [];
  for (const m of MARKETING) {
    if (
      marketingStatus(s, m.id) === 'available' &&
      m.kind !== 'subscription' &&
      canBuy(s, marketingCost(s, m.id))
    )
      marketing.push(`m:${m.id}`);
  }
  const workshop: string[] = s.contractOffers.map((o) => `o:${o.id}`);
  if (s.bays.length < maxBays(s) && canBuy(s, bayCost(s))) workshop.push(`b:${s.bays.length}`);
  const services: string[] = SERVICES.filter((d) => isServiceUnlocked(s, d.id)).map(
    (d) => `s:${d.id}`,
  );
  const business: string[] = [...s.achievements.map((a) => `a:${a}`)];
  const next = nextLocation(s);
  if (next !== null && canBuy(s, moveCost(next))) business.push(`l:${next}`);
  if (canFranchise(s)) business.push('franchise');
  return { workshop, services, staff, upgrades, marketing, business };
}

export type Demand = 'high' | 'mid' | 'low';

export function demandOf(s: GameState, id: ServiceId): Demand {
  const f = servicePriceFactor(s, id);
  if (f >= 1.05) return 'high';
  if (f >= 0.75) return 'mid';
  return 'low';
}

/** Rough income per game hour from one service at the current price. */
export function serviceIncomePerHour(s: GameState, id: ServiceId): number {
  const def = SERVICE_BY_ID[id];
  const rate = averageArrivalRate(s);
  let weight = 0;
  for (const d of SERVICES) if (isServiceUnlocked(s, d.id)) weight += d.demand;
  // Customers order about two services each, so a service's share of orders is roughly doubled.
  const share = weight > 0 ? Math.min(1, (def.demand / weight) * 2) : 0;
  const price = playerPrice(s, id) * VEHICLE_BY_ID.sedan.priceMult;
  const pay = ECONOMY.payBase + ECONOMY.payQuality * ECONOMY.qualityBase;
  // One game hour = 20 real seconds.
  const secondsPerGameHour = 60 / CALENDAR.minutesPerSecond;
  return rate * secondsPerGameHour * share * price * pay * servicePriceFactor(s, id);
}

export function locationArrivalSeconds(index: number): number {
  return LOCATIONS[index]?.arrivalSeconds ?? 0;
}

export function workerCanDoService(level: number, id: ServiceId): boolean {
  return SERVICE_BY_ID[id].minLevel <= level;
}

export { workerLevel, contractsAvailable };
