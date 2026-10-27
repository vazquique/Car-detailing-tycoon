// The line of waiting cars: lane, cars sliding into place, patience rings with faces and service icons.
import type { Customer, GameState } from '../game/types';
import { PALETTE } from '../game/palette';
import { queueCapacity } from '../game/sim/economy';
import { drawCar } from './carPainter';
import { drawServiceGlyph } from './glyphs';
import { drawParticles, floatText, spawn, updateParticles } from './particles';
import type { Surface } from './loop';

export const QUEUE_LAYER = 9_000_000;

interface Slot {
  x: number;
  seen: number;
}

const positions = new Map<number, Slot>();
let honkTimer = 0;
let frame = 0;

interface Leaver {
  c: Customer;
  x: number;
  t: number;
}
const leavers: Leaver[] = [];

export function queueLayout(w: number, cap: number): { slot: number; x0: number } {
  const slot = Math.min(58, (w - 16) / Math.max(1, cap));
  const x0 = 8 + slot / 2;
  return { slot, x0 };
}

/** An angry customer drives off with a cloud of smoke. */
export function queueAngry(c: Customer): void {
  const pos = positions.get(c.id);
  leavers.push({ c, x: pos?.x ?? 40, t: 0 });
}

export function queueHonk(w: number): void {
  honkTimer = 1.2;
  floatText(QUEUE_LAYER, w - 40, 30, '¡Piiip!', PALETTE.warn, 15);
}

export function queueBusy(): boolean {
  return true;
}

function patienceColor(f: number): string {
  if (f > 0.5) return PALETTE.gain;
  if (f > 0.25) return '#FACC15';
  return PALETTE.loss;
}

function drawFace(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, f: number): void {
  ctx.fillStyle = '#0B0F17';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.15, r * 0.13, 0, Math.PI * 2);
  ctx.arc(x + r * 0.35, y - r * 0.15, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0B0F17';
  ctx.lineWidth = Math.max(1, r * 0.14);
  ctx.beginPath();
  if (f > 0.5) ctx.arc(x, y + r * 0.05, r * 0.4, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (f > 0.25) {
    ctx.moveTo(x - r * 0.35, y + r * 0.35);
    ctx.lineTo(x + r * 0.35, y + r * 0.35);
  } else ctx.arc(x, y + r * 0.6, r * 0.38, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();
}

function drawAngryFace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = PALETTE.loss;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0B0F17';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.6, y - r * 0.45);
  ctx.lineTo(x - r * 0.15, y - r * 0.2);
  ctx.moveTo(x + r * 0.6, y - r * 0.45);
  ctx.lineTo(x + r * 0.15, y - r * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y + r * 0.65, r * 0.4, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

export function drawQueue(sf: Surface, s: GameState, now: number, dt: number): void {
  const { ctx, w, h } = sf;
  const time = now / 1000;
  frame++;
  // Lane.
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1A2130');
  g.addColorStop(1, '#141A26');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(250,204,21,0.55)';
  ctx.setLineDash([14, 10]);
  ctx.lineDashOffset = -time * 8;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h - 2);
  ctx.lineTo(w, h - 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const cap = queueCapacity(s);
  const { slot, x0 } = queueLayout(w, cap);
  // Slot markers.
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < cap; i++) {
    ctx.beginPath();
    ctx.roundRect(x0 + i * slot - slot * 0.42, 4, slot * 0.84, h - 10, 8);
    ctx.fill();
  }

  // Layout: patience ring on top, the car in the middle, service icons in a row below.
  const ringR = Math.max(6, Math.min(9, slot * 0.2));
  const iconsY = h - 14;
  const carTop = ringR * 2 + 6;
  const unit = Math.min(iconsY - 8 - carTop, slot * 1.75);
  const carY = carTop + unit / 2;
  s.queue.forEach((c, i) => {
    const target = x0 + i * slot;
    let p = positions.get(c.id);
    if (!p) {
      p = { x: w + slot, seen: frame };
      positions.set(c.id, p);
    }
    p.seen = frame;
    p.x += (target - p.x) * Math.min(1, dt * 6);
    const bob = Math.abs(p.x - target) > 1 ? Math.sin(time * 18) * 0.6 : 0;
    drawCar(ctx, c.vehicle, c.color, p.x, carY + bob, unit, 0, { dirt: 1, dirtLevel: c.dirt });

    const ry = ringR + 3;
    if (c.contractId !== null) {
      // Fleet cars don't lose patience: show a fleet badge instead of the ring.
      ctx.fillStyle = PALETTE.water;
      ctx.beginPath();
      ctx.roundRect(p.x - ringR * 1.4, ry - ringR, ringR * 2.8, ringR * 2, ringR);
      ctx.fill();
      ctx.fillStyle = '#0B0F17';
      ctx.fillRect(p.x - ringR * 0.8, ry - ringR * 0.35, ringR * 1.2, ringR * 0.8);
      ctx.fillRect(p.x + ringR * 0.4, ry - ringR * 0.1, ringR * 0.45, ringR * 0.55);
    } else {
      const f = Math.max(0, 1 - c.waited / c.patience);
      const col = c.vip ? PALETTE.money : patienceColor(f);
      ctx.fillStyle = '#0B0F17';
      ctx.beginPath();
      ctx.arc(p.x, ry, ringR + 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = patienceColor(f);
      ctx.beginPath();
      ctx.arc(p.x, ry, ringR - 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = c.vip ? 3 : 2.5;
      ctx.beginPath();
      ctx.arc(p.x, ry, ringR + 1, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f);
      ctx.stroke();
      drawFace(ctx, p.x, ry, ringR - 1.5, f);
    }
    // Requested services.
    const n = c.services.length;
    const gr = Math.max(3.5, Math.min(5.5, (slot * 0.9) / (n * 2.25)));
    const rowW = n * gr * 2.25;
    c.services.forEach((id, k) =>
      drawServiceGlyph(ctx, id, p.x - rowW / 2 + gr * 1.12 + k * gr * 2.25, iconsY, gr, true),
    );
  });

  // Angry customers leaving.
  for (const l of leavers) {
    l.t += dt;
    l.x -= dt * 220 * l.t;
    drawCar(ctx, l.c.vehicle, l.c.color, l.x, carY, unit, (-Math.PI / 2) * Math.min(1, l.t * 3), {
      alpha: Math.max(0, 1 - l.t),
    });
    if (Math.random() < dt * 30)
      spawn('smoke', QUEUE_LAYER, l.x + 14, carY, {
        vx: 30,
        vy: -10,
        life: 0.7,
        size: 6,
        color: '#64748B',
      });
    drawAngryFace(ctx, l.x, 16 - l.t * 6, 10, Math.max(0, 1 - l.t));
  }
  for (let i = leavers.length - 1; i >= 0; i--)
    if ((leavers[i]?.t ?? 2) > 1.2) leavers.splice(i, 1);

  if (honkTimer > 0) {
    honkTimer -= dt;
    const x = w - (1.2 - honkTimer) * (w + 80);
    drawCar(ctx, 'sedan', '#94A3B8', x + 40, h - 12, unit * 0.8, -Math.PI / 2, { alpha: 0.85 });
  }

  // Forget cars that left the line.
  if (frame % 30 === 0) {
    for (const [id, p] of positions) if (frame - p.seen > 30) positions.delete(id);
  }
  updateParticles(dt, QUEUE_LAYER);
  drawParticles(ctx, QUEUE_LAYER);
}

/** Which customer (if any) is under the point. */
export function queueHit(s: GameState, w: number, x: number): Customer | null {
  const { slot, x0 } = queueLayout(w, queueCapacity(s));
  const i = Math.round((x - x0) / slot);
  return s.queue[i] ?? null;
}
