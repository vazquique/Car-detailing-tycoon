// Achievement checks and run milestones.
import type { DaySummary, GameState } from '../types';
import { ACHIEVEMENTS } from '../data/achievements';

export function checkAchievements(s: GameState): void {
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id)) continue;
    if (a.check(s)) unlockAchievement(s, a.id);
  }
}

export function checkDayAchievements(s: GameState, day: DaySummary): void {
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id) || !a.checkDay) continue;
    if (a.checkDay(s, day)) unlockAchievement(s, a.id);
  }
}

export function unlockAchievement(s: GameState, id: string): void {
  if (s.achievements.includes(id)) return;
  s.achievements.push(id);
  s.fx.push({ kind: 'achievement', id });
}

export type MilestoneId =
  | 'firstWash'
  | 'pressureWasher'
  | 'firstHire'
  | 'location1'
  | 'location2'
  | 'location3'
  | 'franchise';

export const MILESTONE_ORDER: readonly MilestoneId[] = [
  'firstWash',
  'pressureWasher',
  'firstHire',
  'location1',
  'location2',
  'location3',
  'franchise',
];

/** Records the play time when each milestone is first reached in this run. */
export function checkMilestones(s: GameState): void {
  const t = s.runStats.playSeconds;
  const mark = (id: MilestoneId, cond: boolean): void => {
    if (cond && s.milestones[id] === undefined) s.milestones[id] = t;
  };
  mark('firstWash', s.runStats.carsServed >= 1);
  mark('pressureWasher', s.equipment.pressureWasher > 0 && s.runStats.carsServed >= 1);
  mark('firstHire', s.workers.length > 0);
  mark('location1', s.location >= 1);
  mark('location2', s.location >= 2);
  mark('location3', s.location >= 3);
}
