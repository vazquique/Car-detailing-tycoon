import type { DaySummary, GameState } from '../types';
import { SERVICES } from './services';

export interface AchievementDef {
  id: string;
  icon: AchievementIcon;
  /** Checked every tick (cheap) or only when the day ends. */
  check: (s: GameState) => boolean;
  checkDay?: (s: GameState, day: DaySummary) => boolean;
}

export type AchievementIcon =
  | 'car'
  | 'cars'
  | 'user'
  | 'users'
  | 'money'
  | 'star'
  | 'shield'
  | 'mud'
  | 'crown'
  | 'file'
  | 'wrench'
  | 'building'
  | 'store'
  | 'hand'
  | 'sparkles'
  | 'gem'
  | 'trophy';

const never = (): boolean => false;

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'firstCustomer', icon: 'car', check: (s) => s.stats.carsServed >= 1 },
  { id: 'cars10', icon: 'car', check: (s) => s.stats.carsServed >= 10 },
  { id: 'cars100', icon: 'cars', check: (s) => s.stats.carsServed >= 100 },
  { id: 'cars1000', icon: 'cars', check: (s) => s.stats.carsServed >= 1000 },
  { id: 'cars10000', icon: 'trophy', check: (s) => s.stats.carsServed >= 10000 },
  { id: 'firstHire', icon: 'user', check: (s) => s.stats.workersHired >= 1 },
  { id: 'staff10', icon: 'users', check: (s) => s.workers.length >= 10 },
  { id: 'million', icon: 'money', check: (s) => s.stats.totalEarned >= 1e6 },
  { id: 'billion', icon: 'gem', check: (s) => s.stats.totalEarned >= 1e9 },
  {
    id: 'rep49Day',
    icon: 'star',
    check: never,
    checkDay: (_s, d) => d.minRep >= 4.9 && d.repEnd >= 4.9,
  },
  {
    id: 'noLostDay',
    icon: 'shield',
    check: never,
    checkDay: (_s, d) => d.lost === 0 && d.angry === 0 && d.carsServed >= 10,
  },
  { id: 'muddy100', icon: 'mud', check: (s) => s.stats.muddyCars >= 100 },
  { id: 'firstClassic', icon: 'crown', check: (s) => s.stats.classicsServed >= 1 },
  { id: 'firstContract', icon: 'file', check: (s) => s.stats.contractsDone >= 1 },
  { id: 'contracts10', icon: 'file', check: (s) => s.stats.contractsDone >= 10 },
  {
    id: 'allServices',
    icon: 'wrench',
    check: (s) => SERVICES.every((sv) => sv.requires.every((e) => s.equipment[e] > 0)),
  },
  { id: 'location2', icon: 'store', check: (s) => s.location >= 1 },
  { id: 'location3', icon: 'building', check: (s) => s.location >= 2 },
  { id: 'location4', icon: 'sparkles', check: (s) => s.location >= 3 },
  { id: 'firstFranchise', icon: 'crown', check: (s) => s.stats.franchises >= 1 },
  { id: 'taps1000', icon: 'hand', check: (s) => s.stats.taps >= 1000 },
  { id: 'handWash50', icon: 'hand', check: (s) => s.stats.handWashes >= 50 },
  { id: 'fiveStars', icon: 'star', check: (s) => s.reviews.some((r) => r.stars === 5) },
  { id: 'tips10k', icon: 'money', check: (s) => s.stats.tips >= 10000 },
  { id: 'bigDay', icon: 'trophy', check: (s) => s.stats.bestDayProfit >= 100000 },
];
