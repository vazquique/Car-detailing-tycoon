import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/game/sim/newGame';
import { runTicks } from '../src/game/sim/tick';
import { computeOffline, applyOffline } from '../src/game/sim/offline';
import { incomePerSecond } from '../src/game/sim/bays';
import { OFFLINE } from '../src/game/data/economy';

describe('offline progress', () => {
  it('pays recent income × time × efficiency, capped', () => {
    const s = createInitialState(2);
    s.incomeRing = s.incomeRing.map(() => 10);
    const r = computeOffline(s, 3600);
    expect(incomePerSecond(s, 180)).toBe(10);
    expect(r.efficiency).toBe(OFFLINE.baseEfficiency);
    expect(r.money).toBeCloseTo(10 * 3600 * 0.5);
    const capped = computeOffline(s, 100 * 3600);
    expect(capped.counted).toBe(OFFLINE.baseCapHours * 3600);
  });

  it('the manager and the trusted partner raise efficiency and cap', () => {
    const s = createInitialState(2);
    s.support.manager = true;
    s.prestige.nodes.trustedPartner = 3;
    const r = computeOffline(s, 1e6);
    expect(r.efficiency).toBe(1);
    expect(r.capHours).toBe(4 + 2 + 6);
  });

  it('does not move the calendar or reputation', () => {
    const s = createInitialState(2);
    runTicks(s, 60);
    const day = s.day;
    const minute = s.minute;
    const rep = s.reputation;
    const money = s.money;
    const r = computeOffline(s, 7200);
    applyOffline(s, r);
    expect(s.day).toBe(day);
    expect(s.minute).toBe(minute);
    expect(s.reputation).toBe(rep);
    expect(s.money).toBeCloseTo(money + r.money);
  });

  it('gives half the recent experience to workers', () => {
    const s = createInitialState(2);
    s.money = 1e6;
    const w = s.candidates[0];
    if (!w) throw new Error('no candidate');
    s.workers.push(w);
    w.xpRate = 0.1;
    const lvl = w.level;
    applyOffline(s, computeOffline(s, 4 * 3600));
    expect(w.level).toBeGreaterThan(lvl);
  });
});
