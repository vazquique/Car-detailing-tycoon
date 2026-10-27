// Buying equipment, business upgrades, bays and bay levels.
import type { EquipmentId, GameState, ServiceId, UpgradeId } from '../types';
import {
  BUCKET_UPGRADE_BASE,
  EQUIPMENT_BY_ID,
  EQUIPMENT_LEVEL_GROWTH,
  EQUIPMENT_MAX_LEVEL,
} from '../data/equipment';
import { UPGRADE_BY_ID } from '../data/upgrades';
import {
  BAY_BASE_COST,
  BAY_COST_GROWTH,
  BAY_LEVEL_BASE_COST,
  BAY_LEVEL_GROWTH,
  BAY_MAX_LEVEL,
  LOCATIONS,
  STARTING_BAYS,
} from '../data/locations';
import { unlockedServices } from '../sim/economy';
import { newBay } from '../sim/newGame';
import { produce, spend } from './produce';

// ---------- Equipment ----------

/** Cost of the next level of a piece of equipment (level 0 = buying it). */
export function equipmentCost(s: GameState, id: EquipmentId): number {
  const def = EQUIPMENT_BY_ID[id];
  const lvl = s.equipment[id];
  if (lvl <= 0) return def.cost;
  const base = def.initial ? BUCKET_UPGRADE_BASE : def.cost;
  return Math.round(base * Math.pow(EQUIPMENT_LEVEL_GROWTH, lvl));
}

export type EquipmentBlock = 'max' | 'location' | 'requires' | null;

export function equipmentBlock(s: GameState, id: EquipmentId): EquipmentBlock {
  const def = EQUIPMENT_BY_ID[id];
  const lvl = s.equipment[id];
  if (lvl >= EQUIPMENT_MAX_LEVEL) return 'max';
  if (lvl === 0 && s.location < def.minLocation) return 'location';
  if (lvl === 0 && def.requires?.some((r) => s.equipment[r] <= 0)) return 'requires';
  return null;
}

function pushNewServices(s: GameState, before: ServiceId[]): void {
  for (const id of unlockedServices(s)) {
    if (!before.includes(id)) s.fx.push({ kind: 'unlockService', id });
  }
}

export function buyEquipment(s: GameState, p: { id: EquipmentId }): GameState {
  return produce(s, (d) => {
    if (equipmentBlock(d, p.id) !== null) return false;
    const before = unlockedServices(d);
    if (!spend(d, equipmentCost(d, p.id))) return false;
    d.equipment[p.id]++;
    pushNewServices(d, before);
    return true;
  });
}

// ---------- Business upgrades ----------

export function upgradeCost(s: GameState, id: UpgradeId): number {
  const def = UPGRADE_BY_ID[id];
  return Math.round(def.cost * Math.pow(def.growth, s.upgrades[id]));
}

export function upgradeMaxed(s: GameState, id: UpgradeId): boolean {
  return s.upgrades[id] >= UPGRADE_BY_ID[id].maxLevel;
}

export function buyUpgrade(s: GameState, p: { id: UpgradeId }): GameState {
  return produce(s, (d) => {
    const def = UPGRADE_BY_ID[p.id];
    if (upgradeMaxed(d, p.id) || d.location < def.minLocation) return false;
    if (!spend(d, upgradeCost(d, p.id))) return false;
    d.upgrades[p.id]++;
    return true;
  });
}

// ---------- Bays ----------

export function maxBays(s: GameState): number {
  return LOCATIONS[s.location]?.maxBays ?? STARTING_BAYS;
}

export function bayCost(s: GameState): number {
  const purchased = Math.max(0, s.bays.length - STARTING_BAYS);
  return Math.round(BAY_BASE_COST * Math.pow(BAY_COST_GROWTH, purchased));
}

export function buyBay(s: GameState): GameState {
  return produce(s, (d) => {
    if (d.bays.length >= maxBays(d)) return false;
    if (!spend(d, bayCost(d))) return false;
    d.bays.push(newBay(d.nextId++, false));
    return true;
  });
}

export function bayLevelCost(level: number): number {
  return Math.round(BAY_LEVEL_BASE_COST * Math.pow(BAY_LEVEL_GROWTH, level));
}

export function upgradeBay(s: GameState, p: { bayId: number }): GameState {
  return produce(s, (d) => {
    const bay = d.bays.find((b) => b.id === p.bayId);
    if (!bay || bay.level >= BAY_MAX_LEVEL) return false;
    if (!spend(d, bayLevelCost(bay.level))) return false;
    bay.level++;
    return true;
  });
}
