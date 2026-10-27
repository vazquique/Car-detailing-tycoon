import type { EquipmentId, HandStep, ServiceId } from '../types';

export interface ServiceDef {
  id: ServiceId;
  /** Base price in MXN for a compact car. */
  basePrice: number;
  /** Base time in real seconds for a sedan and a worker with speed 1.0. */
  baseTime: number;
  requires: EquipmentId[];
  minLevel: number;
  /** Relative request weight for walk-in customers. */
  demand: number;
  /** Price tier 0..4, expensive cars lean to higher tiers. */
  tier: number;
  /** Steps the owner can do by hand in the scrub mini-game. */
  handSteps: HandStep[];
  /** Cannot be done during a water cut (unless the shop has a cistern). */
  needsWater: boolean;
  /** Minimum location index where it can be offered. */
  minLocation: number;
}

export const SERVICES: readonly ServiceDef[] = [
  {
    id: 'exterior',
    basePrice: 100,
    baseTime: 20,
    requires: ['bucket'],
    minLevel: 1,
    demand: 10,
    tier: 0,
    handSteps: ['soap', 'rinse', 'dry'],
    needsWater: true,
    minLocation: 0,
  },
  {
    id: 'interior',
    basePrice: 80,
    baseTime: 18,
    requires: ['vacuum'],
    minLevel: 1,
    demand: 7,
    tier: 0,
    handSteps: [],
    needsWater: false,
    minLocation: 0,
  },
  {
    id: 'wheels',
    basePrice: 120,
    baseTime: 12,
    requires: ['wheelKit'],
    minLevel: 1,
    demand: 6,
    tier: 0,
    handSteps: [],
    needsWater: false,
    minLocation: 0,
  },
  {
    id: 'wax',
    basePrice: 300,
    baseTime: 30,
    requires: ['waxKit'],
    minLevel: 1,
    demand: 5,
    tier: 1,
    handSteps: ['wax'],
    needsWater: false,
    minLocation: 0,
  },
  {
    id: 'engine',
    basePrice: 250,
    baseTime: 25,
    requires: ['pressureWasher', 'engineKit'],
    minLevel: 2,
    demand: 3,
    tier: 1,
    handSteps: [],
    needsWater: true,
    minLocation: 0,
  },
  {
    id: 'headlights',
    basePrice: 400,
    baseTime: 30,
    requires: ['headlightKit'],
    minLevel: 2,
    demand: 3,
    tier: 1,
    handSteps: [],
    needsWater: false,
    minLocation: 0,
  },
  {
    id: 'upholstery',
    basePrice: 600,
    baseTime: 45,
    requires: ['extractor'],
    minLevel: 3,
    demand: 3,
    tier: 2,
    handSteps: [],
    needsWater: true,
    minLocation: 0,
  },
  {
    id: 'clay',
    basePrice: 500,
    baseTime: 40,
    requires: ['clayKit'],
    minLevel: 3,
    demand: 3,
    tier: 2,
    handSteps: [],
    needsWater: false,
    minLocation: 0,
  },
  {
    id: 'polish',
    basePrice: 1500,
    baseTime: 90,
    requires: ['orbitalPolisher'],
    minLevel: 4,
    demand: 2.5,
    tier: 3,
    handSteps: ['polish'],
    needsWater: false,
    minLocation: 0,
  },
  {
    id: 'correction',
    basePrice: 4500,
    baseTime: 180,
    requires: ['rotaryPolisher', 'inspectionLamps'],
    minLevel: 6,
    demand: 1.6,
    tier: 3,
    handSteps: [],
    needsWater: false,
    minLocation: 0,
  },
  {
    id: 'ceramic',
    basePrice: 9000,
    baseTime: 240,
    requires: ['curingBooth'],
    minLevel: 7,
    demand: 1.2,
    tier: 4,
    handSteps: [],
    needsWater: false,
    minLocation: 2,
  },
  {
    id: 'ppf',
    basePrice: 25000,
    baseTime: 420,
    requires: ['ppfPlotter'],
    minLevel: 9,
    demand: 0.8,
    tier: 4,
    handSteps: [],
    needsWater: false,
    minLocation: 3,
  },
];

export const SERVICE_BY_ID: Readonly<Record<ServiceId, ServiceDef>> = Object.fromEntries(
  SERVICES.map((s) => [s.id, s]),
) as Record<ServiceId, ServiceDef>;

export const SERVICE_IDS: readonly ServiceId[] = SERVICES.map((s) => s.id);

/** Ticket labels by the most expensive tier ordered. */
export const PACKAGE_BY_TIER = ['basic', 'basic', 'complete', 'premium', 'showroom'] as const;
export type PackageId = 'basic' | 'complete' | 'premium' | 'showroom';
