import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/game/sim/newGame';
import {
  arrivalRate,
  fairPrice,
  priceFactor,
  repFactor,
  serviceDuration,
  expectedQuality,
  isServiceUnlocked,
} from '../src/game/sim/economy';
import { createCustomer } from '../src/game/sim/customers';
import { buyEquipment, equipmentCost, buyBay, bayCost } from '../src/game/actions/purchase';
import { setPrice } from '../src/game/actions/pricing';
import { hireWorker } from '../src/game/actions/hire';
import { ECONOMY } from '../src/game/data/economy';

describe('economy formulas', () => {
  it('fair price follows reputation', () => {
    const s = createInitialState(1);
    s.reputation = 3;
    expect(fairPrice(s, 'exterior')).toBeCloseTo(100 * (0.75 + 0.3));
    s.reputation = 5;
    expect(fairPrice(s, 'exterior')).toBeCloseTo(125);
  });

  it('reputation factor matches the spec', () => {
    const s = createInitialState(1);
    s.reputation = 3;
    expect(repFactor(s)).toBeCloseTo(1.1);
    s.reputation = 5;
    expect(repFactor(s)).toBeCloseTo(1.5);
  });

  it('charging more lowers arrivals and charging less raises them (clamped)', () => {
    const s = createInitialState(1);
    s.minute = 11 * 60;
    const base = arrivalRate(s);
    const high = setPrice(s, { service: 'exterior', mult: 2 });
    const low = setPrice(s, { service: 'exterior', mult: 0.5 });
    expect(arrivalRate(high)).toBeLessThan(base);
    expect(arrivalRate(low)).toBeGreaterThan(base);
    expect(priceFactor(low)).toBeLessThanOrEqual(ECONOMY.priceFactorMax);
    expect(priceFactor(high)).toBeGreaterThanOrEqual(ECONOMY.priceFactorMin);
  });

  it('prices snap to 5% steps within 50%..200%', () => {
    const s = createInitialState(1);
    expect(setPrice(s, { service: 'exterior', mult: 3 }).prices.exterior).toBe(2);
    expect(setPrice(s, { service: 'exterior', mult: 0.1 }).prices.exterior).toBe(0.5);
    expect(setPrice(s, { service: 'exterior', mult: 1.07 }).prices.exterior).toBe(1.05);
  });

  it('equipment makes services faster and unlocks new ones', () => {
    const s = createInitialState(1);
    s.money = 100000;
    const c = createCustomer(s, { vehicle: 'sedan', services: ['exterior'] });
    c.dirt = 0;
    const before = serviceDuration(s, c, 'exterior', null, 1);
    expect(isServiceUnlocked(s, 'interior')).toBe(false);
    const s2 = buyEquipment(buyEquipment(s, { id: 'pressureWasher' }), { id: 'vacuum' });
    expect(serviceDuration(s2, c, 'exterior', null, 1)).toBeCloseTo(before * 0.6);
    expect(isServiceUnlocked(s2, 'interior')).toBe(true);
  });

  it('hand washing gives +10% quality', () => {
    const s = createInitialState(1);
    const auto = expectedQuality(s, 'exterior', null, false);
    const hand = expectedQuality(s, 'exterior', null, true);
    expect(hand / auto).toBeCloseTo(1.1);
  });
});

describe('purchases are pure and validated', () => {
  it('cannot buy without money and does not mutate the input', () => {
    const s = createInitialState(1);
    s.money = 10;
    const next = buyEquipment(s, { id: 'pressureWasher' });
    expect(next).toBe(s);
    expect(s.equipment.pressureWasher).toBe(0);
  });

  it('cannot buy while in debt', () => {
    const s = createInitialState(1);
    s.money = -5;
    expect(buyEquipment(s, { id: 'pressureWasher' })).toBe(s);
  });

  it('buying charges the right price and returns a new state', () => {
    const s = createInitialState(1);
    s.money = 1000;
    const cost = equipmentCost(s, 'pressureWasher');
    const next = buyEquipment(s, { id: 'pressureWasher' });
    expect(next).not.toBe(s);
    expect(next.money).toBe(1000 - cost);
    expect(next.equipment.pressureWasher).toBe(1);
    expect(s.equipment.pressureWasher).toBe(0);
  });

  it('bays are limited by the location', () => {
    const s = createInitialState(1);
    s.money = 1e9;
    expect(buyBay(s)).toBe(s);
    s.location = 1;
    const next = buyBay(s);
    expect(next.bays.length).toBe(3);
    expect(bayCost(next)).toBeGreaterThan(bayCost(s));
  });

  it('hiring adds a worker and puts them in a free bay', () => {
    const s = createInitialState(1);
    s.money = 1e6;
    const cand = s.candidates[0];
    expect(cand).toBeDefined();
    const next = hireWorker(s, { candidateId: cand?.id ?? -1 });
    expect(next.workers.length).toBe(1);
    expect(next.bays[1]?.workerId).toBe(cand?.id);
  });
});
