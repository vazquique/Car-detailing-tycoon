// Bays: worker assignment, picking customers, service progress, payment.
import type { Bay, Customer, GameState, Job, ServiceId, Worker } from '../types';
import { ECONOMY, XP } from '../data/economy';
import { EVENTS } from '../data/events';
import { SERVICE_BY_ID } from '../data/services';
import { INCOME_RING_SECONDS } from '../constants';
import { random, randRange } from '../rng';
import {
  bayWorker,
  canWorkerDo,
  chargedPrice,
  clamp,
  expectedQuality,
  incomeMult,
  managerBoost,
  perceivedValue,
  playerPrice,
  serviceDuration,
  tapPower,
  tipMultiplier,
} from './economy';
import { addReview, adjustReputation, applyStars } from './reputation';
import { giveXp } from './staff';
import { completeContractCar } from './contracts';

/** Puts unassigned workers into free bays. */
export function autoAssignWorkers(s: GameState): void {
  const assigned = new Set<number>();
  for (const b of s.bays) if (b.workerId !== null) assigned.add(b.workerId);
  for (const w of s.workers) {
    if (assigned.has(w.id)) continue;
    const bay = s.bays.find((b) => !b.isOwner && b.workerId === null);
    if (!bay) return;
    bay.workerId = w.id;
    assigned.add(w.id);
  }
}

function doerOf(s: GameState, bay: Bay): Worker | null | undefined {
  if (bay.isOwner) return null;
  const w = bayWorker(s, bay);
  return w ?? undefined;
}

/** Hand services first for the owner bay, so the mini-game covers them in order. */
export function ownerServiceOrder(services: ServiceId[]): ServiceId[] {
  const hand = services.filter((id) => SERVICE_BY_ID[id].handSteps.length > 0);
  const rest = services.filter((id) => SERVICE_BY_ID[id].handSteps.length === 0);
  return [...hand, ...rest];
}

export function newJob(s: GameState, bay: Bay, c: Customer, w: Worker | null): Job {
  const first = c.services[0];
  return {
    customer: c,
    serviceIndex: 0,
    progress: 0,
    duration: first ? serviceDuration(s, c, first, w, bay.level) : 1,
    qualitySum: 0,
    qualityWeight: 0,
    waitUsed: c.waited,
    handActive: false,
    handDone: false,
    handQuality: 0,
    lastDelta: 0,
    age: 0,
  };
}

function tryStartJob(s: GameState, bay: Bay): void {
  const w = doerOf(s, bay);
  if (w === undefined) return;
  const idx = s.queue.findIndex((c) => canWorkerDo(s, w, c));
  if (idx < 0) return;
  const c = s.queue[idx];
  if (!c) return;
  s.queue.splice(idx, 1);
  if (bay.isOwner) c.services = ownerServiceOrder(c.services);
  bay.job = newJob(s, bay, c, w);
  bay.idleTime = 0;
  const first = c.services[0];
  if (first) s.fx.push({ kind: 'serviceStep', bayId: bay.id, service: first });
}

function rollQuality(s: GameState, id: ServiceId, w: Worker | null): number {
  const noise = 1 + randRange(s, -ECONOMY.qualityNoise, ECONOMY.qualityNoise);
  return clamp(ECONOMY.qualityMin, ECONOMY.qualityMax, expectedQuality(s, id, w, false) * noise);
}

function addServiceQuality(s: GameState, job: Job, id: ServiceId, quality: number): void {
  const weight = Math.max(1, playerPrice(s, id));
  job.qualitySum += quality * weight;
  job.qualityWeight += weight;
}

/** Moves the job to its next service, or finishes it. Returns true if the job ended. */
function nextService(s: GameState, bay: Bay, job: Job, w: Worker | null): boolean {
  job.serviceIndex++;
  const next = job.customer.services[job.serviceIndex];
  if (!next) {
    finishJob(s, bay);
    return true;
  }
  job.duration = serviceDuration(s, job.customer, next, w, bay.level);
  s.fx.push({ kind: 'serviceStep', bayId: bay.id, service: next });
  return false;
}

function progressJob(s: GameState, bay: Bay, job: Job, dt: number): void {
  job.age += dt;
  if (bay.isOwner && job.handActive) {
    job.lastDelta = 0;
    return;
  }
  const w = doerOf(s, bay);
  if (w === undefined) {
    job.lastDelta = 0;
    return;
  }
  const delta = dt * (1 + managerBoost(s));
  job.progress += delta;
  job.lastDelta = delta;
  let guard = 0;
  while (bay.job === job && job.progress >= job.duration && guard++ < 8) {
    const id = job.customer.services[job.serviceIndex];
    if (!id) {
      finishJob(s, bay);
      return;
    }
    addServiceQuality(s, job, id, rollQuality(s, id, w));
    job.progress -= job.duration;
    if (nextService(s, bay, job, w)) return;
  }
}

/** Real seconds left for the job in a bay (without taps). */
export function jobTimeLeft(s: GameState, bay: Bay): number {
  const job = bay.job;
  if (!job) return 0;
  const w = bay.isOwner ? null : (bayWorker(s, bay) ?? null);
  const speed = 1 + managerBoost(s);
  let left = Math.max(0, job.duration - job.progress);
  for (let i = job.serviceIndex + 1; i < job.customer.services.length; i++) {
    const id = job.customer.services[i];
    if (id) left += serviceDuration(s, job.customer, id, w, bay.level);
  }
  return left / speed;
}

export function updateBays(s: GameState, dt: number): void {
  autoAssignWorkers(s);
  const decay = ECONOMY.maxTapsPerSecond * dt;
  for (const bay of s.bays) {
    bay.tapsThisSecond = Math.max(0, bay.tapsThisSecond - decay);
    if (bay.tapFlash > 0) bay.tapFlash = Math.max(0, bay.tapFlash - dt * 3);
    if (!bay.job) {
      bay.idleTime += dt;
      tryStartJob(s, bay);
    }
    if (bay.job) progressJob(s, bay, bay.job, dt);
  }
}

/** Speeds up a bay by tapping it. Returns true if the tap counted. */
export function tapBay(s: GameState, bayId: number): boolean {
  const bay = s.bays.find((b) => b.id === bayId);
  if (!bay || !bay.job) return false;
  if (bay.isOwner && bay.job.handActive) return false;
  if (!bay.isOwner && bay.workerId === null) return false;
  if (bay.tapsThisSecond >= ECONOMY.maxTapsPerSecond) return false;
  bay.tapsThisSecond += 1;
  bay.tapFlash = 1;
  bay.job.progress += tapPower(s);
  s.stats.taps++;
  s.runStats.taps++;
  return true;
}

/** Number of leading services in the job that are done by hand. */
export function handServiceCount(job: Job): number {
  let n = 0;
  for (let i = job.serviceIndex; i < job.customer.services.length; i++) {
    const id = job.customer.services[i];
    if (!id || SERVICE_BY_ID[id].handSteps.length === 0) break;
    n++;
  }
  return n;
}

export function canHandWash(s: GameState, bay: Bay): boolean {
  return (
    bay.isOwner && !!bay.job && !bay.job.handDone && handServiceCount(bay.job) > 0 && s.night <= 0
  );
}

/** Owner opens the scrub mini-game: the bay pauses its automatic progress. */
export function startHandWash(s: GameState, bayId: number): boolean {
  const bay = s.bays.find((b) => b.id === bayId);
  if (!bay || !bay.job || !canHandWash(s, bay)) return false;
  bay.job.handActive = true;
  return true;
}

/**
 * Owner finishes (or abandons) the mini-game.
 * `fraction` is the share of hand steps completed (0..1); `quality` the hand-wash quality.
 */
export function finishHandWash(
  s: GameState,
  bayId: number,
  fraction: number,
  quality: number,
): void {
  const bay = s.bays.find((b) => b.id === bayId);
  const job = bay?.job;
  if (!bay || !job || !job.handActive) return;
  job.handActive = false;
  job.handDone = true;
  const handCount = handServiceCount(job);
  const services = job.customer.services.slice(job.serviceIndex, job.serviceIndex + handCount);
  const steps = services.map((id) => SERVICE_BY_ID[id].handSteps.length);
  const totalSteps = steps.reduce((a, b) => a + b, 0);
  let stepsDone = clamp(0, totalSteps, fraction * totalSteps);
  if (fraction >= 1) {
    s.stats.handWashes++;
    s.runStats.handWashes++;
  }
  for (let i = 0; i < services.length; i++) {
    const id = services[i];
    const n = steps[i] ?? 1;
    if (!id) break;
    if (stepsDone >= n - 1e-6) {
      stepsDone -= n;
      addServiceQuality(s, job, id, quality);
      job.progress = 0;
      if (nextService(s, bay, job, null)) return;
    } else {
      job.progress = (stepsDone / n) * job.duration;
      break;
    }
  }
}

/** Instantly completes every job in progress (at closing time). */
export function finishAllJobs(s: GameState): void {
  for (const bay of s.bays) {
    const job = bay.job;
    if (!job) continue;
    job.handActive = false;
    const w = doerOf(s, bay) ?? null;
    for (let i = job.serviceIndex; i < job.customer.services.length; i++) {
      const id = job.customer.services[i];
      if (id) addServiceQuality(s, job, id, rollQuality(s, id, w));
    }
    job.serviceIndex = job.customer.services.length;
    finishJob(s, bay);
  }
}

export function addIncome(s: GameState, amount: number): void {
  s.incomeSecondAcc += amount;
}

/** Pushes the last second of income into the ring buffer. */
export function rollIncomeSecond(s: GameState): void {
  if (s.incomeRing.length !== INCOME_RING_SECONDS) {
    s.incomeRing = new Array<number>(INCOME_RING_SECONDS).fill(0);
    s.incomeRingPos = 0;
  }
  s.incomeRing[s.incomeRingPos] = s.incomeSecondAcc;
  s.incomeRingPos = (s.incomeRingPos + 1) % INCOME_RING_SECONDS;
  s.incomeSecondAcc = 0;
}

/** Average net income per second over the last `seconds` seconds. */
export function incomePerSecond(s: GameState, seconds: number): number {
  const n = Math.min(seconds, s.incomeRing.length);
  if (n <= 0) return 0;
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    const idx = (s.incomeRingPos - i + s.incomeRing.length) % s.incomeRing.length;
    sum += s.incomeRing[idx] ?? 0;
  }
  return sum / n;
}

function finishJob(s: GameState, bay: Bay): void {
  const job = bay.job;
  if (!job) return;
  bay.job = null;
  bay.idleTime = 0;
  const c = job.customer;
  const w = bay.isOwner ? null : bayWorker(s, bay);
  const quality = job.qualityWeight > 0 ? job.qualitySum / job.qualityWeight : ECONOMY.qualityBase;
  const contract =
    c.contractId !== null ? s.contracts.find((k) => k.id === c.contractId) : undefined;

  let pay = 0;
  let tip = 0;
  let base: number;
  let satisfaction = 0;
  if (contract) {
    base = contract.payment / contract.count;
  } else {
    pay = chargedPrice(s, c) * (ECONOMY.payBase + ECONOMY.payQuality * quality) * incomeMult(s);
    base = pay;
    const waitFrac = clamp(0, 1, job.waitUsed / Math.max(1, c.patience));
    satisfaction = clamp(
      0,
      1,
      ECONOMY.satQuality * quality +
        ECONOMY.satWait * (1 - waitFrac) +
        ECONOMY.satValue * perceivedValue(s, c),
    );
    const tipRate =
      satisfaction < ECONOMY.tipMinSatisfaction
        ? 0
        : (ECONOMY.tipMax * (satisfaction - ECONOMY.tipMinSatisfaction)) /
          (1 - ECONOMY.tipMinSatisfaction);
    tip = pay * tipRate * tipMultiplier(s, w);
    if (c.vip) {
      if (quality >= EVENTS.vip.qualityNeeded) {
        tip *= EVENTS.vip.tipMult;
        adjustReputation(s, EVENTS.vip.repGain);
        s.fx.push({ kind: 'event', id: 'vipHappy' });
      } else {
        adjustReputation(s, -EVENTS.vip.repLoss);
        s.fx.push({ kind: 'event', id: 'vipSad' });
      }
    }
  }
  const commission = w ? w.commission * base : 0;
  const supplies = ECONOMY.suppliesRate * base;
  const net = pay + tip - commission - supplies;
  s.money += net;
  addIncome(s, net);

  const ds = s.dayStats;
  ds.revenue += pay;
  ds.tips += tip;
  ds.commissions += commission;
  ds.supplies += supplies;
  ds.carsServed++;
  for (const st of [s.stats, s.runStats]) {
    st.carsServed++;
    st.totalEarned += Math.max(0, pay + tip - commission - supplies);
    st.tips += tip;
    if (c.dirt === 2) st.muddyCars++;
    if (c.vehicle === 'classic') st.classicsServed++;
  }

  let stars = 0;
  if (!contract) {
    stars = clamp(
      1,
      5,
      Math.round(1 + 4 * satisfaction + randRange(s, -ECONOMY.starNoise, ECONOMY.starNoise)),
    );
    if (random(s) < ECONOMY.reviewChance) {
      applyStars(s, stars);
      addReview(s, c, stars);
    }
  }

  if (w) {
    let maxTier = 0;
    for (const id of c.services) maxTier = Math.max(maxTier, SERVICE_BY_ID[id].tier);
    giveXp(s, w, XP.perCar + XP.perTier * maxTier);
    w.carsDone++;
  }

  s.fx.push({
    kind: 'paid',
    bayId: bay.id,
    amount: pay - commission - supplies,
    tip,
    stars,
    quality,
    customer: c,
  });

  if (contract) completeContractCar(s, contract);
}
