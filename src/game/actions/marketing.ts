// Marketing campaigns and the emergency water truck.
import type { GameState, MarketingId } from '../types';
import { MARKETING_BY_ID } from '../data/marketing';
import { EVENTS } from '../data/events';
import { addEffect, hasEffect, removeEffect } from '../sim/events';
import { produce, spend } from './produce';

export function marketingCost(s: GameState, id: MarketingId): number {
  const def = MARKETING_BY_ID[id];
  return def.scalesWithLocation ? def.cost * (s.location + 1) : def.cost;
}

export type MarketingStatus = 'available' | 'active' | 'owned' | 'used' | 'locked';

export function marketingStatus(s: GameState, id: MarketingId): MarketingStatus {
  const def = MARKETING_BY_ID[id];
  if (s.location < def.minLocation) return 'locked';
  if (def.kind === 'permanent' && s.marketingOwned[id]) return 'owned';
  if (def.kind === 'oncePerRun' && s.prestige.expoUsed) return 'used';
  if (def.kind === 'subscription' && s.socialActive) return 'active';
  if (def.kind === 'timed' && (id === 'flyers' || id === 'influencer') && hasEffect(s, id))
    return 'active';
  return 'available';
}

export function launchMarketing(s: GameState, p: { id: MarketingId }): GameState {
  return produce(s, (d) => {
    const def = MARKETING_BY_ID[p.id];
    if (marketingStatus(d, p.id) !== 'available') return false;
    if (def.kind === 'subscription') {
      // Subscriptions are charged at closing, not now.
      d.socialActive = true;
      return true;
    }
    const cost = marketingCost(d, p.id);
    if (!spend(d, cost)) return false;
    d.dayStats.marketing += cost;
    if (def.kind === 'permanent') d.marketingOwned[p.id] = true;
    if (def.kind === 'oncePerRun') {
      d.prestige.expoUsed = true;
      d.marketingOwned[p.id] = true;
    }
    if (def.kind === 'timed' && (p.id === 'flyers' || p.id === 'influencer'))
      addEffect(d, p.id, def.duration);
    return true;
  });
}

export function cancelSocial(s: GameState): GameState {
  return produce(s, (d) => {
    if (!d.socialActive) return false;
    d.socialActive = false;
    return true;
  });
}

export function pipeCost(s: GameState): number {
  return EVENTS.waterCut.pipeCost * (s.location + 1);
}

export function orderPipe(s: GameState): GameState {
  return produce(s, (d) => {
    if (!hasEffect(d, 'waterCut')) return false;
    const cost = pipeCost(d);
    if (!spend(d, cost)) return false;
    d.dayStats.other += cost;
    removeEffect(d, 'waterCut');
    d.fx.push({ kind: 'event', id: 'waterCutEnd' });
    return true;
  });
}
