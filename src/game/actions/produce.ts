// Pure action helper: works on a copy and returns the original state if the action is invalid.
import type { GameState } from '../types';

export function cloneState(s: GameState): GameState {
  return structuredClone(s);
}

/** Runs `fn` on a copy. If it returns false the original state is returned untouched. */
export function produce(s: GameState, fn: (draft: GameState) => boolean): GameState {
  const draft = cloneState(s);
  return fn(draft) ? draft : s;
}

/** Money can be spent only if the player has no debt and enough cash. */
export function canAfford(s: GameState, cost: number): boolean {
  return s.money >= 0 && s.money >= cost;
}

export function spend(s: GameState, cost: number): boolean {
  if (!canAfford(s, cost)) return false;
  s.money -= cost;
  return true;
}
