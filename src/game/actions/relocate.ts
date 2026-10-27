// Moving to the next location. Equipment, staff and upgrades come along.
import type { GameState } from '../types';
import { LOCATIONS } from '../data/locations';
import { produce, spend } from './produce';

export function nextLocation(s: GameState): number | null {
  return s.location + 1 < LOCATIONS.length ? s.location + 1 : null;
}

export function moveCost(index: number): number {
  return LOCATIONS[index]?.cost ?? 0;
}

export function relocate(s: GameState, p: { location: number }): GameState {
  return produce(s, (d) => {
    if (p.location !== d.location + 1 || !LOCATIONS[p.location]) return false;
    if (!spend(d, moveCost(p.location))) return false;
    d.location = p.location;
    d.fx.push({ kind: 'event', id: 'moved' });
    return true;
  });
}
