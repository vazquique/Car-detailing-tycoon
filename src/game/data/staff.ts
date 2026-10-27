import type { SupportRoleId, TraitId } from '../types';

export interface TraitDef {
  id: TraitId;
  speedMult: number;
  qualityMult: number;
  tipMult: number;
  xpMult: number;
  /** Extra speed between 8:00 and 11:00. */
  morningSpeed: number;
  /** Ignores the muddy time multiplier. */
  ignoresMud: boolean;
}

export const TRAITS: readonly TraitDef[] = [
  {
    id: 'fast',
    speedMult: 1.15,
    qualityMult: 1,
    tipMult: 1,
    xpMult: 1,
    morningSpeed: 1,
    ignoresMud: false,
  },
  {
    id: 'perfectionist',
    speedMult: 0.95,
    qualityMult: 1.1,
    tipMult: 1,
    xpMult: 1,
    morningSpeed: 1,
    ignoresMud: false,
  },
  {
    id: 'chatty',
    speedMult: 1,
    qualityMult: 1,
    tipMult: 1.3,
    xpMult: 1,
    morningSpeed: 1,
    ignoresMud: false,
  },
  {
    id: 'earlyBird',
    speedMult: 1,
    qualityMult: 1,
    tipMult: 1,
    xpMult: 1,
    morningSpeed: 1.2,
    ignoresMud: false,
  },
  {
    id: 'apprentice',
    speedMult: 1,
    qualityMult: 1,
    tipMult: 1,
    xpMult: 1.5,
    morningSpeed: 1,
    ignoresMud: false,
  },
  {
    id: 'allTerrain',
    speedMult: 1,
    qualityMult: 1,
    tipMult: 1,
    xpMult: 1,
    morningSpeed: 1,
    ignoresMud: true,
  },
];

export const TRAIT_BY_ID: Readonly<Record<TraitId, TraitDef>> = Object.fromEntries(
  TRAITS.map((t) => [t.id, t]),
) as Record<TraitId, TraitDef>;

export const STAFF = {
  candidateCount: 3,
  speedRange: [0.8, 1.3] as [number, number],
  qualityRange: [0.75, 1.15] as [number, number],
  commissionRange: [0.25, 0.45] as [number, number],
  /** Minimum hire cost; scales with stats, level and location. */
  hireCostBase: 1200,
  hireCostPerLevel: 1.8,
  hireCostPerLocation: 3.2,
  /** Refresh cost = this × (location index + 1). */
  refreshCost: 200,
  maxLevel: 10,
  speedPerLevel: 0.05,
  qualityPerLevel: 0.03,
  /** XP needed to go from level L to L+1 = xpBase × xpGrowth^(L-1). XP = 1 per car × service tier weight. */
  xpBase: 6,
  xpGrowth: 1.55,
  /** Instant course cost to go from level L to L+1 = courseBase × courseGrowth^(L-1). */
  courseBase: 1500,
  courseGrowth: 2.4,
  /** Owner (you) in "Tu bahía". */
  ownerSpeed: 0.8,
  ownerQuality: 1.0,
  ownerLevel: 10,
} as const;

export interface SupportRoleDef {
  id: SupportRoleId;
  hireCost: number;
  dailyWage: number;
  minLocation: number;
}

export const SUPPORT_ROLES: readonly SupportRoleDef[] = [
  { id: 'receptionist', hireCost: 15000, dailyWage: 400, minLocation: 1 },
  { id: 'manager', hireCost: 150000, dailyWage: 3000, minLocation: 2 },
];

export const RECEPTIONIST = { patienceMult: 1.3, upsellChance: 0.15 } as const;
export const MANAGER = { offlineEfficiency: 0.25, offlineCapHours: 2, tapsPerSecond: 2 } as const;
