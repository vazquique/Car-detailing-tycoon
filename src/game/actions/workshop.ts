// Workshop actions: rejecting customers, contracts and the owner's hand wash.
import type { GameState } from '../types';
import { ECONOMY } from '../data/economy';
import { adjustReputation } from '../sim/reputation';
import { activateContract } from '../sim/contracts';
import { finishHandWash, startHandWash } from '../sim/bays';
import { produce } from './produce';

export function rejectCustomer(s: GameState, p: { customerId: number }): GameState {
  return produce(s, (d) => {
    const c = d.queue.find((x) => x.id === p.customerId);
    if (!c || c.contractId !== null) return false;
    d.queue = d.queue.filter((x) => x.id !== p.customerId);
    adjustReputation(d, -ECONOMY.rejectPenalty);
    return true;
  });
}

export function acceptContract(s: GameState, p: { offerId: number }): GameState {
  return produce(s, (d) => {
    const offer = d.contractOffers.find((o) => o.id === p.offerId);
    if (!offer) return false;
    d.contractOffers = d.contractOffers.filter((o) => o.id !== p.offerId);
    d.contracts.push(activateContract(d, offer));
    return true;
  });
}

export function beginHandWash(s: GameState, p: { bayId: number }): GameState {
  return produce(s, (d) => startHandWash(d, p.bayId));
}

export function endHandWash(
  s: GameState,
  p: { bayId: number; fraction: number; quality: number },
): GameState {
  return produce(s, (d) => {
    const bay = d.bays.find((b) => b.id === p.bayId);
    if (!bay?.job?.handActive) return false;
    finishHandWash(d, p.bayId, p.fraction, p.quality);
    return true;
  });
}
