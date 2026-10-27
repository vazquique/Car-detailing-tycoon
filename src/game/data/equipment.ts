import type { EquipmentId, ServiceId } from '../types';

export interface EquipmentDef {
  id: EquipmentId;
  cost: number;
  /** Services that get the per-level time and quality bonus. */
  affects: ServiceId[];
  /** Extra time multiplier on these services when owned. */
  timeBonus?: { services: ServiceId[]; mult: number };
  /** Extra quality multiplier on these services when owned. */
  qualityBonus?: { services: ServiceId[]; mult: number };
  /** Equipment that must be owned first. */
  requires?: EquipmentId[];
  /** Minimum location index to buy. */
  minLocation: number;
  /** Owned from the start. */
  initial?: boolean;
}

export const EQUIPMENT_MAX_LEVEL = 5;
export const EQUIPMENT_LEVEL_GROWTH = 2.2;
/** Per level above 1: time multiplier and quality bonus. */
export const EQUIPMENT_TIME_PER_LEVEL = 0.92;
export const EQUIPMENT_QUALITY_PER_LEVEL = 0.03;
/** Base cost to upgrade the starting bucket (it is free at level 1). */
export const BUCKET_UPGRADE_BASE = 250;

export const EQUIPMENT: readonly EquipmentDef[] = [
  { id: 'bucket', cost: 0, affects: ['exterior'], minLocation: 0, initial: true },
  {
    id: 'pressureWasher',
    cost: 600,
    affects: ['exterior', 'engine'],
    timeBonus: { services: ['exterior'], mult: 0.6 },
    minLocation: 0,
  },
  { id: 'vacuum', cost: 900, affects: ['interior'], minLocation: 0 },
  { id: 'wheelKit', cost: 1200, affects: ['wheels'], minLocation: 0 },
  { id: 'waxKit', cost: 2500, affects: ['wax'], minLocation: 0 },
  {
    id: 'foamCannon',
    cost: 4000,
    affects: ['exterior'],
    timeBonus: { services: ['exterior'], mult: 0.85 },
    qualityBonus: { services: ['exterior'], mult: 1.08 },
    minLocation: 0,
  },
  {
    id: 'engineKit',
    cost: 6000,
    affects: ['engine'],
    requires: ['pressureWasher'],
    minLocation: 0,
  },
  { id: 'headlightKit', cost: 9000, affects: ['headlights'], minLocation: 0 },
  { id: 'extractor', cost: 18000, affects: ['upholstery'], minLocation: 0 },
  { id: 'clayKit', cost: 25000, affects: ['clay'], minLocation: 0 },
  { id: 'orbitalPolisher', cost: 60000, affects: ['polish'], minLocation: 0 },
  { id: 'rotaryPolisher', cost: 180000, affects: ['correction'], minLocation: 0 },
  {
    id: 'inspectionLamps',
    cost: 250000,
    affects: ['correction'],
    qualityBonus: { services: ['polish'], mult: 1.05 },
    minLocation: 0,
  },
  { id: 'curingBooth', cost: 900000, affects: ['ceramic'], minLocation: 2 },
  { id: 'ppfPlotter', cost: 3500000, affects: ['ppf'], minLocation: 3 },
];

export const EQUIPMENT_BY_ID: Readonly<Record<EquipmentId, EquipmentDef>> = Object.fromEntries(
  EQUIPMENT.map((e) => [e.id, e]),
) as Record<EquipmentId, EquipmentDef>;
