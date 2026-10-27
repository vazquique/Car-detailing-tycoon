// Pooled particles. Layer -1 draws on the full-screen overlay; other layers belong to a bay canvas.
import { MAX_PARTICLES } from '../game/constants';
import { PALETTE } from '../game/palette';

export type ParticleKind =
  'drop' | 'bubble' | 'dust' | 'sparkle' | 'coin' | 'text' | 'confetti' | 'smoke' | 'ring';

export interface Particle {
  alive: boolean;
  kind: ParticleKind;
  layer: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  text: string;
  rot: number;
  vr: number;
  /** Coins: start and target for the bezier flight. */
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  /** Generic value (wobble phase, font size). */
  a: number;
}

export const SCREEN_LAYER = -1;

const pool: Particle[] = [];
for (let i = 0; i < MAX_PARTICLES; i++) {
  pool.push({
    alive: false,
    kind: 'drop',
    layer: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 1,
    color: '#fff',
    text: '',
    rot: 0,
    vr: 0,
    sx: 0,
    sy: 0,
    tx: 0,
    ty: 0,
    a: 0,
  });
}
let cursor = 0;
let reduced = false;

export function setReducedParticles(v: boolean): void {
  reduced = v;
}

export interface SpawnOptions {
  vx?: number;
  vy?: number;
  life?: number;
  size?: number;
  color?: string;
  text?: string;
  rot?: number;
  vr?: number;
  tx?: number;
  ty?: number;
  a?: number;
}

/** Takes a particle from the pool (reuses the oldest if full). */
export function spawn(
  kind: ParticleKind,
  layer: number,
  x: number,
  y: number,
  o: SpawnOptions = {},
): Particle | null {
  if (reduced && kind !== 'text' && kind !== 'coin' && Math.random() < 0.7) return null;
  let p: Particle | undefined;
  for (let i = 0; i < pool.length; i++) {
    const idx = (cursor + i) % pool.length;
    const cand = pool[idx];
    if (cand && !cand.alive) {
      p = cand;
      cursor = (idx + 1) % pool.length;
      break;
    }
  }
  if (!p) {
    p = pool[cursor];
    cursor = (cursor + 1) % pool.length;
  }
  if (!p) return null;
  p.alive = true;
  p.kind = kind;
  p.layer = layer;
  p.x = x;
  p.y = y;
  p.sx = x;
  p.sy = y;
  p.vx = o.vx ?? 0;
  p.vy = o.vy ?? 0;
  p.life = o.life ?? 1;
  p.maxLife = p.life;
  p.size = o.size ?? 4;
  p.color = o.color ?? '#fff';
  p.text = o.text ?? '';
  p.rot = o.rot ?? 0;
  p.vr = o.vr ?? 0;
  p.tx = o.tx ?? x;
  p.ty = o.ty ?? y;
  p.a = o.a ?? Math.random() * 6.28;
  return p;
}

type ArriveFn = (p: Particle) => void;
let onCoinArrive: ArriveFn | null = null;
export function setCoinArrive(fn: ArriveFn | null): void {
  onCoinArrive = fn;
}

export function updateParticles(dt: number, layer: number): void {
  for (const p of pool) {
    if (!p.alive || p.layer !== layer) continue;
    p.life -= dt;
    if (p.life <= 0) {
      if (p.kind === 'coin' && onCoinArrive) onCoinArrive(p);
      p.alive = false;
      continue;
    }
    switch (p.kind) {
      case 'coin': {
        const t = 1 - p.life / p.maxLife;
        const e = t * t * (3 - 2 * t);
        const cx = (p.sx + p.tx) / 2 + p.a * 40;
        const cy = Math.min(p.sy, p.ty) - 60;
        const u = 1 - e;
        p.x = u * u * p.sx + 2 * u * e * cx + e * e * p.tx;
        p.y = u * u * p.sy + 2 * u * e * cy + e * e * p.ty;
        p.rot += dt * 8;
        break;
      }
      case 'bubble':
        p.a += dt * 5;
        p.x += p.vx * dt + Math.sin(p.a) * 0.3;
        p.y += p.vy * dt;
        break;
      case 'drop':
        p.vy += 380 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        break;
      case 'confetti':
        p.vy += 220 * dt;
        p.vx *= 0.99;
        p.x += p.vx * dt + Math.sin(p.a + p.life * 6) * 0.6;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        break;
      default:
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.rot += p.vr * dt;
    }
  }
}

function star4(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

export function drawParticles(ctx: CanvasRenderingContext2D, layer: number): void {
  for (const p of pool) {
    if (!p.alive || p.layer !== layer) continue;
    const t = p.life / p.maxLife;
    switch (p.kind) {
      case 'drop':
        ctx.globalAlpha = Math.min(1, t * 2);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(
          p.x,
          p.y,
          p.size * 0.6,
          p.size,
          Math.atan2(p.vy, p.vx) - Math.PI / 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        break;
      case 'bubble': {
        const r = p.size * (t < 0.15 ? 1 + (0.15 - t) * 4 : 1);
        ctx.globalAlpha = t < 0.15 ? t / 0.15 : 0.9;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(p.x - r * 0.35, p.y - r * 0.35, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'dust':
      case 'smoke':
        ctx.globalAlpha = t * (p.kind === 'smoke' ? 0.6 : 0.5);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.kind === 'smoke' ? 2 - t : 1), 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'sparkle':
        ctx.globalAlpha = Math.sin(t * Math.PI);
        ctx.fillStyle = p.color;
        star4(ctx, p.x, p.y, p.size * (0.6 + 0.4 * Math.sin(t * Math.PI)));
        break;
      case 'ring':
        ctx.globalAlpha = t;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * t;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.6 - t), 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'coin': {
        ctx.globalAlpha = 1;
        const sx = Math.abs(Math.cos(p.rot));
        ctx.fillStyle = '#B45309';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 1, p.size * Math.max(0.25, sx), p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.money;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * Math.max(0.25, sx), p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.ellipse(
          p.x - p.size * 0.2 * sx,
          p.y - p.size * 0.25,
          p.size * 0.35 * Math.max(0.25, sx),
          p.size * 0.3,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        break;
      }
      case 'confetti':
        ctx.globalAlpha = Math.min(1, t * 3);
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
        break;
      case 'text': {
        const rise = 1 - t;
        ctx.globalAlpha = t < 0.3 ? t / 0.3 : 1;
        const scale =
          rise < 0.12 ? 0.6 + (rise / 0.12) * 0.5 : 1.1 - Math.min(0.1, (rise - 0.12) * 0.3);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(scale, scale);
        ctx.font = `${Math.round(p.size)}px "Russo One", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(11,15,23,0.85)';
        ctx.strokeText(p.text, 0, 0);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, 0, 0);
        ctx.restore();
        break;
      }
    }
  }
  ctx.globalAlpha = 1;
}

export function hasParticles(layer: number): boolean {
  for (const p of pool) if (p.alive && p.layer === layer) return true;
  return false;
}

/** Bursts used by many effects. */
export function burstSparkles(
  layer: number,
  x: number,
  y: number,
  n: number,
  spread: number,
  color: string = '#FFFFFF',
): void {
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    const d = Math.random() * spread;
    spawn('sparkle', layer, x + Math.cos(ang) * d, y + Math.sin(ang) * d, {
      life: 0.5 + Math.random() * 0.5,
      size: 5 + Math.random() * 6,
      color,
    });
  }
}

export function burstConfetti(layer: number, x: number, y: number, n: number): void {
  const colors = [PALETTE.water, PALETTE.soap, PALETTE.money, PALETTE.gain, '#FFFFFF', '#818CF8'];
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const sp = 250 + Math.random() * 350;
    spawn('confetti', layer, x, y, {
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life: 1.4 + Math.random() * 1.2,
      size: 6 + Math.random() * 6,
      color: colors[i % colors.length] ?? '#fff',
      vr: (Math.random() - 0.5) * 14,
    });
  }
}

export function floatText(
  layer: number,
  x: number,
  y: number,
  text: string,
  color: string,
  size = 20,
): void {
  spawn('text', layer, x, y, { vy: -38, life: 1.3, size, color, text });
}
