// Core economy numbers. Tuned by tests/balance.test.ts.

export const ECONOMY = {
  startingMoney: 150,
  startingReputation: 3.0,
  repMin: 1,
  repMax: 5,
  /** fair = base × (fairBase + fairPerStar × rep) */
  fairBase: 0.75,
  fairPerStar: 0.1,
  /** Player price multiplier range and step (of base price). */
  priceMin: 0.5,
  priceMax: 2.0,
  priceStep: 0.05,
  qualityBase: 0.72,
  qualityMin: 0.4,
  qualityMax: 1.0,
  qualityNoise: 0.05,
  handBonus: 1.1,
  payBase: 0.6,
  payQuality: 0.4,
  satQuality: 0.5,
  satWait: 0.3,
  satValue: 0.2,
  tipMax: 0.25,
  tipMinSatisfaction: 0.6,
  reviewChance: 0.25,
  starNoise: 0.3,
  repAlpha: 0.05,
  suppliesRate: 0.08,
  basePatience: 45,
  vipPatienceMult: 0.6,
  /** factorPrecio = clamp(min, max, (fair / player) ^ exp) */
  priceExp: 1.6,
  priceFactorMin: 0.25,
  priceFactorMax: 1.6,
  /** factorReputación = repBase + repPerStar × rep */
  repArrivalBase: 0.5,
  repArrivalPerStar: 0.2,
  /** +X seconds of work per tap */
  tapSeconds: 0.4,
  maxTapsPerSecond: 8,
  rejectPenalty: 0.01,
  /** Chance a walk-in asks for a service you don't offer yet. */
  hintChance: 0.05,
  hintCooldown: 120,
  /** Chance a walk-in asks for an exterior wash. */
  exteriorChance: 0.88,
  /** Number of services requested: weights for 1, 2, 3, 4. */
  serviceCountWeights: [34, 36, 21, 9],
  /** Achievements: +1% income each. PF: +3% income each. */
  achievementIncome: 0.01,
  prestigeIncome: 0.03,
  /** Owner hand-wash: progress speed of the scrub mini-game target time (seconds per step). */
  handStepTargetSeconds: 4,
  /** Fraction of the area to cover to finish a scrub step. */
  handCoverage: 0.85,
} as const;

/** Arrival curve by game hour (8..20). */
export const HOUR_CURVE: readonly { from: number; to: number; mult: number }[] = [
  { from: 8 * 60, to: 10 * 60, mult: 0.7 },
  { from: 10 * 60, to: 14 * 60, mult: 1.0 },
  { from: 14 * 60, to: 17 * 60, mult: 1.2 },
  { from: 17 * 60, to: 19.5 * 60, mult: 0.9 },
];

export const CALENDAR = {
  openMinute: 8 * 60,
  closeMinute: 20 * 60,
  lastArrivalMinute: 19 * 60 + 30,
  /** Game minutes per real second. */
  minutesPerSecond: 3,
  nightSeconds: 2,
  daysPerMonth: 30,
  monthsPerYear: 12,
  daysPerWeek: 7,
  morningEnd: 11 * 60,
} as const;

export const OFFLINE = {
  baseCapHours: 4,
  baseEfficiency: 0.5,
  maxEfficiency: 1,
  xpShare: 0.5,
  /** Seconds of history used to compute the offline rate. */
  historySeconds: 180,
} as const;

export const XP = {
  /** XP per car = xpPerCar + xpPerTier × highest service tier. */
  perCar: 1,
  perTier: 0.5,
} as const;
