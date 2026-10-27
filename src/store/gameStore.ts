// Zustand store with a snapshot of the game state, refreshed at most 10 times per second.
import { create } from 'zustand';
import type { GameState } from '../game/types';
import { bootEngine, type Engine } from './engine';

const boot = bootEngine();
export const engine: Engine = boot.engine;
export const bootInfo = { corrupt: boot.corrupt, offline: boot.offline, isNew: boot.isNew };

interface GameStore {
  s: GameState;
}

function snapshot(s: GameState): GameState {
  return structuredClone({ ...s, fx: [] });
}

export const useGame = create<GameStore>(() => ({ s: snapshot(engine.state) }));

engine.onPublish((s) => useGame.setState({ s: snapshot(s) }));

/** Shorthand selector hook. */
export function useG<T>(selector: (s: GameState) => T): T {
  return useGame((st) => selector(st.s));
}
