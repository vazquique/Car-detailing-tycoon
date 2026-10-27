// Seeded random numbers (mulberry32). The generator state lives in GameState.rng.

export interface RngHolder {
  rng: number;
}

/** Advances the generator stored in `holder` and returns a float in [0, 1). */
export function random(holder: RngHolder): number {
  holder.rng = (holder.rng + 0x6d2b79f5) | 0;
  let t = holder.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randRange(holder: RngHolder, min: number, max: number): number {
  return min + (max - min) * random(holder);
}

export function randInt(holder: RngHolder, min: number, maxInclusive: number): number {
  return Math.floor(randRange(holder, min, maxInclusive + 1));
}

export function chance(holder: RngHolder, p: number): boolean {
  return random(holder) < p;
}

export function pick<T>(holder: RngHolder, items: readonly T[]): T {
  const item = items[Math.floor(random(holder) * items.length)];
  if (item === undefined) throw new Error('pick() on empty list');
  return item;
}

export function weightedPick<T>(
  holder: RngHolder,
  items: readonly T[],
  weight: (item: T) => number,
): T {
  let total = 0;
  for (const item of items) total += Math.max(0, weight(item));
  let roll = random(holder) * total;
  for (const item of items) {
    roll -= Math.max(0, weight(item));
    if (roll < 0) return item;
  }
  const last = items[items.length - 1];
  if (last === undefined) throw new Error('weightedPick() on empty list');
  return last;
}

/** Stateless hash for render-only variation (does not touch game RNG). */
export function hash01(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
