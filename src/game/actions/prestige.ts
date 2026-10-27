// Franchise (prestige): reset the run in exchange for Franchise Points (PF).
import type { GameState, PrestigeNodeId } from '../types';
import { PRESTIGE, PRESTIGE_NODE_BY_ID } from '../data/prestige';
import { createInitialState } from '../sim/newGame';
import { produce } from './produce';

/** PF earned by the current run if it franchised now. */
export function pfForRun(s: GameState): number {
  return Math.floor(Math.sqrt(Math.max(0, s.runStats.totalEarned) / PRESTIGE.divisor));
}

export function canFranchise(s: GameState): boolean {
  return s.location >= PRESTIGE.minLocation && pfForRun(s) >= 1;
}

export function franchise(s: GameState): GameState {
  if (!canFranchise(s)) return s;
  const gained = pfForRun(s);
  const stats = { ...s.stats, franchises: s.stats.franchises + 1 };
  const next = createInitialState((s.rng ^ 0x5bd1e995) | 0, {
    stats,
    achievements: [...s.achievements],
    prestige: {
      ...s.prestige,
      points: s.prestige.points + gained,
      earnedTotal: s.prestige.earnedTotal + gained,
    },
  });
  next.fx.push({ kind: 'event', id: 'franchised' });
  return next;
}

export function nodeCost(id: PrestigeNodeId, currentLevel: number): number {
  return PRESTIGE_NODE_BY_ID[id].baseCost * (currentLevel + 1);
}

export function buyNode(s: GameState, p: { id: PrestigeNodeId }): GameState {
  return produce(s, (d) => {
    const def = PRESTIGE_NODE_BY_ID[p.id];
    const lvl = d.prestige.nodes[p.id];
    if (lvl >= def.maxLevel) return false;
    const cost = nodeCost(p.id, lvl);
    if (d.prestige.points < cost) return false;
    d.prestige.points -= cost;
    d.prestige.nodes[p.id] = lvl + 1;
    // Some nodes apply right away to the current run.
    if (p.id === 'seedCapital') {
      const prev = PRESTIGE.seedCapital[lvl] ?? 0;
      const now = PRESTIGE.seedCapital[lvl + 1] ?? 0;
      if (d.runStats.playSeconds < 60) d.money += now - prev;
    }
    if (p.id === 'inheritedTools') {
      for (const id of PRESTIGE.inheritedTools[lvl + 1] ?? []) {
        if (d.equipment[id] <= 0) d.equipment[id] = 1;
      }
    }
    return true;
  });
}
