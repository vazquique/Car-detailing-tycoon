// The fixed-step simulation. tick() mutates the state in place for speed.
import type { GameState } from '../types';
import { CALENDAR } from '../data/economy';
import { updateArrivals, updatePatience } from './arrivals';
import { rollIncomeSecond, updateBays } from './bays';
import { updateContracts } from './contracts';
import { runPlannedEvents, updateEffects } from './events';
import { closeDay, startDay } from './day';
import { checkAchievements, checkMilestones } from './achievements';

/** Advances the world by dt real seconds (normally TICK = 0.1). */
export function tick(s: GameState, dt: number): void {
  s.stats.playSeconds += dt;
  s.runStats.playSeconds += dt;
  if (s.hintCooldown > 0) s.hintCooldown -= dt;

  if (s.night > 0) {
    s.night -= dt;
    if (s.night <= 0) startDay(s);
  } else {
    s.minute += dt * CALENDAR.minutesPerSecond;
    updateEffects(s, dt);
    runPlannedEvents(s);
    updateArrivals(s, dt);
    updateContracts(s, dt);
    updatePatience(s, dt);
    updateBays(s, dt);
    if (s.minute >= CALENDAR.closeMinute) closeDay(s);
  }

  s.incomeSecondTimer += dt;
  if (s.incomeSecondTimer >= 1) {
    s.incomeSecondTimer -= 1;
    rollIncomeSecond(s);
    for (const w of s.workers) {
      w.xpRate = w.xpRate * 0.99 + w.xpThisSecond * 0.01;
      w.xpThisSecond = 0;
    }
    checkAchievements(s);
    checkMilestones(s);
  }
}

/** Runs many ticks (tests, debug fast-forward). */
export function runTicks(s: GameState, seconds: number, dt = 0.1): void {
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) tick(s, dt);
}
