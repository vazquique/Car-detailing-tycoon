import type { EquipmentId, PrestigeNodeId } from '../types';

export interface PrestigeNodeDef {
  id: PrestigeNodeId;
  /** Cost of level n = baseCost × n. */
  baseCost: number;
  maxLevel: number;
}

export const PRESTIGE_NODES: readonly PrestigeNodeDef[] = [
  { id: 'seedCapital', baseCost: 1, maxLevel: 5 },
  { id: 'inheritedTools', baseCost: 2, maxLevel: 3 },
  { id: 'school', baseCost: 2, maxLevel: 5 },
  { id: 'brand', baseCost: 1, maxLevel: 10 },
  { id: 'loyalty', baseCost: 1, maxLevel: 10 },
  { id: 'premiumPrice', baseCost: 2, maxLevel: 10 },
  { id: 'fastHands', baseCost: 1, maxLevel: 10 },
  { id: 'trustedPartner', baseCost: 3, maxLevel: 3 },
  { id: 'fleetContacts', baseCost: 2, maxLevel: 3 },
];

export const PRESTIGE_NODE_BY_ID: Readonly<Record<PrestigeNodeId, PrestigeNodeDef>> =
  Object.fromEntries(PRESTIGE_NODES.map((n) => [n.id, n])) as Record<
    PrestigeNodeId,
    PrestigeNodeDef
  >;

export const PRESTIGE = {
  /** PF = floor(sqrt(runEarnings / divisor)) */
  divisor: 130_000,
  /** Location index required to franchise. */
  minLocation: 3,
  seedCapital: [0, 1000, 5000, 25000, 100000, 500000] as readonly number[],
  inheritedTools: [
    [],
    ['pressureWasher', 'vacuum'],
    ['pressureWasher', 'vacuum', 'waxKit', 'foamCannon'],
    ['pressureWasher', 'vacuum', 'waxKit', 'foamCannon', 'extractor', 'clayKit'],
  ] as readonly (readonly EquipmentId[])[],
  schoolLevels: 1,
  brandArrivals: 0.05,
  loyaltyPatience: 0.05,
  premiumPrice: 0.04,
  fastHands: 0.04,
  trustedOfflineHours: 2,
  trustedOfflineEfficiency: 0.15,
  fleetPay: 0.2,
} as const;
