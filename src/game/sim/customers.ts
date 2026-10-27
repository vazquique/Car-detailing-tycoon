// Customer generation: vehicle, dirt, requested services, name and look.
import type { Customer, DirtLevel, GameState, ServiceId, VehicleId } from '../types';
import { ECONOMY } from '../data/economy';
import { SERVICES, SERVICE_BY_ID } from '../data/services';
import { VEHICLES, VEHICLE_BY_ID, DIRT } from '../data/vehicles';
import { CAR_MODELS } from '../data/carModels';
import { CUSTOMER_FIRST_NAMES, LAST_INITIALS } from '../data/names';
import { CAR_COLORS, CLASSIC_COLORS } from '../palette';
import { RECEPTIONIST } from '../data/staff';
import { chance, pick, random, weightedPick } from '../rng';
import {
  canDoServiceNow,
  isServiceUnlocked,
  isVehicleUnlocked,
  patienceFor,
  servicePriceFactor,
} from './economy';

/** Fleet cars never run out of patience (finite so it survives JSON). */
export const CONTRACT_PATIENCE = 1e9;

export function customerName(s: GameState): string {
  return `${pick(s, CUSTOMER_FIRST_NAMES)} ${pick(s, LAST_INITIALS)}.`;
}

export function pickVehicle(s: GameState): VehicleId {
  const options = VEHICLES.filter((v) => isVehicleUnlocked(s, v.id));
  return weightedPick(s, options, (v) => v.weight).id;
}

export function pickDirt(s: GameState): DirtLevel {
  const dust = s.weather === 'dust';
  const idx = weightedPick(
    s,
    [0, 1, 2] as const,
    (i) => (dust ? DIRT[i]?.dustWeight : DIRT[i]?.weight) ?? 0,
  );
  return idx;
}

/** Services a walk-in can order right now (unlocked and possible today). */
export function orderableServices(s: GameState): ServiceId[] {
  return SERVICES.filter((d) => isServiceUnlocked(s, d.id) && canDoServiceNow(s, d.id)).map(
    (d) => d.id,
  );
}

export function pickServices(s: GameState, vehicle: VehicleId): ServiceId[] {
  const available = orderableServices(s);
  if (available.length === 0) return [];
  const lux = VEHICLE_BY_ID[vehicle].luxury;
  const counts = ECONOMY.serviceCountWeights.map((w, i) => ({
    n: i + 1,
    w: w * (1 + lux * i * 0.8),
  }));
  let count = Math.min(available.length, weightedPick(s, counts, (c) => c.w).n);
  const chosen: ServiceId[] = [];
  if (available.includes('exterior') && chance(s, ECONOMY.exteriorChance)) {
    chosen.push('exterior');
    count--;
  }
  const pool = available.filter((id) => !chosen.includes(id));
  while (count > 0 && pool.length > 0) {
    const id = weightedPick(s, pool, (sid) => {
      const def = SERVICE_BY_ID[sid];
      return def.demand * (1 + lux * def.tier * 1.2) * servicePriceFactor(s, sid);
    });
    chosen.push(id);
    pool.splice(pool.indexOf(id), 1);
    count--;
  }
  if (chosen.length === 0) {
    const first = available[0];
    if (first) chosen.push(first);
  }
  return sortServices(chosen);
}

export function sortServices(list: ServiceId[]): ServiceId[] {
  const order = SERVICES.map((d) => d.id);
  return [...list].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export interface CustomerOptions {
  vehicle?: VehicleId;
  services?: ServiceId[];
  vip?: boolean;
  contractId?: number | null;
  fromInfluencer?: boolean;
}

export function createCustomer(s: GameState, opts: CustomerOptions = {}): Customer {
  const vehicle = opts.vehicle ?? pickVehicle(s);
  const services = opts.services ? sortServices(opts.services) : pickServices(s, vehicle);
  const vip = opts.vip ?? false;
  const contractId = opts.contractId ?? null;
  const color = vehicle === 'classic' ? pick(s, CLASSIC_COLORS) : pick(s, CAR_COLORS);
  const c: Customer = {
    id: s.nextId++,
    name: customerName(s),
    vehicle,
    model: pick(s, CAR_MODELS[vehicle]),
    color,
    dirt: pickDirt(s),
    services,
    patience: contractId !== null ? CONTRACT_PATIENCE : patienceFor(s, vip),
    waited: 0,
    vip,
    contractId,
    seed: Math.floor(random(s) * 1e9),
    upsold: false,
    fromInfluencer: opts.fromInfluencer ?? false,
  };
  if (contractId === null && s.support.receptionist) tryUpsell(s, c);
  return c;
}

/** The receptionist may sell one extra service. */
function tryUpsell(s: GameState, c: Customer): void {
  if (c.services.length >= 4 || !chance(s, RECEPTIONIST.upsellChance)) return;
  const extra = orderableServices(s).filter((id) => !c.services.includes(id));
  if (extra.length === 0) return;
  const id = weightedPick(s, extra, (sid) => SERVICE_BY_ID[sid].demand);
  c.services = sortServices([...c.services, id]);
  c.upsold = true;
}

/** Cheapest service the player doesn't offer yet (for hints). */
export function nextLockedService(s: GameState): ServiceId | null {
  for (const d of SERVICES) {
    if (!isServiceUnlocked(s, d.id) && s.location >= d.minLocation) return d.id;
  }
  return null;
}
