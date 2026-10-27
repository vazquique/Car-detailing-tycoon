import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/game/sim/newGame';
import { runTicks, tick } from '../src/game/sim/tick';
import { createOffer, activateContract } from '../src/game/sim/contracts';
import { acceptContract } from '../src/game/actions/workshop';
import { relocate } from '../src/game/actions/relocate';
import { launchMarketing, orderPipe } from '../src/game/actions/marketing';
import { trainWorker } from '../src/game/actions/train';
import { franchise, pfForRun, buyNode } from '../src/game/actions/prestige';
import { buyEquipment } from '../src/game/actions/purchase';
import { addEffect } from '../src/game/sim/events';
import { arrivalRate, canDoServiceNow, isVehicleUnlocked } from '../src/game/sim/economy';
import { giveXp } from '../src/game/sim/staff';
import { startDay } from '../src/game/sim/day';
import { CALENDAR } from '../src/game/data/economy';

describe('locations and vehicles', () => {
  it('moving keeps equipment and staff and unlocks bigger cars', () => {
    const s = createInitialState(1);
    s.money = 30000;
    s.equipment.vacuum = 1;
    expect(isVehicleUnlocked(s, 'suv')).toBe(false);
    const next = relocate(s, { location: 1 });
    expect(next.location).toBe(1);
    expect(next.equipment.vacuum).toBe(1);
    expect(isVehicleUnlocked(next, 'suv')).toBe(true);
    expect(relocate(s, { location: 3 })).toBe(s);
  });
});

describe('contracts', () => {
  it('offers only feasible contracts and pays on completion', () => {
    const s = createInitialState(1);
    s.location = 1;
    s.equipment.vacuum = 1;
    s.equipment.wheelKit = 1;
    const offer = createOffer(s);
    expect(offer).not.toBeNull();
    if (!offer) return;
    expect(['airportTaxis', 'carRental']).toContain(offer.templateId);
    s.contractOffers.push(offer);
    const next = acceptContract(s, { offerId: offer.id });
    expect(next.contracts.length).toBe(1);
    const money = next.money;
    runTicks(next, 240);
    const k = next.contracts[0];
    const done = next.stats.contractsDone;
    expect(done > 0 || (k?.done ?? 0) > 0).toBe(true);
    if (done > 0) expect(next.money).toBeGreaterThan(money);
  });

  it('fails a contract after its deadline and lowers reputation', () => {
    const s = createInitialState(1);
    s.location = 1;
    s.equipment.vacuum = 1;
    s.equipment.wheelKit = 1;
    const offer = createOffer(s);
    if (!offer) throw new Error('no offer');
    const k = activateContract(s, offer);
    k.count = 999;
    s.contracts.push(k);
    const rep = s.reputation;
    runTicks(s, (offer.days * (CALENDAR.closeMinute - CALENDAR.openMinute)) / 3 + 5);
    expect(s.stats.contractsFailed).toBe(1);
    expect(s.reputation).toBeLessThan(rep);
  });
});

describe('events and marketing', () => {
  it('rain lowers arrivals and the awning softens it', () => {
    const s = createInitialState(1);
    s.minute = 12 * 60;
    const sunny = arrivalRate(s);
    s.weather = 'rain';
    const rain = arrivalRate(s);
    s.upgrades.awning = 1;
    const awning = arrivalRate(s);
    expect(rain / sunny).toBeCloseTo(0.6);
    expect(awning / sunny).toBeCloseTo(0.8);
  });

  it('a water cut blocks exterior unless there is a cistern, and the water truck fixes it', () => {
    const s = createInitialState(1);
    s.money = 10000;
    addEffect(s, 'waterCut', 100);
    expect(canDoServiceNow(s, 'exterior')).toBe(false);
    const fixed = orderPipe(s, undefined as never);
    expect(canDoServiceNow(fixed, 'exterior')).toBe(true);
    s.upgrades.cistern = 1;
    expect(canDoServiceNow(s, 'exterior')).toBe(true);
  });

  it('flyers boost arrivals for 3 minutes', () => {
    const s = createInitialState(1);
    s.money = 1000;
    s.minute = 12 * 60;
    const base = arrivalRate(s);
    const next = launchMarketing(s, { id: 'flyers' });
    expect(arrivalRate(next) / base).toBeCloseTo(1.4);
    runTicks(next, 181);
    expect(next.effects.some((e) => e.id === 'flyers')).toBe(false);
  });

  it('the forecast is mostly right', () => {
    const s = createInitialState(1);
    let right = 0;
    for (let i = 0; i < 400; i++) {
      if (s.forecast.weather === s.tomorrowWeather) right++;
      startDay(s);
    }
    expect(right / 400).toBeGreaterThan(0.72);
  });
});

describe('staff', () => {
  it('workers level up with experience and courses', () => {
    const s = createInitialState(1);
    s.money = 1e6;
    const w = s.candidates[0];
    if (!w) throw new Error('no candidate');
    s.workers.push(w);
    const lvl = w.level;
    giveXp(s, w, 12);
    expect(w.level).toBeGreaterThan(lvl);
    const next = trainWorker(s, { workerId: w.id });
    expect(next.workers[0]?.level).toBe(w.level + 1);
  });
});

describe('franchise', () => {
  it('resets the run, keeps achievements and gives PF', () => {
    const s = createInitialState(1);
    s.location = 3;
    s.runStats.totalEarned = 100e6;
    s.achievements.push('firstCustomer');
    expect(pfForRun(s)).toBe(10);
    const next = franchise(s);
    expect(next.location).toBe(0);
    expect(next.prestige.points).toBe(10);
    expect(next.prestige.earnedTotal).toBe(10);
    expect(next.achievements).toContain('firstCustomer');
    const bought = buyNode(next, { id: 'inheritedTools' });
    expect(bought.prestige.points).toBe(8);
    expect(bought.equipment.pressureWasher).toBe(1);
  });

  it('equipment requirements are enforced', () => {
    const s = createInitialState(1);
    s.money = 1e6;
    expect(buyEquipment(s, { id: 'engineKit' })).toBe(s);
    tick(s, 0.1);
  });
});
