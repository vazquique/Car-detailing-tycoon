// Job board candidates, XP and levels.
import type { GameState, Worker } from '../types';
import { STAFF, TRAITS, TRAIT_BY_ID } from '../data/staff';
import { LOCATIONS } from '../data/locations';
import { WORKER_NAMES } from '../data/names';
import { PRESTIGE } from '../data/prestige';
import { SKIN_TONES } from '../palette';
import { pick, randInt, randRange } from '../rng';
import { clamp } from './economy';

export function xpToNext(level: number): number {
  return STAFF.xpBase * Math.pow(STAFF.xpGrowth, level - 1);
}

export function courseCost(level: number): number {
  return Math.round(STAFF.courseBase * Math.pow(STAFF.courseGrowth, level - 1));
}

/** 0..1 score of a worker's base stats. */
export function statScore(speed: number, quality: number): number {
  const [s0, s1] = STAFF.speedRange;
  const [q0, q1] = STAFF.qualityRange;
  return clamp(0, 1, ((speed - s0) / (s1 - s0) + (quality - q0) / (q1 - q0)) / 2);
}

export function generateCandidate(s: GameState): Worker {
  const loc = LOCATIONS[s.location] ?? LOCATIONS[0];
  const [minL, maxL] = loc?.candidateLevel ?? [1, 1];
  const level = Math.min(
    STAFF.maxLevel,
    randInt(s, minL, maxL) + PRESTIGE.schoolLevels * s.prestige.nodes.school,
  );
  const speed = Math.round(randRange(s, STAFF.speedRange[0], STAFF.speedRange[1]) * 100) / 100;
  const quality =
    Math.round(randRange(s, STAFF.qualityRange[0], STAFF.qualityRange[1]) * 100) / 100;
  const trait = pick(s, TRAITS).id;
  const score = statScore(speed, quality);
  const [c0, c1] = STAFF.commissionRange;
  const commission =
    Math.round((c0 + (c1 - c0) * clamp(0, 1, score * 0.8 + (level - 1) * 0.08)) * 100) / 100;
  const hireCost =
    Math.round(
      (STAFF.hireCostBase *
        (0.7 + score * 0.8) *
        Math.pow(STAFF.hireCostPerLevel, level - 1) *
        Math.pow(STAFF.hireCostPerLocation, s.location)) /
        50,
    ) * 50;
  const taken = new Set(s.workers.map((w) => w.name));
  const free = WORKER_NAMES.filter((n) => !taken.has(n));
  return {
    id: s.nextId++,
    name: pick(s, free.length > 0 ? free : WORKER_NAMES),
    level,
    xp: 0,
    speed,
    quality,
    trait,
    commission,
    hireCost: Math.max(STAFF.hireCostBase, hireCost),
    look: randInt(s, 0, SKIN_TONES.length - 1),
    carsDone: 0,
    xpRate: 0,
    xpThisSecond: 0,
  };
}

export function refreshCandidates(s: GameState): void {
  s.candidates = [];
  for (let i = 0; i < STAFF.candidateCount; i++) s.candidates.push(generateCandidate(s));
}

/** Adds XP and handles level ups. */
export function giveXp(s: GameState, w: Worker, amount: number, emit = true): void {
  if (w.level >= STAFF.maxLevel) return;
  const gained = amount * TRAIT_BY_ID[w.trait].xpMult;
  w.xp += gained;
  w.xpThisSecond += gained;
  while (w.level < STAFF.maxLevel && w.xp >= xpToNext(w.level)) {
    w.xp -= xpToNext(w.level);
    w.level++;
    if (emit) s.fx.push({ kind: 'levelUp', workerId: w.id });
  }
  if (w.level >= STAFF.maxLevel) w.xp = 0;
}
