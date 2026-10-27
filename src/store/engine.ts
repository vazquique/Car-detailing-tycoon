// The engine owns the live GameState, runs the fixed-step simulation and publishes to the UI.
import type { FxEvent, GameState } from '../game/types';
import { AUTOSAVE_SECONDS, OFFLINE_THRESHOLD_SECONDS, PUBLISH_HZ, TICK } from '../game/constants';
import { tick } from '../game/sim/tick';
import { createInitialState } from '../game/sim/newGame';
import { computeOffline, applyOffline, type OfflineResult } from '../game/sim/offline';
import { saveGame, loadGame } from '../game/save/save';

type FxListener = (e: FxEvent, s: GameState) => void;
type PublishListener = (s: GameState) => void;

/** Max simulated seconds processed in one frame (protects against huge catch-ups). */
const MAX_CATCH_UP = 60;

export class Engine {
  state: GameState;
  /** Debug speed multiplier. */
  speed = 1;
  /** Interpolation factor between the last tick and the next (0..1). */
  alpha = 0;
  paused = false;
  private acc = 0;
  private last = 0;
  private publishAcc = 0;
  private saveAcc = 0;
  private fxListeners = new Set<FxListener>();
  private publishListeners = new Set<PublishListener>();
  /** Called when a long gap needs offline progress. */
  onOffline: ((r: OfflineResult) => void) | null = null;

  constructor(state: GameState) {
    this.state = state;
  }

  onFx(fn: FxListener): () => void {
    this.fxListeners.add(fn);
    return () => this.fxListeners.delete(fn);
  }

  onPublish(fn: PublishListener): () => void {
    this.publishListeners.add(fn);
    return () => this.publishListeners.delete(fn);
  }

  /** Called once per animation frame with performance.now(). */
  frame(nowMs: number): void {
    if (this.last === 0) this.last = nowMs;
    let dt = (nowMs - this.last) / 1000;
    this.last = nowMs;
    if (dt < 0) dt = 0;
    if (dt > OFFLINE_THRESHOLD_SECONDS) {
      this.goneFor(dt);
      dt = 0;
    }
    if (!this.paused) {
      this.acc = Math.min(this.acc + dt * this.speed, MAX_CATCH_UP);
      while (this.acc >= TICK) {
        tick(this.state, TICK);
        this.acc -= TICK;
      }
    }
    this.alpha = this.acc / TICK;
    this.drainFx();
    this.publishAcc += dt;
    if (this.publishAcc >= 1 / PUBLISH_HZ) {
      this.publishAcc = 0;
      this.publish();
    }
    this.saveAcc += dt;
    if (this.saveAcc >= AUTOSAVE_SECONDS) {
      this.saveAcc = 0;
      this.save();
    }
  }

  /** The player was away (hidden tab, closed app) for a long time. */
  goneFor(seconds: number): void {
    const r = computeOffline(this.state, seconds);
    if (r.money > 0 && this.onOffline) this.onOffline(r);
  }

  collectOffline(r: OfflineResult): void {
    applyOffline(this.state, r);
    this.publish();
    this.save();
  }

  /** Resets the frame clock (after the tab comes back). */
  resetClock(): void {
    this.last = 0;
  }

  /** Runs a pure action. Returns true if it changed the state. */
  dispatch<P>(action: (s: GameState, p: P) => GameState, payload: P): boolean {
    const next = action(this.state, payload);
    if (next === this.state) return false;
    this.state = next;
    this.drainFx();
    this.publish();
    return true;
  }

  /** Runs a no-payload action. */
  run(action: (s: GameState) => GameState): boolean {
    return this.dispatch((s: GameState) => action(s), undefined);
  }

  /** Mutating input that is part of the simulation (taps). */
  input(fn: (s: GameState) => boolean): boolean {
    const ok = fn(this.state);
    if (ok) this.drainFx();
    return ok;
  }

  replace(state: GameState): void {
    this.state = state;
    this.acc = 0;
    this.publish();
  }

  /** Simulates `seconds` right away (debug fast-forward). */
  advance(seconds: number): void {
    const steps = Math.round(seconds / TICK);
    for (let i = 0; i < steps; i++) {
      tick(this.state, TICK);
      if (this.state.fx.length > 200) this.state.fx.length = 0;
    }
    this.state.fx.length = 0;
    this.publish();
  }

  publish(): void {
    for (const fn of this.publishListeners) fn(this.state);
  }

  save(): boolean {
    return saveGame(this.state);
  }

  private drainFx(): void {
    const fx = this.state.fx;
    if (fx.length === 0) return;
    this.state.fx = [];
    for (const e of fx) for (const fn of this.fxListeners) fn(e, this.state);
  }
}

export interface BootResult {
  engine: Engine;
  corrupt: boolean;
  offline: OfflineResult | null;
  isNew: boolean;
}

export function bootEngine(now = Date.now()): BootResult {
  const loaded = loadGame();
  if (loaded.state) {
    const engine = new Engine(loaded.state);
    const away = Math.max(0, (now - loaded.state.savedAt) / 1000);
    const offline = away > OFFLINE_THRESHOLD_SECONDS ? computeOffline(loaded.state, away) : null;
    return {
      engine,
      corrupt: false,
      offline: offline && offline.money > 0 ? offline : null,
      isNew: false,
    };
  }
  const seed = (now ^ Math.floor(Math.random() * 1e9)) | 0;
  return {
    engine: new Engine(createInitialState(seed)),
    corrupt: loaded.corrupt,
    offline: null,
    isNew: true,
  };
}
