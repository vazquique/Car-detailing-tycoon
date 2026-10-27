// Fleet contracts: offers, accepted contracts, spreading their cars and deadlines.
import type { ActiveContract, ContractOffer, GameState } from '../types';
import { CALENDAR } from '../data/economy';
import { CONTRACTS, CONTRACT_TEMPLATES, type ContractTemplate } from '../data/contracts';
import { CONTRACT_CLIENTS } from '../data/names';
import { VEHICLE_BY_ID } from '../data/vehicles';
import { PRESTIGE } from '../data/prestige';
import { pick } from '../rng';
import { fairOrderValue, isServiceUnlocked, queueCapacity } from './economy';
import { adjustReputation } from './reputation';
import { createCustomer } from './customers';
import { enqueue } from './arrivals';
import { arrivalSeconds } from './calendar';

export function contractsAvailable(s: GameState): boolean {
  return s.location >= CONTRACTS.minLocation || s.prestige.nodes.fleetContacts > 0;
}

/** Vehicles are unlocked for contracts by location (reputation is not needed for fleets). */
function templateFeasible(s: GameState, t: ContractTemplate): boolean {
  const v = VEHICLE_BY_ID[t.vehicle];
  if (s.location < v.minLocation) return false;
  if (t.vehicle === 'classic' && !(s.reputation >= v.minRep || s.prestige.expoUsed)) return false;
  return t.services.every((id) => isServiceUnlocked(s, id));
}

export function contractPayment(s: GameState, t: ContractTemplate, count: number): number {
  const fleet = 1 + PRESTIGE.fleetPay * s.prestige.nodes.fleetContacts;
  const value = fairOrderValue(s, t.vehicle, t.services) * count * CONTRACTS.payMult * fleet;
  return Math.round(value / 10) * 10;
}

export function createOffer(s: GameState): ContractOffer | null {
  const options = CONTRACT_TEMPLATES.filter((t) => templateFeasible(s, t));
  if (options.length === 0) return null;
  const t = pick(s, options);
  const scale = CONTRACTS.countScale[s.location] ?? 1;
  const count = Math.max(2, Math.round(t.count * scale));
  return {
    id: s.nextId++,
    templateId: t.id,
    client: CONTRACT_CLIENTS[t.id] ?? t.id,
    vehicle: t.vehicle,
    count,
    services: [...t.services],
    days: t.days,
    payment: contractPayment(s, t, count),
    repBonus: CONTRACTS.repSuccess,
    expiresDay: s.day + CONTRACTS.offerLifetimeDays,
  };
}

/** Called at the start of each day. */
export function dailyContractOffers(s: GameState): void {
  s.contractOffers = s.contractOffers.filter((o) => o.expiresDay >= s.day);
  if (!contractsAvailable(s)) return;
  if (s.day < s.nextOfferDay) return;
  s.nextOfferDay = s.day + CONTRACTS.offerEveryDays;
  if (s.contractOffers.length >= CONTRACTS.maxOffers) return;
  const offer = createOffer(s);
  if (offer) {
    s.contractOffers.push(offer);
    s.fx.push({ kind: 'contractOffer' });
  }
}

export function spawnInterval(c: ContractOffer): number {
  return (c.days * arrivalSeconds() * CONTRACTS.spreadFraction) / c.count;
}

export function activateContract(s: GameState, offer: ContractOffer): ActiveContract {
  return {
    ...offer,
    acceptedDay: s.day,
    deadlineDay: s.day + offer.days - 1,
    spawned: 0,
    done: 0,
    spawnTimer: 0,
  };
}

export function updateContracts(s: GameState, dt: number): void {
  if (s.minute >= CALENDAR.lastArrivalMinute) return;
  for (const k of s.contracts) {
    if (k.spawned >= k.count) continue;
    k.spawnTimer -= dt;
    if (k.spawnTimer > 0) continue;
    if (s.queue.length >= queueCapacity(s)) continue;
    const car = createCustomer(s, { vehicle: k.vehicle, services: k.services, contractId: k.id });
    if (enqueue(s, car)) {
      k.spawned++;
      k.spawnTimer = spawnInterval(k);
    }
  }
}

export function completeContractCar(s: GameState, k: ActiveContract): void {
  k.done++;
  if (k.done < k.count) return;
  s.money += k.payment;
  s.dayStats.revenue += k.payment;
  s.stats.totalEarned += k.payment;
  s.runStats.totalEarned += k.payment;
  s.stats.contractsDone++;
  s.runStats.contractsDone++;
  adjustReputation(s, k.repBonus);
  s.contracts = s.contracts.filter((c) => c.id !== k.id);
  s.fx.push({ kind: 'contractDone', id: k.id, success: true, client: k.client });
}

/** At closing: contract cars still in line come back tomorrow; overdue contracts fail. */
export function closeDayContracts(s: GameState): void {
  for (const c of s.queue) {
    if (c.contractId === null) continue;
    const k = s.contracts.find((x) => x.id === c.contractId);
    if (k) k.spawned = Math.max(k.done, k.spawned - 1);
  }
  const failed = s.contracts.filter((k) => k.deadlineDay <= s.day && k.done < k.count);
  for (const k of failed) {
    adjustReputation(s, -CONTRACTS.repFail);
    s.stats.contractsFailed++;
    s.runStats.contractsFailed++;
    s.fx.push({ kind: 'contractDone', id: k.id, success: false, client: k.client });
  }
  s.contracts = s.contracts.filter((k) => !failed.includes(k));
  for (const k of s.contracts) k.spawnTimer = 0;
}
