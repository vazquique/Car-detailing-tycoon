// Visual effect of each service on the car, plus the finish shine.
import type { ServiceId, VehicleId } from '../game/types';
import { hash01 } from '../game/rng';
import { bodyPath, carSize, CAR_UNIT_L } from './carPainter';
import { spawn } from './particles';

export interface CarFrame {
  type: VehicleId;
  x: number;
  y: number;
  /** Pixels for a car of length 1.0. */
  unit: number;
  seed: number;
}

function withBodyClip(
  ctx: CanvasRenderingContext2D,
  car: CarFrame,
  fn: (w: number, l: number) => void,
): void {
  const k = car.unit / CAR_UNIT_L;
  const { w, l } = carSize(car.type);
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.scale(k, k);
  ctx.clip(bodyPath(car.type, w, l));
  fn(w, l);
  ctx.restore();
}

/** Foam bubbles covering part of the body (amount 0..1). */
export function drawFoam(
  ctx: CanvasRenderingContext2D,
  car: CarFrame,
  amount: number,
  time: number,
): void {
  if (amount <= 0.01) return;
  withBodyClip(ctx, car, (w, l) => {
    const n = Math.floor(70 * amount);
    for (let i = 0; i < n; i++) {
      const r1 = hash01(car.seed + i * 7);
      const r2 = hash01(car.seed + i * 7 + 1);
      const r3 = hash01(car.seed + i * 7 + 2);
      const x = (r1 - 0.5) * w;
      const y = (r2 - 0.5) * l;
      const r = w * (0.05 + r3 * 0.07) * (0.9 + 0.1 * Math.sin(time * 3 + i));
      ctx.fillStyle = i % 5 === 0 ? 'rgba(244,114,182,0.75)' : 'rgba(255,255,255,0.88)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Wet sheen and droplets after rinsing. */
export function drawWet(ctx: CanvasRenderingContext2D, car: CarFrame, amount: number): void {
  if (amount <= 0.01) return;
  withBodyClip(ctx, car, (w, l) => {
    ctx.fillStyle = `rgba(34,211,238,${0.12 * amount})`;
    ctx.fillRect(-w / 2, -l / 2, w, l);
    const n = Math.floor(40 * amount);
    for (let i = 0; i < n; i++) {
      const x = (hash01(car.seed + 300 + i) - 0.5) * w;
      const y = (hash01(car.seed + 400 + i) - 0.5) * l;
      ctx.fillStyle = 'rgba(224,250,255,0.75)';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.018, w * 0.024, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Glossy shine band sweeping diagonally (pos 0..1). */
export function drawShineSweep(
  ctx: CanvasRenderingContext2D,
  car: CarFrame,
  pos: number,
  iridescent: boolean,
  strength = 1,
): void {
  withBodyClip(ctx, car, (w, l) => {
    const span = w + l;
    const c = -span / 2 + span * pos;
    const g = ctx.createLinearGradient(c - w * 0.6, c - w * 0.6, c + w * 0.6, c + w * 0.6);
    if (iridescent) {
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.25, `rgba(244,114,182,${0.35 * strength})`);
      g.addColorStop(0.45, `rgba(250,204,21,${0.35 * strength})`);
      g.addColorStop(0.6, `rgba(34,211,238,${0.4 * strength})`);
      g.addColorStop(0.8, `rgba(167,139,250,${0.35 * strength})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
    } else {
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(255,255,255,${0.55 * strength})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(-w, -l, w * 2, l * 2);
  });
}

/** Transparent film edge going down the car (PPF). */
export function drawFilm(
  ctx: CanvasRenderingContext2D,
  car: CarFrame,
  progress: number,
  time: number,
): void {
  withBodyClip(ctx, car, (w, l) => {
    const y = -l / 2 + l * progress;
    ctx.fillStyle = 'rgba(226,232,240,0.18)';
    ctx.fillRect(-w / 2, -l / 2, w, y + l / 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.7 + 0.3 * Math.sin(time * 8)})`;
    ctx.lineWidth = w * 0.025;
    ctx.beginPath();
    ctx.moveTo(-w / 2, y);
    ctx.lineTo(w / 2, y);
    ctx.stroke();
  });
}

/** Glossy outline for cars protected with PPF. */
export function drawFilmEdge(ctx: CanvasRenderingContext2D, car: CarFrame, alpha: number): void {
  const k = car.unit / CAR_UNIT_L;
  const { w, l } = carSize(car.type);
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.scale(k, k);
  ctx.strokeStyle = `rgba(224,250,255,${0.8 * alpha})`;
  ctx.lineWidth = 5;
  ctx.stroke(bodyPath(car.type, w, l));
  ctx.restore();
}

/** Headlights getting clearer. */
export function drawHeadlightGlow(
  ctx: CanvasRenderingContext2D,
  car: CarFrame,
  progress: number,
): void {
  const k = car.unit / CAR_UNIT_L;
  const { w, l } = carSize(car.type);
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.scale(k, k);
  for (const sx of [-1, 1]) {
    const g = ctx.createRadialGradient(sx * w * 0.3, -l / 2, 0, sx * w * 0.3, -l / 2, w * 0.5);
    g.addColorStop(0, `rgba(254,249,195,${0.25 + progress * 0.6})`);
    g.addColorStop(1, 'rgba(254,249,195,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-w, -l / 2 - w * 0.5, w * 2, w);
  }
  ctx.restore();
}

/** Inspection light beam scanning (paint correction). */
export function drawInspection(ctx: CanvasRenderingContext2D, car: CarFrame, time: number): void {
  withBodyClip(ctx, car, (w, l) => {
    const y = Math.sin(time * 1.4) * l * 0.4;
    const g = ctx.createLinearGradient(0, y - l * 0.12, 0, y + l * 0.12);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-w / 2, y - l * 0.12, w, l * 0.24);
  });
}

/** Wax / polish swirls appearing over the body. */
export function drawSwirls(
  ctx: CanvasRenderingContext2D,
  car: CarFrame,
  progress: number,
  color: string,
): void {
  withBodyClip(ctx, car, (w, l) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w * 0.012;
    const n = Math.floor(14 * progress);
    for (let i = 0; i < n; i++) {
      const x = (hash01(car.seed + 900 + i) - 0.5) * w * 0.8;
      const y = (hash01(car.seed + 950 + i) - 0.5) * l * 0.85;
      const r = w * (0.06 + 0.06 * hash01(car.seed + 990 + i));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 1.6);
      ctx.stroke();
    }
  });
}

/** Emits particles for the service in progress near the worker's tool. */
export function emitServiceParticles(
  layer: number,
  service: ServiceId,
  phase: number,
  toolX: number,
  toolY: number,
  towardX: number,
  towardY: number,
  dt: number,
  scale: number,
): void {
  const rate = (n: number): boolean => Math.random() < n * dt;
  const ang = Math.atan2(towardY - toolY, towardX - toolX);
  switch (service) {
    case 'exterior':
    case 'engine':
      if (service === 'exterior' && phase < 0.4) {
        if (rate(10))
          spawn('bubble', layer, toolX + (Math.random() - 0.5) * 12 * scale, toolY, {
            vy: -14,
            life: 0.9,
            size: (2 + Math.random() * 3) * scale,
            color: 'rgba(255,255,255,0.65)',
          });
      } else if (service === 'engine' || phase < 0.85) {
        for (let i = 0; i < 3; i++) {
          if (!rate(28)) continue;
          const a = ang + (Math.random() - 0.5) * 0.7;
          const sp = (140 + Math.random() * 90) * scale;
          spawn('drop', layer, toolX, toolY, {
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.35,
            size: 1.6 * scale,
            color: 'rgba(125,231,255,0.9)',
          });
        }
      }
      break;
    case 'interior':
    case 'upholstery':
      if (rate(12)) {
        const a = Math.random() * Math.PI * 2;
        const d = 18 * scale;
        spawn('dust', layer, toolX + Math.cos(a) * d, toolY + Math.sin(a) * d, {
          vx: -Math.cos(a) * 30 * scale,
          vy: -Math.sin(a) * 30 * scale,
          life: 0.5,
          size: 1.6 * scale,
          color: service === 'upholstery' ? '#F9A8D4' : '#CBD5E1',
        });
      }
      break;
    case 'wheels':
    case 'polish':
    case 'correction':
    case 'headlights':
      if (rate(6))
        spawn(
          'sparkle',
          layer,
          toolX + (Math.random() - 0.5) * 16 * scale,
          toolY + (Math.random() - 0.5) * 16 * scale,
          { life: 0.5, size: 4 * scale, color: '#FFFFFF' },
        );
      break;
    case 'wax':
    case 'ceramic':
    case 'clay':
    case 'ppf':
      if (rate(5))
        spawn(
          'sparkle',
          layer,
          toolX + (Math.random() - 0.5) * 20 * scale,
          toolY + (Math.random() - 0.5) * 20 * scale,
          { life: 0.6, size: 4 * scale, color: service === 'ceramic' ? '#C084FC' : '#FEF08A' },
        );
      break;
  }
}
