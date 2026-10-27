import type { UpgradeId } from '../types';

export interface UpgradeDef {
  id: UpgradeId;
  cost: number;
  growth: number;
  maxLevel: number;
  minLocation: number;
}

export const UPGRADES: readonly UpgradeDef[] = [
  { id: 'shampoo', cost: 1000, growth: 1.8, maxLevel: 10, minLocation: 0 },
  { id: 'microfiber', cost: 2000, growth: 1.8, maxLevel: 10, minLocation: 0 },
  { id: 'softWater', cost: 15000, growth: 2, maxLevel: 5, minLocation: 0 },
  { id: 'waitingRoom', cost: 5000, growth: 2, maxLevel: 5, minLocation: 0 },
  { id: 'coffeeWifi', cost: 8000, growth: 2, maxLevel: 5, minLocation: 0 },
  { id: 'neonSign', cost: 3000, growth: 1.9, maxLevel: 10, minLocation: 0 },
  { id: 'coveredQueue', cost: 6000, growth: 2, maxLevel: 5, minLocation: 0 },
  { id: 'supervision', cost: 4000, growth: 1.7, maxLevel: 10, minLocation: 0 },
  { id: 'cardTerminal', cost: 10000, growth: 1, maxLevel: 1, minLocation: 0 },
  { id: 'awning', cost: 7000, growth: 1, maxLevel: 1, minLocation: 0 },
  { id: 'cistern', cost: 40000, growth: 1, maxLevel: 1, minLocation: 0 },
  { id: 'permits', cost: 20000, growth: 1, maxLevel: 1, minLocation: 0 },
];

export const UPGRADE_BY_ID: Readonly<Record<UpgradeId, UpgradeDef>> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u]),
) as Record<UpgradeId, UpgradeDef>;

/** Effect sizes per level. */
export const UPGRADE_EFFECTS = {
  shampooQuality: 0.03,
  microfiberQuality: 0.02,
  microfiberTime: 0.02,
  softWaterQuality: 0.04,
  waitingRoomPatience: 0.15,
  coffeeTips: 0.08,
  coffeePatience: 0.05,
  neonArrivals: 0.05,
  coveredQueueSlots: 1,
  supervisionTap: 0.25,
  terminalVip: 0.1,
  terminalTips: 0.05,
  awningRainPenalty: 0.2,
} as const;
