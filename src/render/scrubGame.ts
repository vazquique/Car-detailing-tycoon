// The hand-wash mini-game: drag a finger over the car to apply each step.
// Layers are offscreen canvases erased with destination-out; coverage uses a grid of cells inside the silhouette.
import type { Customer, HandStep } from '../game/types';
import { ECONOMY } from '../game/data/economy';
import { hash01 } from '../game/rng';
import { bodyPath, carSize, paintCar, paintDirt } from './carPainter';
import { burstSparkles, drawParticles, spawn, updateParticles } from './particles';
import type { Surface } from './loop';

export const SCRUB_LAYER = 8_000_000;

interface Layer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

function makeLayer(w: number, h: number): Layer | null {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d');
  return ctx ? { canvas, ctx } : null;
}

export interface ScrubProgress {
  step: number;
  steps: HandStep[];
  coverage: number;
  done: boolean;
}

export class ScrubGame {
  readonly steps: HandStep[];
  stepIndex = 0;
  coverage = 0;
  done = false;
  private readonly c: Customer;
  private stepStart = 0;
  private stepTimes: number[] = [];
  private coverages: number[] = [];
  // Geometry (CSS px).
  private cw = 0;
  private ch = 0;
  private cx = 0;
  private cy = 0;
  private k = 1;
  private dpr = 1;
  private carW = 0;
  private carL = 0;
  private pad = 24;
  // Layers.
  private base: Layer | null = null;
  private dirt: Layer | null = null;
  private foam: Layer | null = null;
  private water: Layer | null = null;
  private wax: Layer | null = null;
  private swirl: Layer | null = null;
  private dirtAlpha = 1;
  // Coverage grid (cell centers in car units relative to the car center).
  private cells: { x: number; y: number }[] = [];
  private marked: Uint8Array = new Uint8Array(0);
  private markedCount = 0;
  // Pointer.
  private pointerId: number | null = null;
  private last: { x: number; y: number } | null = null;
  tool: { x: number; y: number; active: boolean } = { x: 0, y: 0, active: false };
  private time = 0;
  private flash = 0;
  onStep: ((index: number) => void) | null = null;
  onFinish: (() => void) | null = null;

  constructor(customer: Customer, steps: HandStep[]) {
    this.c = customer;
    this.steps = steps;
  }

  get step(): HandStep | undefined {
    return this.steps[this.stepIndex];
  }

  /** Builds layers for the current canvas size. */
  layout(w: number, h: number, dpr: number): void {
    if (w === this.cw && h === this.ch && dpr === this.dpr && this.base) return;
    this.cw = w;
    this.ch = h;
    this.dpr = dpr;
    const { w: cw, l: cl } = carSize(this.c.vehicle);
    this.k = Math.min((h * 0.8) / cl, (w * 0.62) / cw);
    this.carW = cw * this.k;
    this.carL = cl * this.k;
    this.cx = w / 2;
    this.cy = h * 0.5;
    const lw = (this.carW + this.pad * 2) * dpr;
    const lh = (this.carL + this.pad * 2) * dpr;
    const first = this.base === null;
    this.base = makeLayer(lw, lh);
    this.paintBase();
    if (first) {
      this.dirt = makeLayer(lw, lh);
      this.foam = makeLayer(lw, lh);
      this.water = makeLayer(lw, lh);
      this.wax = makeLayer(lw, lh);
      this.swirl = makeLayer(lw, lh);
      this.paintDirtLayer();
      this.buildGrid();
      this.startStep(0);
    } else {
      // Rare: canvas resized mid-game. Rebuild visual layers to the new size, keep progress.
      this.dirt = makeLayer(lw, lh);
      this.foam = makeLayer(lw, lh);
      this.water = makeLayer(lw, lh);
      this.wax = makeLayer(lw, lh);
      this.swirl = makeLayer(lw, lh);
      this.paintDirtLayer();
      this.buildGrid();
      this.prepareStepLayers();
    }
  }

  private toLayer(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate((this.carW / 2 + this.pad) * this.dpr, (this.carL / 2 + this.pad) * this.dpr);
    ctx.scale(this.k * this.dpr, this.k * this.dpr);
  }

  private body(): Path2D {
    const { w, l } = carSize(this.c.vehicle);
    return bodyPath(this.c.vehicle, w, l);
  }

  private paintBase(): void {
    if (!this.base) return;
    const { w, l } = carSize(this.c.vehicle);
    this.toLayer(this.base.ctx);
    paintCar(this.base.ctx, this.c.vehicle, this.c.color, w, l);
  }

  private paintDirtLayer(): void {
    if (!this.dirt) return;
    const { w, l } = carSize(this.c.vehicle);
    this.toLayer(this.dirt.ctx);
    paintDirt(this.dirt.ctx, this.c.vehicle, this.c.dirt, w, l, this.c.seed);
    this.dirtAlpha = 0.75 + this.c.dirt * 0.12;
  }

  private buildGrid(): void {
    const { w, l } = carSize(this.c.vehicle);
    const probe = document.createElement('canvas').getContext('2d');
    const path = this.body();
    const cols = 12;
    const rows = Math.round((cols * l) / w);
    this.cells = [];
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const x = -w / 2 + ((col + 0.5) * w) / cols;
        const y = -l / 2 + ((r + 0.5) * l) / rows;
        if (!probe || probe.isPointInPath(path, x, y)) this.cells.push({ x, y });
      }
    }
    this.marked = new Uint8Array(this.cells.length);
    this.markedCount = 0;
  }

  private prepareStepLayers(): void {
    const step = this.step;
    if (step === 'polish' && this.swirl) {
      const ctx = this.swirl.ctx;
      this.toLayer(ctx);
      const { w, l } = carSize(this.c.vehicle);
      ctx.save();
      ctx.clip(this.body());
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 120; i++) {
        const x = (hash01(this.c.seed + i) - 0.5) * w;
        const y = (hash01(this.c.seed + 200 + i) - 0.5) * l;
        const r = 6 + hash01(this.c.seed + 400 + i) * 16;
        ctx.beginPath();
        ctx.arc(x, y, r, hash01(i) * 6, hash01(i) * 6 + 2.4);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private startStep(i: number): void {
    this.stepIndex = i;
    this.stepStart = this.time;
    this.marked.fill(0);
    this.markedCount = 0;
    this.coverage = 0;
    this.prepareStepLayers();
    this.onStep?.(i);
  }

  private completeStep(): void {
    const step = this.step;
    this.stepTimes.push(this.time - this.stepStart);
    this.coverages.push(this.coverage);
    const full = (layer: Layer | null, paint: (ctx: CanvasRenderingContext2D) => void): void => {
      if (!layer) return;
      this.toLayer(layer.ctx);
      layer.ctx.save();
      layer.ctx.clip(this.body());
      paint(layer.ctx);
      layer.ctx.restore();
    };
    const clear = (layer: Layer | null): void => {
      if (!layer) return;
      layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
      layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    };
    const { w, l } = carSize(this.c.vehicle);
    if (step === 'soap') full(this.foam, (ctx) => this.foamFill(ctx, w, l, 160));
    if (step === 'rinse') {
      clear(this.foam);
      clear(this.dirt);
      full(this.water, (ctx) => {
        ctx.fillStyle = 'rgba(34,211,238,0.10)';
        ctx.fillRect(-w / 2, -l / 2, w, l);
        for (let i = 0; i < 70; i++) {
          const x = (hash01(this.c.seed + 600 + i) - 0.5) * w;
          const y = (hash01(this.c.seed + 700 + i) - 0.5) * l;
          const r = 2 + hash01(this.c.seed + 800 + i) * 3.5;
          ctx.fillStyle = 'rgba(224,250,255,0.85)';
          ctx.beginPath();
          ctx.ellipse(x, y, r, r * 1.25, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.beginPath();
          ctx.arc(x - r * 0.3, y - r * 0.4, r * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
    if (step === 'dry') clear(this.water);
    if (step === 'wax')
      full(this.wax, (ctx) => {
        ctx.fillStyle = 'rgba(254,249,195,0.16)';
        ctx.fillRect(-w / 2, -l / 2, w, l);
      });
    if (step === 'polish') clear(this.swirl);
    this.flash = 1;
    burstSparkles(SCRUB_LAYER, this.cx, this.cy, 14, this.carW * 0.6, '#FFFFFF');
    if (this.stepIndex + 1 < this.steps.length) {
      this.startStep(this.stepIndex + 1);
    } else {
      this.done = true;
      this.onFinish?.();
    }
  }

  private foamFill(ctx: CanvasRenderingContext2D, w: number, l: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const x = (hash01(this.c.seed + 1000 + i) - 0.5) * w;
      const y = (hash01(this.c.seed + 2000 + i) - 0.5) * l;
      this.bubbleAt(ctx, x, y, 6 + hash01(this.c.seed + 3000 + i) * 9, i);
    }
  }

  private bubbleAt(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    i: number,
  ): void {
    ctx.fillStyle = i % 6 === 0 ? 'rgba(249,168,212,0.92)' : 'rgba(255,255,255,0.94)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(203,213,225,0.7)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  /** Brush radius in car units. */
  private brush(): number {
    const { w } = carSize(this.c.vehicle);
    return w * 0.2;
  }

  pointerDown(id: number, x: number, y: number): void {
    if (this.done || this.pointerId !== null) return;
    this.pointerId = id;
    this.last = { x, y };
    this.tool = { x, y, active: true };
    this.apply(x, y, x, y);
  }

  pointerMove(id: number, x: number, y: number): void {
    if (id !== this.pointerId || !this.last) return;
    this.apply(this.last.x, this.last.y, x, y);
    this.last = { x, y };
    this.tool = { x, y, active: true };
  }

  pointerUp(id: number): void {
    if (id !== this.pointerId) return;
    this.pointerId = null;
    this.last = null;
    this.tool.active = false;
  }

  /** Applies the current tool along a segment (CSS px). */
  private apply(x0: number, y0: number, x1: number, y1: number): void {
    const step = this.step;
    if (!step || this.done) return;
    const toCar = (x: number, y: number): [number, number] => [
      (x - this.cx) / this.k,
      (y - this.cy) / this.k,
    ];
    const [ax, ay] = toCar(x0, y0);
    const [bx, by] = toCar(x1, y1);
    const br = this.brush();
    const dist = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.ceil(dist / (br * 0.35)));
    const paint = (
      layer: Layer | null,
      erase: boolean,
      fn: (ctx: CanvasRenderingContext2D, x: number, y: number) => void,
    ): void => {
      if (!layer) return;
      const ctx = layer.ctx;
      this.toLayer(ctx);
      ctx.save();
      ctx.clip(this.body());
      ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        fn(ctx, ax + (bx - ax) * t, ay + (by - ay) * t);
      }
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
    };
    const eraseCircle = (ctx: CanvasRenderingContext2D, x: number, y: number): void => {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x, y, br, 0, Math.PI * 2);
      ctx.fill();
    };
    switch (step) {
      case 'soap':
        paint(this.foam, false, (ctx, x, y) => {
          for (let i = 0; i < 3; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = Math.random() * br * 0.8;
            this.bubbleAt(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 4 + Math.random() * 7, i);
          }
        });
        if (Math.random() < 0.5)
          spawn('bubble', SCRUB_LAYER, x1, y1, {
            vx: (Math.random() - 0.5) * 40,
            vy: -30,
            life: 0.9,
            size: 3 + Math.random() * 4,
            color: 'rgba(255,255,255,0.6)',
          });
        break;
      case 'rinse':
        paint(this.foam, true, eraseCircle);
        paint(this.dirt, true, eraseCircle);
        for (let i = 0; i < 3; i++) {
          const a = Math.PI / 2 + (Math.random() - 0.5) * 1.6;
          spawn('drop', SCRUB_LAYER, x1, y1, {
            vx: Math.cos(a) * 160,
            vy: -Math.sin(a) * 120,
            life: 0.4,
            size: 2.4,
            color: 'rgba(125,231,255,0.9)',
          });
        }
        break;
      case 'dry':
        paint(this.water, true, eraseCircle);
        if (Math.random() < 0.3)
          spawn('sparkle', SCRUB_LAYER, x1, y1, { life: 0.4, size: 6, color: '#E0F2FE' });
        break;
      case 'wax':
        paint(this.wax, false, (ctx, x, y) => {
          const g = ctx.createRadialGradient(x, y, 0, x, y, br);
          g.addColorStop(0, 'rgba(254,249,195,0.22)');
          g.addColorStop(1, 'rgba(254,249,195,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, br, 0, Math.PI * 2);
          ctx.fill();
        });
        if (Math.random() < 0.3)
          spawn('sparkle', SCRUB_LAYER, x1, y1, { life: 0.5, size: 7, color: '#FEF08A' });
        break;
      case 'polish':
        paint(this.swirl, true, eraseCircle);
        if (Math.random() < 0.3)
          spawn('sparkle', SCRUB_LAYER, x1, y1, { life: 0.5, size: 7, color: '#FFFFFF' });
        break;
    }
    // Coverage: mark cells within the brush along the segment.
    const r2 = br * br;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const px = ax + (bx - ax) * t;
      const py = ay + (by - ay) * t;
      for (let c = 0; c < this.cells.length; c++) {
        if (this.marked[c]) continue;
        const cell = this.cells[c];
        if (!cell) continue;
        const dx = cell.x - px;
        const dy = cell.y - py;
        if (dx * dx + dy * dy <= r2) {
          this.marked[c] = 1;
          this.markedCount++;
        }
      }
    }
    this.coverage = this.cells.length > 0 ? this.markedCount / this.cells.length : 1;
    if (this.coverage >= ECONOMY.handCoverage) this.completeStep();
  }

  /** Share of all hand steps finished (0..1), counting partial coverage of the current step. */
  fraction(): number {
    if (this.done) return 1;
    return (this.stepIndex + Math.min(1, this.coverage / ECONOMY.handCoverage)) / this.steps.length;
  }

  /** 0.9..1 multiplier from speed and coverage. */
  performance(): number {
    if (this.stepTimes.length === 0) return 0.95;
    const target = ECONOMY.handStepTargetSeconds;
    let sum = 0;
    this.stepTimes.forEach((t, i) => {
      const speed = t <= target ? 1 : 1 - 0.08 * Math.min(1, (t - target) / (target * 2));
      const cov = this.coverages[i] ?? ECONOMY.handCoverage;
      const covF =
        0.97 + 0.03 * Math.min(1, (cov - ECONOMY.handCoverage) / (1 - ECONOMY.handCoverage));
      sum += speed * covF;
    });
    return sum / this.stepTimes.length;
  }

  draw(sf: Surface, now: number, dt: number): void {
    this.time += dt;
    const { ctx, w, h } = sf;
    this.layout(w, h, sf.dpr);
    // Backdrop: spotlight on a wet floor.
    const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.max(w, h) * 0.75);
    g.addColorStop(0, '#2A3550');
    g.addColorStop(0.6, '#151C2C');
    g.addColorStop(1, '#0B0F17');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    // Shadow.
    const sg = ctx.createRadialGradient(
      this.cx,
      this.cy + 8,
      0,
      this.cx,
      this.cy + 8,
      this.carL * 0.62,
    );
    sg.addColorStop(0, 'rgba(0,0,0,0.55)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, w, h);

    const lx = this.cx - this.carW / 2 - this.pad;
    const ly = this.cy - this.carL / 2 - this.pad;
    const lw = this.carW + this.pad * 2;
    const lh = this.carL + this.pad * 2;
    const blit = (layer: Layer | null, alpha = 1): void => {
      if (!layer) return;
      ctx.globalAlpha = alpha;
      ctx.drawImage(layer.canvas, lx, ly, lw, lh);
      ctx.globalAlpha = 1;
    };
    blit(this.base);
    blit(this.dirt, this.dirtAlpha);
    blit(this.wax);
    blit(this.swirl);
    blit(this.water);
    blit(this.foam);
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt * 2);
      ctx.save();
      ctx.translate(this.cx, this.cy);
      ctx.scale(this.k, this.k);
      ctx.clip(this.body());
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.35})`;
      ctx.fillRect(-500, -800, 1000, 1600);
      ctx.restore();
    }
    updateParticles(dt, SCRUB_LAYER);
    drawParticles(ctx, SCRUB_LAYER);
    if (this.tool.active) this.drawTool(ctx, now / 1000);
  }

  private drawTool(ctx: CanvasRenderingContext2D, time: number): void {
    const { x, y } = this.tool;
    const s = Math.max(28, this.carW * 0.22);
    ctx.save();
    ctx.translate(x, y);
    switch (this.step) {
      case 'soap':
        ctx.rotate(Math.sin(time * 12) * 0.15);
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.roundRect(-s / 2, -s * 0.32, s, s * 0.64, s * 0.18);
        ctx.fill();
        ctx.fillStyle = 'rgba(180,120,0,0.45)';
        for (let i = 0; i < 6; i++)
          ctx.fillRect(
            -s * 0.35 + (i % 3) * s * 0.3,
            -s * 0.15 + Math.floor(i / 3) * s * 0.25,
            s * 0.08,
            s * 0.08,
          );
        break;
      case 'rinse':
        ctx.fillStyle = '#334155';
        ctx.fillRect(-s * 0.1, -s * 0.1, s * 0.2, s * 0.7);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(-s * 0.16, s * 0.3, s * 0.32, s * 0.25);
        ctx.fillStyle = 'rgba(125,231,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.1);
        ctx.lineTo(-s * 0.35, -s * 0.7);
        ctx.lineTo(s * 0.35, -s * 0.7);
        ctx.fill();
        break;
      case 'dry':
        ctx.rotate(Math.sin(time * 10) * 0.2);
        ctx.fillStyle = '#F472B6';
        ctx.beginPath();
        ctx.roundRect(-s * 0.55, -s * 0.35, s * 1.1, s * 0.7, s * 0.12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * s * 0.18, -s * 0.3);
          ctx.lineTo(i * s * 0.18, s * 0.3);
          ctx.stroke();
        }
        break;
      case 'wax':
        ctx.rotate(time * 4);
        ctx.fillStyle = '#FEF3C7';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;
      case 'polish':
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate(time * 30);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.34, 0, Math.PI * 1.4);
        ctx.stroke();
        break;
      default:
        break;
    }
    ctx.restore();
  }
}

/** Hand steps for a list of services, in order. */
export function scrubStepsFor(services: readonly { handSteps: HandStep[] }[]): HandStep[] {
  const out: HandStep[] = [];
  for (const s of services) out.push(...s.handSteps);
  return out;
}
