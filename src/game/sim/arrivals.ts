// Walk-in arrivals, VIPs, queue insertion and patience.
import type { Customer, GameState } from '../types';
import { CALENDAR, ECONOMY } from '../data/economy';
import { EVENTS } from '../data/events';
import { INFLUENCER_SPORT_SHARE, MARKETING_BY_ID } from '../data/marketing';
import { chance, random } from '../rng';
import {
  arrivalRate,
  isVehicleUnlocked,
  marketingFactor,
  queueCapacity,
  vipChancePerHour,
} from './economy';
import { createCustomer, nextLockedService } from './customers';
import { applyStars, addReview } from './reputation';
import { hasEffect } from './events';

/** Inserts a customer in line respecting priority. Returns false if the line is full. */
export function enqueue(s: GameState, c: Customer): boolean {
  if (s.queue.length >= queueCapacity(s)) return false;
  if (c.contractId !== null) {
    let i = 0;
    while (i < s.queue.length && s.queue[i]?.contractId !== null) i++;
    s.queue.splice(i, 0, c);
  } else if (c.vip) {
    let i = 0;
    while (i < s.queue.length && (s.queue[i]?.contractId !== null || s.queue[i]?.vip)) i++;
    s.queue.splice(i, 0, c);
  } else {
    s.queue.push(c);
  }
  s.fx.push({ kind: 'arrive', customerId: c.id });
  return true;
}

function loseCustomer(s: GameState): void {
  s.dayStats.lost++;
  s.stats.customersLost++;
  s.runStats.customersLost++;
  s.fx.push({ kind: 'honk' });
}

export function spawnWalkIn(s: GameState): void {
  if (chance(s, ECONOMY.hintChance)) {
    const wanted = nextLockedService(s);
    if (wanted) {
      if (s.hintCooldown <= 0) {
        s.hintCooldown = ECONOMY.hintCooldown;
        s.fx.push({ kind: 'hint', service: wanted });
      }
      return;
    }
  }
  let fromInfluencer = false;
  let vehicle: Customer['vehicle'] | undefined;
  if (hasEffect(s, 'influencer')) {
    const share = MARKETING_BY_ID.influencer.arrivals / marketingFactor(s);
    if (random(s) < share) {
      fromInfluencer = true;
      if (isVehicleUnlocked(s, 'sport') && chance(s, INFLUENCER_SPORT_SHARE)) vehicle = 'sport';
    }
  }
  const c = createCustomer(s, vehicle ? { vehicle, fromInfluencer } : { fromInfluencer });
  if (c.services.length === 0) return;
  if (!enqueue(s, c)) loseCustomer(s);
}

export function spawnVip(s: GameState): void {
  const vehicle = chance(s, 0.5) ? 'luxury' : 'sport';
  const c = createCustomer(s, { vehicle, vip: true });
  if (c.services.length === 0) return;
  if (enqueue(s, c)) s.fx.push({ kind: 'vip', customerId: c.id });
  else loseCustomer(s);
}

export function updateArrivals(s: GameState, dt: number): void {
  if (s.minute >= CALENDAR.lastArrivalMinute) return;
  if (random(s) < arrivalRate(s) * dt) spawnWalkIn(s);

  if (s.location >= EVENTS.vip.minLocation) {
    s.vipTimer -= dt * CALENDAR.minutesPerSecond;
    if (s.vipTimer <= 0) {
      s.vipTimer += 60;
      if (random(s) < vipChancePerHour(s)) spawnVip(s);
    }
  }
}

/** Ticks patience for walk-ins in line; angry customers leave. */
export function updatePatience(s: GameState, dt: number): void {
  let removed = false;
  for (const c of s.queue) {
    if (c.contractId !== null) continue;
    c.waited += dt;
    if (c.waited >= c.patience) removed = true;
  }
  if (!removed) return;
  const angry = s.queue.filter((c) => c.contractId === null && c.waited >= c.patience);
  s.queue = s.queue.filter((c) => !(c.contractId === null && c.waited >= c.patience));
  for (const c of angry) customerLeftAngry(s, c);
}

export function customerLeftAngry(s: GameState, c: Customer): void {
  s.dayStats.lost++;
  s.dayStats.angry++;
  s.stats.customersLost++;
  s.stats.angryCustomers++;
  s.runStats.customersLost++;
  s.runStats.angryCustomers++;
  applyStars(s, 1);
  if (random(s) < ECONOMY.reviewChance) addReview(s, c, 1);
  s.fx.push({ kind: 'angry', customer: c });
}
