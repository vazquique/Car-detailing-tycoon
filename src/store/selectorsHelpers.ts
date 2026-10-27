import type { GameState } from '../game/types';

/** Number of non-owner bays without a worker. */
export function autoAssignTargets(s: GameState): number {
  return s.bays.filter((b) => !b.isOwner && b.workerId === null).length;
}
