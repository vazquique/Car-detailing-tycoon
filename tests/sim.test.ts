import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/game/sim/newGame';
import { tick, runTicks } from '../src/game/sim/tick';
import { queueCapacity } from '../src/game/sim/economy';
import { enqueue } from '../src/game/sim/arrivals';
import { createCustomer } from '../src/game/sim/customers';
import { tapBay, startHandWash, finishHandWash } from '../src/game/sim/bays';
import { calendarOf } from '../src/game/sim/calendar';
import { CALENDAR } from '../src/game/data/economy';

describe('simulation', () => {
  it('is deterministic with the same seed', () => {
    const a = createInitialState(7);
    const b = createInitialState(7);
    runTicks(a, 300);
    runTicks(b, 300);
    expect(a.money).toBe(b.money);
    expect(a.stats.carsServed).toBe(b.stats.carsServed);
  });

  it('serves customers and earns money in the garage', () => {
    const s = createInitialState(3);
    runTicks(s, 240);
    expect(s.stats.carsServed).toBeGreaterThan(3);
    expect(s.money).toBeGreaterThan(150);
  });

  it('a day lasts 4 real minutes and the night 2 seconds', () => {
    const s = createInitialState(3);
    runTicks(s, 239.9);
    expect(s.day).toBe(1);
    runTicks(s, 0.3);
    expect(s.night).toBeGreaterThan(0);
    expect(s.lastSummary?.day).toBe(1);
    runTicks(s, CALENDAR.nightSeconds);
    expect(s.day).toBe(2);
    expect(s.minute).toBeLessThan(CALENDAR.openMinute + 5);
  });

  it('keeps invariants every tick', () => {
    const s = createInitialState(11);
    s.money = 50000;
    for (let i = 0; i < 6000; i++) {
      tick(s, 0.1);
      s.fx.length = 0;
      expect(Number.isFinite(s.money)).toBe(true);
      expect(s.reputation).toBeGreaterThanOrEqual(1);
      expect(s.reputation).toBeLessThanOrEqual(5);
      expect(s.queue.length).toBeLessThanOrEqual(queueCapacity(s));
    }
  });

  it('a full line turns customers away without hurting reputation', () => {
    const s = createInitialState(5);
    for (let i = 0; i < queueCapacity(s); i++) enqueue(s, createCustomer(s));
    const rep = s.reputation;
    const ok = enqueue(s, createCustomer(s));
    expect(ok).toBe(false);
    expect(s.reputation).toBe(rep);
  });

  it('impatient customers leave angry and lower reputation', () => {
    const s = createInitialState(5);
    s.bays.forEach((b) => (b.isOwner = false));
    const c = createCustomer(s, { services: ['exterior'] });
    enqueue(s, c);
    const rep = s.reputation;
    runTicks(s, c.patience + 1);
    expect(s.stats.angryCustomers).toBeGreaterThan(0);
    expect(s.reputation).toBeLessThan(rep);
  });

  it('tapping speeds a bay up, at most 8 taps per second', () => {
    const s = createInitialState(5);
    enqueue(s, createCustomer(s, { services: ['exterior'] }));
    tick(s, 0.1);
    const bay = s.bays[0];
    const job = bay?.job;
    expect(job).toBeTruthy();
    const before = job?.progress ?? 0;
    let counted = 0;
    for (let i = 0; i < 20; i++) if (tapBay(s, bay?.id ?? -1)) counted++;
    expect(counted).toBe(8);
    expect((job?.progress ?? 0) - before).toBeCloseTo(8 * 0.4);
  });

  it('the hand wash completes hand services with bonus quality', () => {
    const s = createInitialState(5);
    enqueue(s, createCustomer(s, { services: ['exterior'] }));
    tick(s, 0.1);
    const bay = s.bays[0];
    expect(startHandWash(s, bay?.id ?? -1)).toBe(true);
    const money = s.money;
    finishHandWash(s, bay?.id ?? -1, 1, 0.9);
    expect(bay?.job).toBeNull();
    expect(s.money).toBeGreaterThan(money);
    expect(s.stats.handWashes).toBe(1);
  });

  it('calendar has 30-day months and 7-day weeks', () => {
    expect(calendarOf(1)).toMatchObject({ dayOfMonth: 1, month: 1, weekday: 0 });
    expect(calendarOf(31)).toMatchObject({ dayOfMonth: 1, month: 2 });
    expect(calendarOf(6).weekend).toBe(true);
    expect(calendarOf(361)).toMatchObject({ month: 1, year: 2 });
  });
});
