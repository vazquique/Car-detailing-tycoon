// The single requestAnimationFrame loop: advances the engine and draws every visible canvas.
import { MAX_DPR } from '../game/constants';
import { engine } from '../store/gameStore';

export interface Surface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** CSS pixel size. */
  w: number;
  h: number;
  dpr: number;
  visible: boolean;
  lastDraw: number;
  draw: (s: Surface, now: number, dt: number) => void;
  /** Busy surfaces draw every frame; idle ones at 10 fps. */
  isActive: () => boolean;
}

const surfaces = new Set<Surface>();
const IDLE_INTERVAL = 100;

let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
const byCanvas = new Map<Element, Surface>();

function dprNow(): number {
  return Math.min(MAX_DPR, Math.max(1, window.devicePixelRatio || 1));
}

function fit(s: Surface): void {
  const rect = s.canvas.getBoundingClientRect();
  const dpr = dprNow();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (w === s.w && h === s.h && dpr === s.dpr) return;
  s.w = w;
  s.h = h;
  s.dpr = dpr;
  s.canvas.width = Math.round(w * dpr);
  s.canvas.height = Math.round(h * dpr);
  s.lastDraw = 0;
}

function observers(): void {
  if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      for (const e of entries) {
        const s = byCanvas.get(e.target);
        if (s) fit(s);
      }
    });
  }
  if (!intersectionObserver && typeof IntersectionObserver !== 'undefined') {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const s = byCanvas.get(e.target);
          if (s) s.visible = e.isIntersecting;
        }
      },
      { rootMargin: '40px' },
    );
  }
}

export function registerSurface(
  canvas: HTMLCanvasElement,
  draw: Surface['draw'],
  isActive: Surface['isActive'] = () => true,
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;
  observers();
  const s: Surface = {
    canvas,
    ctx,
    w: 0,
    h: 0,
    dpr: 1,
    visible: true,
    lastDraw: 0,
    draw,
    isActive,
  };
  fit(s);
  surfaces.add(s);
  byCanvas.set(canvas, s);
  resizeObserver?.observe(canvas);
  intersectionObserver?.observe(canvas);
  return () => {
    surfaces.delete(s);
    byCanvas.delete(canvas);
    resizeObserver?.unobserve(canvas);
    intersectionObserver?.unobserve(canvas);
  };
}

type FrameHook = (now: number, dt: number) => void;
const hooks = new Set<FrameHook>();

/** Runs a callback every frame (e.g. the money counter). */
export function onFrame(fn: FrameHook): () => void {
  hooks.add(fn);
  return () => hooks.delete(fn);
}

let running = false;
let lastNow = 0;

function frame(now: number): void {
  if (!running) return;
  const dt = lastNow === 0 ? 0 : Math.min(0.1, (now - lastNow) / 1000);
  lastNow = now;
  engine.frame(now);
  for (const fn of hooks) fn(now, dt);
  for (const s of surfaces) {
    if (!s.visible || s.w <= 1 || s.h <= 1) continue;
    if (!s.isActive() && now - s.lastDraw < IDLE_INTERVAL) continue;
    s.ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    s.draw(s, now, s.lastDraw === 0 ? dt : Math.min(0.1, (now - s.lastDraw) / 1000));
    s.lastDraw = now;
  }
  requestAnimationFrame(frame);
}

export function startLoop(): void {
  if (running) return;
  running = true;
  lastNow = 0;
  requestAnimationFrame(frame);
}

export function stopLoop(): void {
  running = false;
}

/** Re-measures every surface (after layout changes). */
export function refitAll(): void {
  for (const s of surfaces) fit(s);
}
