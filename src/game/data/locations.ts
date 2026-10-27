export interface LocationDef {
  /** Move cost (MXN). */
  cost: number;
  /** Daily rent charged at closing. */
  rent: number;
  maxBays: number;
  queueSlots: number;
  /** Seconds between arrivals at base rate. */
  arrivalSeconds: number;
  /** Max worker level for new candidates. */
  candidateLevel: [number, number];
}

export const LOCATIONS: readonly LocationDef[] = [
  { cost: 0, rent: 0, maxBays: 2, queueSlots: 3, arrivalSeconds: 14, candidateLevel: [1, 1] },
  { cost: 25000, rent: 800, maxBays: 4, queueSlots: 5, arrivalSeconds: 9, candidateLevel: [1, 2] },
  {
    cost: 600000,
    rent: 9000,
    maxBays: 8,
    queueSlots: 8,
    arrivalSeconds: 6,
    candidateLevel: [2, 3],
  },
  {
    cost: 12000000,
    rent: 120000,
    maxBays: 12,
    queueSlots: 10,
    arrivalSeconds: 4.5,
    candidateLevel: [2, 3],
  },
];

export const STARTING_BAYS = 2;
export const BAY_BASE_COST = 1500;
export const BAY_COST_GROWTH = 1.9;
export const BAY_MAX_LEVEL = 10;
export const BAY_LEVEL_SPEED = 0.06;
export const BAY_LEVEL_BASE_COST = 800;
export const BAY_LEVEL_GROWTH = 1.6;
