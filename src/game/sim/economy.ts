// Economy formulas: prices, speeds, quality, payments. Pure functions over GameState.
import type { Bay, Customer, GameState, ServiceId, VehicleId, Worker } from '../types';
import { ECONOMY, CALENDAR, HOUR_CURVE } from '../data/economy';
import { SERVICES, SERVICE_BY_ID } from '../data/services';
import { VEHICLE_BY_ID, DIRT } from '../data/vehicles';
import {
  EQUIPMENT,
  EQUIPMENT_QUALITY_PER_LEVEL,
  EQUIPMENT_TIME_PER_LEVEL,
} from '../data/equipment';
import { UPGRADE_EFFECTS } from '../data/upgrades';
import { STAFF, TRAIT_BY_ID, MANAGER, RECEPTIONIST } from '../data/staff';
import { BAY_LEVEL_SPEED, LOCATIONS } from '../data/locations';
import { PRESTIGE } from '../data/prestige';
import { EVENTS, WEATHER_BY_ID } from '../data/events';
import { MARKETING, MARKETING_BY_ID, SOCIAL_VIP_BONUS } from '../data/marketing';
import { calendarOf, isBuenFin } from './calendar';
import { hasEffect } from './events';

export const clamp = (min: number, max: number, v: number): number =>
  v < min ? min : v > max ? max : v;

/** Income multiplier from achievements and franchise points. */
export function incomeMult(s: GameState): number {
  return (
    (1 + ECONOMY.prestigeIncome * s.prestige.earnedTotal) *
    (1 + ECONOMY.achievementIncome * s.achievements.length)
  );
}

export function isServiceUnlocked(s: GameState, id: ServiceId): boolean {
  const def = SERVICE_BY_ID[id];
  if (s.location < def.minLocation) return false;
  return def.requires.every((e) => s.equipment[e] > 0);
}

export function unlockedServices(s: GameState): ServiceId[] {
  return SERVICES.filter((d) => isServiceUnlocked(s, d.id)).map((d) => d.id);
}

export function isVehicleUnlocked(s: GameState, id: VehicleId): boolean {
  const def = VEHICLE_BY_ID[id];
  if (id === 'classic' && s.prestige.expoUsed && s.location >= 2) return true;
  return s.location >= def.minLocation && s.reputation >= def.minRep;
}

export function waterAvailable(s: GameState): boolean {
  return s.upgrades.cistern > 0 || !hasEffect(s, 'waterCut');
}

export function canDoServiceNow(s: GameState, id: ServiceId): boolean {
  return !SERVICE_BY_ID[id].needsWater || waterAvailable(s);
}

/** Fair price of one service (compact car, clean). */
export function fairPrice(s: GameState, id: ServiceId): number {
  const def = SERVICE_BY_ID[id];
  let p = def.basePrice * (ECONOMY.fairBase + ECONOMY.fairPerStar * s.reputation);
  p *= 1 + PRESTIGE.premiumPrice * s.prestige.nodes.premiumPrice;
  if (isBuenFin(s)) p *= EVENTS.buenFin.fairMult;
  return p;
}

/** Price the player charges for one service (compact car, clean). */
export function playerPrice(s: GameState, id: ServiceId): number {
  return SERVICE_BY_ID[id].basePrice * s.prices[id];
}

/** Ratio fair / player for one service. */
export function valueRatio(s: GameState, id: ServiceId): number {
  return fairPrice(s, id) / Math.max(1, playerPrice(s, id));
}

/** Arrival price factor: demand-weighted over unlocked services. */
export function priceFactor(s: GameState): number {
  let total = 0;
  let weight = 0;
  for (const def of SERVICES) {
    if (!isServiceUnlocked(s, def.id)) continue;
    const r = clamp(
      ECONOMY.priceFactorMin,
      ECONOMY.priceFactorMax,
      Math.pow(valueRatio(s, def.id), ECONOMY.priceExp),
    );
    total += r * def.demand;
    weight += def.demand;
  }
  return weight > 0 ? total / weight : 1;
}

/** Price factor of a single service, used for the demand label. */
export function servicePriceFactor(s: GameState, id: ServiceId): number {
  return clamp(
    ECONOMY.priceFactorMin,
    ECONOMY.priceFactorMax,
    Math.pow(valueRatio(s, id), ECONOMY.priceExp),
  );
}

export function repFactor(s: GameState): number {
  return ECONOMY.repArrivalBase + ECONOMY.repArrivalPerStar * s.reputation;
}

export function hourCurve(minute: number): number {
  for (const h of HOUR_CURVE) {
    if (minute >= h.from && minute < h.to) return h.mult;
  }
  return 0;
}

/** Average of the hour curve over the open hours. */
export function averageHourCurve(): number {
  let sum = 0;
  let span = 0;
  for (const h of HOUR_CURVE) {
    sum += h.mult * (h.to - h.from);
    span += h.to - h.from;
  }
  return span > 0 ? sum / span : 1;
}

/** Product of marketing arrival bonuses (permanent and timed). */
export function marketingFactor(s: GameState): number {
  let f = 1;
  for (const m of MARKETING) {
    if (m.kind === 'permanent' && s.marketingOwned[m.id]) f += m.arrivals;
  }
  if (s.socialActive) f += MARKETING_BY_ID.social.arrivals;
  if (hasEffect(s, 'flyers')) f += MARKETING_BY_ID.flyers.arrivals;
  if (hasEffect(s, 'influencer')) f += MARKETING_BY_ID.influencer.arrivals;
  f += UPGRADE_EFFECTS.neonArrivals * s.upgrades.neonSign;
  f += PRESTIGE.brandArrivals * s.prestige.nodes.brand;
  return f;
}

/** Product of calendar, weather and event arrival multipliers. */
export function eventFactor(s: GameState): number {
  const cal = calendarOf(s.day);
  let f = 1;
  if (s.weather === 'rain') {
    f *=
      s.upgrades.awning > 0 ? 1 - UPGRADE_EFFECTS.awningRainPenalty : WEATHER_BY_ID.rain.arrivals;
  } else {
    f *= WEATHER_BY_ID[s.weather].arrivals;
  }
  if (s.afterRain) f *= EVENTS.afterRainArrivals;
  if (cal.weekend) f *= EVENTS.weekendArrivals;
  if (EVENTS.paydayDays.includes(cal.dayOfMonth)) f *= EVENTS.paydayArrivals;
  if (isBuenFin(s)) f *= EVENTS.buenFin.arrivals;
  if (cal.month === EVENTS.aguinaldo.month) f *= EVENTS.aguinaldo.arrivals;
  if (hasEffect(s, 'viral')) f *= EVENTS.viral.arrivals;
  return f;
}

/** Walk-in customers per real second right now. */
export function arrivalRate(s: GameState): number {
  const loc = LOCATIONS[s.location];
  if (!loc) return 0;
  return (
    (1 / loc.arrivalSeconds) *
    repFactor(s) *
    priceFactor(s) *
    marketingFactor(s) *
    eventFactor(s) *
    hourCurve(s.minute)
  );
}

/** Average arrivals per second over a full day (for estimates). */
export function averageArrivalRate(s: GameState): number {
  const loc = LOCATIONS[s.location];
  if (!loc) return 0;
  return (
    (1 / loc.arrivalSeconds) *
    repFactor(s) *
    priceFactor(s) *
    marketingFactor(s) *
    averageHourCurve()
  );
}

export function queueCapacity(s: GameState): number {
  const loc = LOCATIONS[s.location];
  return (loc?.queueSlots ?? 3) + UPGRADE_EFFECTS.coveredQueueSlots * s.upgrades.coveredQueue;
}

export function patienceFor(s: GameState, vip: boolean): number {
  let p = ECONOMY.basePatience;
  p *= 1 + UPGRADE_EFFECTS.waitingRoomPatience * s.upgrades.waitingRoom;
  p *= 1 + UPGRADE_EFFECTS.coffeePatience * s.upgrades.coffeeWifi;
  p *= 1 + PRESTIGE.loyaltyPatience * s.prestige.nodes.loyalty;
  if (s.support.receptionist) p *= RECEPTIONIST.patienceMult;
  if (vip) p *= ECONOMY.vipPatienceMult;
  return p;
}

export function vipChancePerHour(s: GameState): number {
  let c = EVENTS.vip.chancePerHour;
  if (s.upgrades.cardTerminal > 0) c += UPGRADE_EFFECTS.terminalVip;
  if (s.socialActive) c += SOCIAL_VIP_BONUS;
  return c;
}

export function tapPower(s: GameState): number {
  return ECONOMY.tapSeconds * (1 + UPGRADE_EFFECTS.supervisionTap * s.upgrades.supervision);
}

/** Extra work seconds per real second given by the manager. */
export function managerBoost(s: GameState): number {
  return s.support.manager ? MANAGER.tapsPerSecond * tapPower(s) : 0;
}

// ---------- Workers ----------

export function workerLevelSpeed(level: number): number {
  return 1 + STAFF.speedPerLevel * (level - 1);
}

export function workerLevelQuality(level: number): number {
  return 1 + STAFF.qualityPerLevel * (level - 1);
}

export function workerSpeed(s: GameState, w: Worker | null): number {
  const hands = 1 + PRESTIGE.fastHands * s.prestige.nodes.fastHands;
  if (!w) return STAFF.ownerSpeed * hands;
  const trait = TRAIT_BY_ID[w.trait];
  let v = w.speed * workerLevelSpeed(w.level) * trait.speedMult * hands;
  if (s.minute < CALENDAR.morningEnd) v *= trait.morningSpeed;
  return v;
}

export function workerQuality(w: Worker | null): number {
  if (!w) return STAFF.ownerQuality;
  return w.quality * workerLevelQuality(w.level) * TRAIT_BY_ID[w.trait].qualityMult;
}

export function workerLevel(w: Worker | null): number {
  return w ? w.level : STAFF.ownerLevel;
}

export function bayWorker(s: GameState, bay: Bay): Worker | null {
  if (bay.workerId === null) return null;
  return s.workers.find((w) => w.id === bay.workerId) ?? null;
}

export function bayHasDoer(bay: Bay): boolean {
  return bay.isOwner || bay.workerId !== null;
}

export function canWorkerDo(s: GameState, w: Worker | null, c: Customer): boolean {
  const lvl = workerLevel(w);
  for (const id of c.services) {
    if (SERVICE_BY_ID[id].minLevel > lvl) return false;
    if (!canDoServiceNow(s, id)) return false;
  }
  return true;
}

// ---------- Equipment and upgrades ----------

export function equipmentTimeMult(s: GameState, id: ServiceId): number {
  let m = 1;
  for (const e of EQUIPMENT) {
    const lvl = s.equipment[e.id];
    if (lvl <= 0) continue;
    if (e.affects.includes(id)) m *= Math.pow(EQUIPMENT_TIME_PER_LEVEL, lvl - 1);
    if (e.timeBonus && e.timeBonus.services.includes(id)) m *= e.timeBonus.mult;
  }
  return m;
}

export function equipmentQualityMult(s: GameState, id: ServiceId): number {
  let m = 1;
  for (const e of EQUIPMENT) {
    const lvl = s.equipment[e.id];
    if (lvl <= 0) continue;
    if (e.affects.includes(id)) m *= 1 + EQUIPMENT_QUALITY_PER_LEVEL * (lvl - 1);
    if (e.qualityBonus && e.qualityBonus.services.includes(id)) m *= e.qualityBonus.mult;
  }
  return m;
}

export function upgradeQualityMult(s: GameState, id: ServiceId): number {
  let m = 1 + UPGRADE_EFFECTS.shampooQuality * s.upgrades.shampoo;
  if (id === 'exterior') {
    m *= 1 + UPGRADE_EFFECTS.microfiberQuality * s.upgrades.microfiber;
    m *= 1 + UPGRADE_EFFECTS.softWaterQuality * s.upgrades.softWater;
  }
  return m;
}

export function upgradeTimeMult(s: GameState, id: ServiceId): number {
  if (id === 'exterior') return 1 - UPGRADE_EFFECTS.microfiberTime * s.upgrades.microfiber;
  return 1;
}

export function bayLevelMult(level: number): number {
  return 1 + BAY_LEVEL_SPEED * (level - 1);
}

/** Work seconds a service takes for this customer, doer and bay. */
export function serviceDuration(
  s: GameState,
  c: Customer,
  id: ServiceId,
  w: Worker | null,
  bayLevel: number,
): number {
  const def = SERVICE_BY_ID[id];
  const veh = VEHICLE_BY_ID[c.vehicle];
  const ignoresMud = w ? TRAIT_BY_ID[w.trait].ignoresMud : false;
  const dirtMult = ignoresMud && c.dirt === 2 ? 1 : (DIRT[c.dirt]?.timeMult ?? 1);
  const time =
    def.baseTime * veh.timeMult * dirtMult * equipmentTimeMult(s, id) * upgradeTimeMult(s, id);
  return time / (workerSpeed(s, w) * bayLevelMult(bayLevel));
}

/** Expected quality (no noise) for a service by a doer. */
export function expectedQuality(
  s: GameState,
  id: ServiceId,
  w: Worker | null,
  hand: boolean,
): number {
  return clamp(
    ECONOMY.qualityMin,
    ECONOMY.qualityMax,
    ECONOMY.qualityBase *
      workerQuality(w) *
      equipmentQualityMult(s, id) *
      upgradeQualityMult(s, id) *
      (hand ? ECONOMY.handBonus : 1),
  );
}

/** Amount charged for a customer's order before quality. */
export function chargedPrice(s: GameState, c: Customer): number {
  const veh = VEHICLE_BY_ID[c.vehicle];
  const dirt = DIRT[c.dirt]?.priceMult ?? 1;
  let total = 0;
  for (const id of c.services) total += playerPrice(s, id);
  return total * veh.priceMult * dirt;
}

/** Fair value of an order (used by contracts). */
export function fairOrderValue(
  s: GameState,
  vehicle: VehicleId,
  services: readonly ServiceId[],
): number {
  const veh = VEHICLE_BY_ID[vehicle];
  let total = 0;
  for (const id of services) total += fairPrice(s, id);
  return total * veh.priceMult;
}

/** Customer perceived value: clamp(0, 1, average fair / player). */
export function perceivedValue(s: GameState, c: Customer): number {
  if (c.services.length === 0) return 1;
  let sum = 0;
  for (const id of c.services) sum += valueRatio(s, id);
  return clamp(0, 1, sum / c.services.length);
}

export function tipMultiplier(s: GameState, w: Worker | null): number {
  let m = 1 + UPGRADE_EFFECTS.coffeeTips * s.upgrades.coffeeWifi;
  if (s.upgrades.cardTerminal > 0) m += UPGRADE_EFFECTS.terminalTips;
  if (w) m *= TRAIT_BY_ID[w.trait].tipMult;
  return m;
}

export function rentToday(s: GameState): number {
  return LOCATIONS[s.location]?.rent ?? 0;
}
