// A bot that plays the game without a browser, used by the balance test.
import type { GameState, ServiceId } from '../src/game/types';
import { TICK } from '../src/game/constants';
import { tick } from '../src/game/sim/tick';
import { createInitialState } from '../src/game/sim/newGame';
import { SERVICES, SERVICE_BY_ID } from '../src/game/data/services';
import { VEHICLES } from '../src/game/data/vehicles';
import { EQUIPMENT } from '../src/game/data/equipment';
import { UPGRADES } from '../src/game/data/upgrades';
import { LOCATIONS } from '../src/game/data/locations';
import { SUPPORT_ROLES, STAFF } from '../src/game/data/staff';
import { ECONOMY, CALENDAR } from '../src/game/data/economy';
import { MARKETING_BY_ID } from '../src/game/data/marketing';
import {
  averageArrivalRate,
  bayLevelMult,
  equipmentQualityMult,
  equipmentTimeMult,
  expectedQuality,
  fairPrice,
  incomeMult,
  isServiceUnlocked,
  isVehicleUnlocked,
  managerBoost,
  playerPrice,
  queueCapacity,
  upgradeQualityMult,
  upgradeTimeMult,
  workerQuality,
  workerSpeed,
  canWorkerDo,
} from '../src/game/sim/economy';
import { finishHandWash, handServiceCount, startHandWash } from '../src/game/sim/bays';
import {
  bayCost,
  bayLevelCost,
  buyBay,
  buyEquipment,
  buyUpgrade,
  equipmentBlock,
  equipmentCost,
  maxBays,
  upgradeBay,
  upgradeCost,
  upgradeMaxed,
} from '../src/game/actions/purchase';
import { hireSupport, hireWorker } from '../src/game/actions/hire';
import { trainWorker } from '../src/game/actions/train';
import { courseCost } from '../src/game/sim/staff';
import { relocate, moveCost } from '../src/game/actions/relocate';
import { setPrice } from '../src/game/actions/pricing';
import { acceptContract } from '../src/game/actions/workshop';
import { launchMarketing, marketingCost, marketingStatus } from '../src/game/actions/marketing';
import { canFranchise, franchise, pfForRun, buyNode, nodeCost } from '../src/game/actions/prestige';
import { PRESTIGE_NODES } from '../src/game/data/prestige';
import { incomePerSecond } from '../src/game/sim/bays';
import { rentToday } from '../src/game/sim/economy';
import { checkMilestones, MILESTONE_ORDER } from '../src/game/sim/achievements';

const DAY_SECONDS =
  (CALENDAR.closeMinute - CALENDAR.openMinute) / CALENDAR.minutesPerSecond + CALENDAR.nightSeconds;

/** Probability that a walk-in orders each unlocked service. */
function serviceShares(s: GameState): Map<ServiceId, number> {
  const unlocked = SERVICES.filter((d) => isServiceUnlocked(s, d.id));
  const w = ECONOMY.serviceCountWeights;
  const total = w.reduce((a, b) => a + b, 0);
  const meanCount = w.reduce((a, b, i) => a + b * (i + 1), 0) / total;
  const shares = new Map<ServiceId, number>();
  const hasExt = unlocked.some((d) => d.id === 'exterior');
  const ext = hasExt ? ECONOMY.exteriorChance : 0;
  const others = unlocked.filter((d) => d.id !== 'exterior');
  const demand = others.reduce((a, d) => a + d.demand * (1 + d.tier * 0.3), 0);
  const rest = Math.max(0, Math.min(others.length, meanCount - ext));
  if (hasExt) shares.set('exterior', ext);
  for (const d of others)
    shares.set(d.id, Math.min(1, demand > 0 ? (rest * d.demand * (1 + d.tier * 0.3)) / demand : 0));
  return shares;
}

function vehicleMix(s: GameState): { price: number; time: number } {
  const list = VEHICLES.filter((v) => isVehicleUnlocked(s, v.id));
  const wsum = list.reduce((a, v) => a + v.weight, 0);
  let price = 0;
  let time = 0;
  for (const v of list) {
    price += (v.priceMult * v.weight) / wsum;
    time += (v.timeMult * v.weight) / wsum;
  }
  return { price, time };
}

/** Rough steady-state net income per real second for a state. */
export function estimateIncome(s: GameState): number {
  const shares = serviceShares(s);
  const mix = vehicleMix(s);
  const dirtTime = 1.135;
  const dirtPrice = 1.03;
  let ticket = 0;
  let work = 0;
  let quality = 0;
  let qw = 0;
  for (const [id, p] of shares) {
    const def = SERVICE_BY_ID[id];
    const price = playerPrice(s, id) * mix.price * dirtPrice;
    ticket += p * price;
    work +=
      p * def.baseTime * mix.time * dirtTime * equipmentTimeMult(s, id) * upgradeTimeMult(s, id);
    const q = Math.min(
      1,
      ECONOMY.qualityBase * equipmentQualityMult(s, id) * upgradeQualityMult(s, id),
    );
    quality += q * p * price;
    qw += p * price;
  }
  const workers = s.bays.map((b) =>
    b.isOwner ? null : (s.workers.find((w) => w.id === b.workerId) ?? undefined),
  );
  let capacity = 0;
  let commissionShare = 0;
  let wq = 0;
  s.bays.forEach((b, i) => {
    const w = workers[i];
    if (w === undefined) return;
    const speed = workerSpeed(s, w) * bayLevelMult(b.level) * (1 + managerBoost(s));
    const c = work > 0 ? speed / work : 0;
    capacity += c;
    commissionShare += c * (w ? w.commission : 0);
    wq += c * workerQuality(w);
  });
  if (capacity <= 0) return -(rentToday(s) / DAY_SECONDS);
  const q = Math.min(1, (qw > 0 ? quality / qw : ECONOMY.qualityBase) * (wq / capacity));
  const demand = averageArrivalRate(s) * 0.95;
  const served = Math.min(demand, capacity * 0.92);
  const pay = ticket * (ECONOMY.payBase + ECONOMY.payQuality * q) * incomeMult(s);
  const commission = commissionShare / capacity;
  const net = pay * (1 + 0.06 - ECONOMY.suppliesRate - commission);
  let fixed = rentToday(s);
  for (const r of SUPPORT_ROLES) if (s.support[r.id]) fixed += r.dailyWage;
  if (s.socialActive) fixed += marketingCost(s, 'social');
  return (
    served *
      net *
      ((CALENDAR.lastArrivalMinute - CALENDAR.openMinute) /
        (CALENDAR.closeMinute - CALENDAR.openMinute)) -
    fixed / DAY_SECONDS
  );
}

interface Option {
  label: string;
  cost: number;
  apply: (s: GameState) => GameState;
}

function rich(s: GameState): GameState {
  return { ...s, money: 1e18 };
}

function bestCandidate(s: GameState): GameState['candidates'][number] | undefined {
  return [...s.candidates].sort(
    (a, b) =>
      (b.speed * b.quality * (1 + 0.05 * b.level)) / (1 + b.commission) -
      (a.speed * a.quality * (1 + 0.05 * a.level)) / (1 + a.commission),
  )[0];
}

export function options(s: GameState): Option[] {
  const out: Option[] = [];
  for (const e of EQUIPMENT) {
    if (equipmentBlock(s, e.id) !== null) continue;
    out.push({
      label: `equip:${e.id}`,
      cost: equipmentCost(s, e.id),
      apply: (x) => buyEquipment(x, { id: e.id }),
    });
  }
  for (const u of UPGRADES) {
    if (upgradeMaxed(s, u.id) || u.id === 'awning' || u.id === 'cistern' || u.id === 'permits')
      continue;
    out.push({
      label: `upg:${u.id}`,
      cost: upgradeCost(s, u.id),
      apply: (x) => buyUpgrade(x, { id: u.id }),
    });
  }
  // Services that need several pieces of equipment are evaluated as one purchase.
  for (const d of SERVICES) {
    if (isServiceUnlocked(s, d.id) || s.location < d.minLocation) continue;
    const missing = d.requires.filter((e) => s.equipment[e] <= 0);
    if (
      missing.length < 2 ||
      missing.some((e) => equipmentBlock(s, e) !== null && equipmentBlock(s, e) !== 'requires')
    )
      continue;
    let cost = 0;
    for (const e of missing) cost += equipmentCost(s, e);
    out.push({
      label: `unlock:${d.id}`,
      cost,
      apply: (x) => missing.reduce((acc, e) => buyEquipment(acc, { id: e }), x),
    });
  }
  if (marketingStatus(s, 'social') === 'available') {
    out.push({
      label: 'mkt:social',
      cost: marketingCost(s, 'social'),
      apply: (x) => launchMarketing(x, { id: 'social' }),
    });
  }
  for (const id of ['banner', 'mapsProfile'] as const) {
    if (marketingStatus(s, id) === 'available') {
      out.push({
        label: `mkt:${id}`,
        cost: marketingCost(s, id),
        apply: (x) => launchMarketing(x, { id }),
      });
    }
  }
  const freeBays = s.bays.filter((b) => !b.isOwner && b.workerId === null).length;
  const cand = bestCandidate(s);
  if (cand) {
    if (freeBays > 0) {
      out.push({
        label: 'hire',
        cost: cand.hireCost,
        apply: (x) => hireWorker(x, { candidateId: cand.id }),
      });
    } else if (s.bays.length < maxBays(s)) {
      out.push({
        label: 'bay+hire',
        cost: cand.hireCost + bayCost(s),
        apply: (x) => hireWorker(buyBay(x), { candidateId: cand.id }),
      });
    }
  }
  for (const b of s.bays) {
    if (b.level < 10 && (b.isOwner || b.workerId !== null)) {
      out.push({
        label: `bayLvl`,
        cost: bayLevelCost(b.level),
        apply: (x) => upgradeBay(x, { bayId: b.id }),
      });
    }
  }
  for (const w of s.workers) {
    if (w.level >= STAFF.maxLevel) continue;
    out.push({
      label: `train`,
      cost: courseCost(w.level),
      apply: (x) => trainWorker(x, { workerId: w.id }),
    });
  }
  for (const r of SUPPORT_ROLES) {
    if (!s.support[r.id] && s.location >= r.minLocation) {
      out.push({
        label: `support:${r.id}`,
        cost: r.hireCost,
        apply: (x) => hireSupport(x, { id: r.id }),
      });
    }
  }
  const next = s.location + 1;
  if (LOCATIONS[next]) {
    // Moving is evaluated together with filling the new bays with workers.
    const loc = LOCATIONS[next];
    let cost = moveCost(next);
    const extra = loc ? loc.maxBays - s.bays.length : 0;
    let tmp = rich(s);
    tmp = relocate(tmp, { location: next });
    // Moves and fills new bays only up to a budget similar to the move itself; the rest comes later.
    const budget = moveCost(next) * 2;
    for (let i = 0; i < extra; i++) {
      const c = bestCandidate(tmp);
      const step = bayCost(tmp) + (c?.hireCost ?? 0);
      if (cost + step > budget) break;
      cost += step;
      tmp = buyBay(tmp);
      if (c) tmp = hireWorker(tmp, { candidateId: c.id });
    }
    const after = tmp;
    out.push({ label: `move:${next}`, cost, apply: () => after });
  }
  return out;
}

export interface BotLog {
  milestones: Record<string, number>;
  pf: number;
  maxStall: number;
  stallAt?: number;
  minutes: number;
}

export interface BotOptions {
  /** Real seconds of play before giving up. */
  maxSeconds: number;
  /** Checks run every tick; throws on failure. */
  check?: (s: GameState) => void;
  onBuy?: (label: string, cost: number, s: GameState) => void;
  onMinute?: (s: GameState) => void;
}

/** Plays one run until it franchises (or time runs out). Returns the state after franchising. */
export function playRun(start: GameState, opts: BotOptions): { state: GameState; log: BotLog } {
  let s = start;
  let t = 0;
  let decision = 0;
  let handTimer = -1;
  let handBay = -1;
  let bestIncome = 0;
  let lastBest = 0;
  let maxStall = 0;
  let incomeTimer = 0;
  const earnedWindow: number[] = [];
  const firstHourHand = 3600;
  const log: BotLog = { milestones: {}, pf: 0, maxStall: 0, minutes: 0 };
  let rngHand = 12345;
  const rand = (): number => {
    rngHand = (rngHand * 1103515245 + 12345) & 0x7fffffff;
    return rngHand / 0x7fffffff;
  };

  while (t < opts.maxSeconds) {
    tick(s, TICK);
    s.fx.length = 0;
    t += TICK;
    opts.check?.(s);

    // Owner hand-washes half the time during the first hour.
    const owner = s.bays[0];
    if (handTimer > 0) {
      handTimer -= TICK;
      if (handTimer <= 0) {
        const job = s.bays.find((b) => b.id === handBay)?.job;
        if (job?.handActive) {
          let q = 0;
          const n = handServiceCount(job);
          for (let i = 0; i < n; i++) {
            const id = job.customer.services[job.serviceIndex + i];
            if (id) q += expectedQuality(s, id, null, true);
          }
          finishHandWash(s, handBay, 1, (q / Math.max(1, n)) * 0.98);
        }
        handTimer = -1;
      }
    } else if (
      owner?.job &&
      !owner.job.handDone &&
      !owner.job.handActive &&
      s.runStats.playSeconds < firstHourHand &&
      handServiceCount(owner.job) > 0
    ) {
      if (rand() < 0.5) {
        let steps = 0;
        for (let i = 0; i < handServiceCount(owner.job); i++) {
          const id = owner.job.customer.services[owner.job.serviceIndex + i];
          if (id) steps += SERVICE_BY_ID[id].handSteps.length;
        }
        if (startHandWash(s, owner.id)) {
          handBay = owner.id;
          handTimer = steps * 3 + 1;
        }
      } else {
        owner.job.handDone = true;
      }
    }

    // Stall detection: income per minute averaged over 20 minutes must keep reaching new highs.
    incomeTimer += TICK;
    if (incomeTimer >= 60) {
      incomeTimer = 0;
      // Income from served cars (contract payouts are lumpy and would hide the trend).
      earnedWindow.push(incomePerSecond(s, 60) * 60);
      if (earnedWindow.length > 20) earnedWindow.shift();
      const ipm = earnedWindow.reduce((a, b) => a + b, 0) / earnedWindow.length;
      if (ipm > bestIncome * 1.01) {
        bestIncome = ipm;
        lastBest = t;
      }
      if (t - lastBest > maxStall) {
        maxStall = t - lastBest;
        log.stallAt = lastBest;
      }
    }

    if (opts.onMinute && Math.floor(t / 60) !== Math.floor((t - TICK) / 60)) opts.onMinute(s);
    decision += TICK;
    if (decision < 5) continue;
    decision = 0;

    // Prices: full line → up, idle bays → down, within 80%..140% of the fair price.
    const idle = s.bays.some((b) => !b.job && (b.isOwner || b.workerId !== null));
    const full = s.queue.length >= queueCapacity(s);
    if (full || idle) {
      for (const d of SERVICES) {
        if (!isServiceUnlocked(s, d.id)) continue;
        const fairMult = fairPrice(s, d.id) / d.basePrice;
        const next = s.prices[d.id] + (full ? ECONOMY.priceStep : -ECONOMY.priceStep);
        const clamped = Math.max(fairMult * 0.8, Math.min(fairMult * 1.4, next));
        s = setPrice(s, { service: d.id, mult: clamped });
      }
    }

    // Contracts it can do.
    for (const o of s.contractOffers) {
      const fake = { services: o.services, vehicle: o.vehicle } as unknown as Parameters<
        typeof canWorkerDo
      >[2];
      const able =
        o.services.every((id) => isServiceUnlocked(s, id)) &&
        (canWorkerDo(s, null, fake) || s.workers.some((w) => canWorkerDo(s, w, fake)));
      if (able && s.contracts.length < 2) s = acceptContract(s, { offerId: o.id });
    }

    // Cheap marketing when the line is empty.
    if (s.queue.length === 0 && marketingStatus(s, 'flyers') === 'available') {
      const c = marketingCost(s, 'flyers');
      if (c < s.money * 0.05) s = launchMarketing(s, { id: 'flyers' });
    }
    if (s.queue.length === 0 && marketingStatus(s, 'influencer') === 'available') {
      if (marketingCost(s, 'influencer') < s.money * 0.03)
        s = launchMarketing(s, { id: 'influencer' });
    }
    void MARKETING_BY_ID;

    // Buy the option with the best return: minimise time to save + time to pay back.
    const income = Math.max(1e-3, incomePerSecond(s, 120), estimateIncome(s));
    const base = estimateIncome(s);
    let best: { o: Option; score: number } | null = null;
    const scored: { o: Option; gain: number }[] = [];
    // Like the tutorial says: right after the pressure washer, hire the first helper.
    const tutorialHire = s.workers.length === 0 && s.equipment.pressureWasher > 0;
    for (const o of options(s)) {
      if (tutorialHire && o.label !== 'hire') continue;
      if (tutorialHire) {
        best = { o, score: 0 };
        break;
      }
      const after = o.apply(rich(s));
      const gain = estimateIncome(after) - base;
      if (gain <= 0) continue;
      scored.push({ o, gain });
      const wait = Math.max(0, o.cost - s.money) / income;
      const score = wait + o.cost / gain;
      if (!best || score < best.score) best = { o, score };
    }
    const reserve = rentToday(s);
    // While saving for something big, still buy small things that pay back fast.
    if (best && s.money - best.o.cost < reserve) {
      const target = best.o.cost;
      const small = scored
        .filter(
          (x) =>
            x.o.cost <= target * 0.12 && x.o.cost / x.gain < 900 && s.money - x.o.cost >= reserve,
        )
        .sort((a, b) => a.o.cost / a.gain - b.o.cost / b.gain)[0];
      if (small && !small.o.label.startsWith('move:')) best = { o: small.o, score: 0 };
    }
    if (best && s.money - best.o.cost >= reserve) {
      const before = s.money;
      const after = best.o.apply(s);
      if (best.o.label.startsWith('move:')) {
        // The move option was built on a rich copy: replay it for real.
        const next = s.location + 1;
        let x = relocate(s, { location: next });
        const loc = LOCATIONS[next];
        const extra = loc ? loc.maxBays - x.bays.length : 0;
        let spent = moveCost(next);
        for (let i = 0; i < extra; i++) {
          const c = bestCandidate(x);
          const step = bayCost(x) + (c?.hireCost ?? 0);
          if (spent + step > moveCost(next) * 2 || x.money - step < rentToday(x)) break;
          const nb = buyBay(x);
          if (nb === x) break;
          spent += step;
          x = nb;
          if (c) x = hireWorker(x, { candidateId: c.id });
        }
        s = x;
      } else if (after !== s) {
        s = after;
      }
      if (s.money !== before) opts.onBuy?.(best.o.label, best.o.cost, s);
    }
    checkMilestones(s);

    if (canFranchise(s) && s.location >= LOCATIONS.length - 1) {
      for (const id of MILESTONE_ORDER)
        if (s.milestones[id] !== undefined) log.milestones[id] = s.milestones[id] ?? 0;
      log.milestones.franchise = s.runStats.playSeconds;
      log.pf = pfForRun(s);
      log.maxStall = maxStall;
      log.minutes = t / 60;
      return { state: franchise(s), log };
    }
  }
  for (const id of MILESTONE_ORDER)
    if (s.milestones[id] !== undefined) log.milestones[id] = s.milestones[id] ?? 0;
  log.maxStall = maxStall;
  log.minutes = t / 60;
  return { state: s, log };
}

/** Spends franchise points greedily on the most useful nodes. */
export function spendPf(s: GameState): GameState {
  const order = [
    'inheritedTools',
    'seedCapital',
    'fastHands',
    'premiumPrice',
    'brand',
    'school',
    'loyalty',
    'trustedPartner',
    'fleetContacts',
  ] as const;
  let changed = true;
  let x = s;
  while (changed) {
    changed = false;
    for (const id of order) {
      const lvl = x.prestige.nodes[id];
      const def = PRESTIGE_NODES.find((n) => n.id === id);
      if (!def || lvl >= def.maxLevel) continue;
      if (x.prestige.points >= nodeCost(id, lvl)) {
        x = buyNode(x, { id });
        changed = true;
        break;
      }
    }
  }
  return x;
}

export function newBotGame(seed: number): GameState {
  return createInitialState(seed);
}
