// Top-down cars drawn with code. Base sprites are cached per type and color.
import type { DirtLevel, VehicleId } from '../game/types';
import { VEHICLE_BY_ID } from '../game/data/vehicles';
import { hash01 } from '../game/rng';

/** Sprite pixels for a car of length 1.0 / width 1.0. */
export const CAR_UNIT_L = 300;
export const CAR_UNIT_W = 130;
/** Transparent margin around the sprite for mirrors, tires and spoiler. */
const PAD = 16;

interface ShapeDef {
  /** Windshield start (hood end), roof start, roof end, rear glass end: fractions of length from the front. */
  hood: number;
  roofStart: number;
  roofEnd: number;
  rearEnd: number;
  /** Cabin inset on each side, fraction of width. */
  inset: number;
  /** Corner radius front / rear, fraction of width. */
  rf: number;
  rr: number;
  /** Front narrowing, fraction of width (sports cars). */
  taper: number;
}

const SHAPES: Record<VehicleId, ShapeDef> = {
  compact: {
    hood: 0.24,
    roofStart: 0.4,
    roofEnd: 0.74,
    rearEnd: 0.86,
    inset: 0.12,
    rf: 0.42,
    rr: 0.36,
    taper: 0.04,
  },
  sedan: {
    hood: 0.27,
    roofStart: 0.42,
    roofEnd: 0.66,
    rearEnd: 0.77,
    inset: 0.13,
    rf: 0.36,
    rr: 0.26,
    taper: 0.03,
  },
  suv: {
    hood: 0.22,
    roofStart: 0.34,
    roofEnd: 0.84,
    rearEnd: 0.92,
    inset: 0.1,
    rf: 0.24,
    rr: 0.18,
    taper: 0,
  },
  pickup: {
    hood: 0.22,
    roofStart: 0.33,
    roofEnd: 0.5,
    rearEnd: 0.55,
    inset: 0.1,
    rf: 0.24,
    rr: 0.1,
    taper: 0,
  },
  van: {
    hood: 0.1,
    roofStart: 0.2,
    roofEnd: 0.95,
    rearEnd: 0.97,
    inset: 0.06,
    rf: 0.26,
    rr: 0.1,
    taper: 0,
  },
  sport: {
    hood: 0.34,
    roofStart: 0.48,
    roofEnd: 0.66,
    rearEnd: 0.76,
    inset: 0.15,
    rf: 0.4,
    rr: 0.22,
    taper: 0.12,
  },
  luxury: {
    hood: 0.29,
    roofStart: 0.43,
    roofEnd: 0.68,
    rearEnd: 0.79,
    inset: 0.13,
    rf: 0.3,
    rr: 0.24,
    taper: 0.02,
  },
  classic: {
    hood: 0.3,
    roofStart: 0.42,
    roofEnd: 0.64,
    rearEnd: 0.74,
    inset: 0.16,
    rf: 0.46,
    rr: 0.4,
    taper: 0.06,
  },
};

export interface CarSize {
  w: number;
  l: number;
}

export function carSize(type: VehicleId): CarSize {
  const v = VEHICLE_BY_ID[type];
  return { w: CAR_UNIT_W * v.width, l: CAR_UNIT_L * v.length };
}

// ---------- Color helpers ----------

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mixes a color towards white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  const mix = (c: number): number => Math.round(c + (t - c) * p);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// ---------- Paths ----------

function roundRectPath(
  p: Path2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rTop: number,
  rBottom: number,
): void {
  const rt = Math.min(rTop, w / 2, h / 2);
  const rb = Math.min(rBottom, w / 2, h / 2);
  p.moveTo(x + rt, y);
  p.lineTo(x + w - rt, y);
  p.quadraticCurveTo(x + w, y, x + w, y + rt);
  p.lineTo(x + w, y + h - rb);
  p.quadraticCurveTo(x + w, y + h, x + w - rb, y + h);
  p.lineTo(x + rb, y + h);
  p.quadraticCurveTo(x, y + h, x, y + h - rb);
  p.lineTo(x, y + rt);
  p.quadraticCurveTo(x, y, x + rt, y);
  p.closePath();
}

const bodyCache = new Map<string, Path2D>();

/** Body outline centered at (0,0), front facing up (negative y). */
export function bodyPath(type: VehicleId, w: number, l: number): Path2D {
  const key = `${type}|${w.toFixed(1)}|${l.toFixed(1)}`;
  const cached = bodyCache.get(key);
  if (cached) return cached;
  const sh = SHAPES[type];
  const p = new Path2D();
  const x0 = -w / 2;
  const y0 = -l / 2;
  if (type === 'classic') {
    // Rounded body with bulging fenders.
    const fw = w * 0.06;
    p.moveTo(0, y0);
    p.bezierCurveTo(w * 0.36, y0, x0 + w + fw * 0.2, y0 + l * 0.06, w / 2 + fw, y0 + l * 0.2);
    p.bezierCurveTo(
      w / 2 + fw * 0.8,
      y0 + l * 0.32,
      w / 2 - fw * 0.4,
      y0 + l * 0.36,
      w / 2 - fw * 0.3,
      y0 + l * 0.5,
    );
    p.bezierCurveTo(
      w / 2 - fw * 0.2,
      y0 + l * 0.62,
      w / 2 + fw,
      y0 + l * 0.66,
      w / 2 + fw * 0.9,
      y0 + l * 0.82,
    );
    p.bezierCurveTo(w / 2 + fw * 0.6, y0 + l * 0.98, w * 0.3, y0 + l, 0, y0 + l);
    p.bezierCurveTo(
      -w * 0.3,
      y0 + l,
      -w / 2 - fw * 0.6,
      y0 + l * 0.98,
      -w / 2 - fw * 0.9,
      y0 + l * 0.82,
    );
    p.bezierCurveTo(
      -w / 2 - fw,
      y0 + l * 0.66,
      -w / 2 + fw * 0.2,
      y0 + l * 0.62,
      -w / 2 + fw * 0.3,
      y0 + l * 0.5,
    );
    p.bezierCurveTo(
      -w / 2 + fw * 0.4,
      y0 + l * 0.36,
      -w / 2 - fw * 0.8,
      y0 + l * 0.32,
      -w / 2 - fw,
      y0 + l * 0.2,
    );
    p.bezierCurveTo(x0 - fw * 0.2, y0 + l * 0.06, -w * 0.36, y0, 0, y0);
    p.closePath();
  } else if (sh.taper > 0.05) {
    // Wedge-shaped sports car: narrower nose.
    const t = w * sh.taper;
    const rf = w * sh.rf;
    const rr = w * sh.rr;
    p.moveTo(x0 + t + rf * 0.6, y0);
    p.lineTo(x0 + w - t - rf * 0.6, y0);
    p.quadraticCurveTo(x0 + w - t * 0.4, y0, x0 + w - t * 0.2, y0 + rf * 0.9);
    p.lineTo(x0 + w, y0 + l * 0.32);
    p.lineTo(x0 + w, y0 + l - rr);
    p.quadraticCurveTo(x0 + w, y0 + l, x0 + w - rr, y0 + l);
    p.lineTo(x0 + rr, y0 + l);
    p.quadraticCurveTo(x0, y0 + l, x0, y0 + l - rr);
    p.lineTo(x0, y0 + l * 0.32);
    p.lineTo(x0 + t * 0.2, y0 + rf * 0.9);
    p.quadraticCurveTo(x0 + t * 0.4, y0, x0 + t + rf * 0.6, y0);
    p.closePath();
  } else {
    roundRectPath(p, x0, y0, w, l, w * sh.rf, w * sh.rr);
  }
  bodyCache.set(key, p);
  return p;
}

function glassPath(
  x0: number,
  x1: number,
  ya: number,
  yb: number,
  narrowTop: number,
  narrowBottom: number,
): Path2D {
  const p = new Path2D();
  p.moveTo(x0 + narrowTop, ya);
  p.lineTo(x1 - narrowTop, ya);
  p.lineTo(x1 - narrowBottom, yb);
  p.lineTo(x0 + narrowBottom, yb);
  p.closePath();
  return p;
}

// ---------- Painting ----------

function drawTire(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tw: number,
  tl: number,
): void {
  ctx.fillStyle = '#0B0F17';
  ctx.beginPath();
  ctx.roundRect(x - tw / 2, y - tl / 2, tw, tl, tw * 0.35);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.fillRect(x - tw * 0.25, y - tl * 0.38, tw * 0.5, tl * 0.08);
  ctx.fillRect(x - tw * 0.25, y + tl * 0.3, tw * 0.5, tl * 0.08);
}

function reflections(
  ctx: CanvasRenderingContext2D,
  clip: Path2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number,
): void {
  ctx.save();
  ctx.clip(clip);
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y + h);
  ctx.lineTo(x + w * 0.35, y);
  ctx.lineTo(x + w * 0.47, y);
  ctx.lineTo(x + w * 0.27, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${alpha * 0.6})`;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.52, y + h);
  ctx.lineTo(x + w * 0.66, y);
  ctx.lineTo(x + w * 0.71, y);
  ctx.lineTo(x + w * 0.57, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Paints a full car centered at (0,0) with the front facing up. */
export function paintCar(
  ctx: CanvasRenderingContext2D,
  type: VehicleId,
  color: string,
  w: number,
  l: number,
): void {
  const sh = SHAPES[type];
  const x0 = -w / 2;
  const y0 = -l / 2;
  const Y = (f: number): number => y0 + l * f;
  const tinted = type === 'luxury';
  const chrome = type === 'luxury' || type === 'classic';
  const dark = luminance(color) < 0.25;

  // Tires peeking out.
  const tw = w * 0.17;
  const tl = l * 0.16;
  const tireX = w / 2 - tw * 0.18;
  const front = type === 'van' ? 0.17 : 0.2;
  const rear = type === 'pickup' || type === 'van' ? 0.8 : 0.78;
  for (const sx of [-1, 1]) {
    drawTire(ctx, sx * tireX, Y(front), tw, tl);
    drawTire(ctx, sx * tireX, Y(rear), tw, tl);
  }

  const body = bodyPath(type, w, l);
  // Body with side shading.
  const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
  g.addColorStop(0, shade(color, -0.35));
  g.addColorStop(0.18, shade(color, -0.05));
  g.addColorStop(0.5, shade(color, 0.12));
  g.addColorStop(0.82, shade(color, -0.05));
  g.addColorStop(1, shade(color, -0.35));
  ctx.fillStyle = g;
  ctx.fill(body);
  // Front-to-back light falloff.
  ctx.save();
  ctx.clip(body);
  const gv = ctx.createLinearGradient(0, y0, 0, y0 + l);
  gv.addColorStop(0, 'rgba(255,255,255,0.10)');
  gv.addColorStop(0.5, 'rgba(255,255,255,0)');
  gv.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = gv;
  ctx.fillRect(x0 - 10, y0 - 10, w + 20, l + 20);
  // Bumpers.
  ctx.fillStyle = chrome ? 'rgba(226,232,240,0.85)' : 'rgba(15,23,42,0.35)';
  ctx.fillRect(x0 - 10, y0 - 2, w + 20, l * 0.025);
  ctx.fillRect(x0 - 10, y0 + l * 0.977, w + 20, l * 0.03);
  ctx.restore();
  ctx.lineWidth = Math.max(1.5, w * 0.014);
  ctx.strokeStyle = shade(color, -0.5);
  ctx.stroke(body);

  // Hood creases.
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)';
  ctx.lineWidth = w * 0.012;
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, Y(0.05));
  ctx.lineTo(-w * 0.2, Y(sh.hood - 0.02));
  ctx.moveTo(w * 0.18, Y(0.05));
  ctx.lineTo(w * 0.2, Y(sh.hood - 0.02));
  ctx.stroke();

  const ix0 = x0 + w * sh.inset;
  const ix1 = x0 + w - w * sh.inset;
  const glassTop = tinted ? '#020617' : '#0F172A';
  const glassBottom = tinted ? '#0B1120' : '#1E3A5F';

  // Windshield.
  const ws = glassPath(ix0, ix1, Y(sh.hood), Y(sh.roofStart), w * 0.05, 0);
  const gg = ctx.createLinearGradient(0, Y(sh.hood), 0, Y(sh.roofStart));
  gg.addColorStop(0, glassBottom);
  gg.addColorStop(1, glassTop);
  ctx.fillStyle = gg;
  ctx.fill(ws);
  reflections(
    ctx,
    ws,
    ix0,
    Y(sh.hood),
    ix1 - ix0,
    Y(sh.roofStart) - Y(sh.hood),
    tinted ? 0.18 : 0.35,
  );

  // Roof.
  const roof = new Path2D();
  roundRectPath(
    roof,
    ix0,
    Y(sh.roofStart),
    ix1 - ix0,
    Y(sh.roofEnd) - Y(sh.roofStart),
    w * 0.08,
    w * 0.08,
  );
  const roofColor = type === 'classic' ? '#F8FAFC' : shade(color, dark ? 0.12 : 0.22);
  ctx.fillStyle = roofColor;
  ctx.fill(roof);
  ctx.strokeStyle = shade(color, -0.3);
  ctx.lineWidth = w * 0.01;
  ctx.stroke(roof);
  // Side windows (thin glass strips along the cabin).
  ctx.fillStyle = glassTop;
  const swW = w * 0.035;
  ctx.fillRect(
    ix0 - swW,
    Y(sh.roofStart) + l * 0.01,
    swW,
    Y(sh.roofEnd) - Y(sh.roofStart) - l * 0.02,
  );
  ctx.fillRect(ix1, Y(sh.roofStart) + l * 0.01, swW, Y(sh.roofEnd) - Y(sh.roofStart) - l * 0.02);

  // Rear glass.
  const rg = glassPath(ix0, ix1, Y(sh.roofEnd), Y(sh.rearEnd), 0, w * 0.06);
  ctx.fillStyle = glassTop;
  ctx.fill(rg);
  reflections(
    ctx,
    rg,
    ix0,
    Y(sh.roofEnd),
    ix1 - ix0,
    Y(sh.rearEnd) - Y(sh.roofEnd),
    tinted ? 0.12 : 0.25,
  );

  // Mirrors.
  ctx.fillStyle = shade(color, -0.1);
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(
      sx * (w / 2 + w * 0.05),
      Y(sh.hood + 0.02),
      w * 0.07,
      l * 0.018,
      sx * 0.25,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Headlights and tail lights.
  const hlw = w * 0.2;
  const hlh = l * 0.03;
  for (const sx of [-1, 1]) {
    if (type === 'classic') {
      ctx.fillStyle = '#FEF9C3';
      ctx.beginPath();
      ctx.arc(sx * w * 0.3, Y(0.045), w * 0.075, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = w * 0.02;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FEF9C3';
      ctx.beginPath();
      ctx.roundRect(
        sx > 0 ? w / 2 - hlw - w * 0.08 : -w / 2 + w * 0.08,
        Y(0.012),
        hlw,
        hlh,
        hlh / 2,
      );
      ctx.fill();
    }
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.roundRect(
      sx > 0 ? w / 2 - hlw - w * 0.06 : -w / 2 + w * 0.06,
      Y(0.962),
      hlw,
      l * 0.022,
      l * 0.01,
    );
    ctx.fill();
  }

  // Type details.
  if (type === 'suv') {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = w * 0.035;
    ctx.lineCap = 'round';
    for (const x of [ix0 + w * 0.06, ix1 - w * 0.06]) {
      ctx.beginPath();
      ctx.moveTo(x, Y(sh.roofStart + 0.04));
      ctx.lineTo(x, Y(sh.roofEnd - 0.04));
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
  if (type === 'van') {
    ctx.strokeStyle = shade(color, -0.12);
    ctx.lineWidth = w * 0.015;
    for (let i = 1; i < 6; i++) {
      const y = Y(sh.roofStart + ((sh.roofEnd - sh.roofStart) * i) / 6);
      ctx.beginPath();
      ctx.moveTo(ix0 + w * 0.04, y);
      ctx.lineTo(ix1 - w * 0.04, y);
      ctx.stroke();
    }
  }
  if (type === 'pickup') {
    const bedTop = Y(sh.rearEnd + 0.04);
    const bed = new Path2D();
    roundRectPath(bed, x0 + w * 0.08, bedTop, w * 0.84, Y(0.95) - bedTop, w * 0.03, w * 0.03);
    ctx.fillStyle = shade(color, -0.45);
    ctx.fill(bed);
    ctx.strokeStyle = shade(color, -0.2);
    ctx.lineWidth = w * 0.03;
    ctx.stroke(bed);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = w * 0.012;
    for (let i = 1; i < 5; i++) {
      const x = x0 + w * 0.08 + (w * 0.84 * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x, bedTop + l * 0.02);
      ctx.lineTo(x, Y(0.93));
      ctx.stroke();
    }
  }
  if (type === 'sport') {
    const stripe = luminance(color) > 0.6 ? '#0F172A' : '#F8FAFC';
    ctx.save();
    ctx.clip(body);
    ctx.fillStyle = rgba(stripe === '#0F172A' ? '#0F172A' : '#F8FAFC', 0.85);
    ctx.fillRect(-w * 0.12, y0, w * 0.08, l);
    ctx.fillRect(w * 0.04, y0, w * 0.08, l);
    ctx.restore();
    // Rear wing.
    ctx.fillStyle = shade(color, -0.4);
    ctx.fillRect(-w * 0.3, Y(0.86), w * 0.04, l * 0.06);
    ctx.fillRect(w * 0.26, Y(0.86), w * 0.04, l * 0.06);
    ctx.fillStyle = shade(color, -0.2);
    ctx.beginPath();
    ctx.roundRect(-w * 0.56, Y(0.9), w * 1.12, l * 0.05, l * 0.02);
    ctx.fill();
    ctx.strokeStyle = shade(color, -0.55);
    ctx.lineWidth = w * 0.012;
    ctx.stroke();
  }
  if (chrome) {
    ctx.strokeStyle = 'rgba(241,245,249,0.75)';
    ctx.lineWidth = w * 0.014;
    ctx.beginPath();
    ctx.moveTo(x0 + w * 0.03, Y(0.2));
    ctx.lineTo(x0 + w * 0.03, Y(0.85));
    ctx.moveTo(x0 + w * 0.97, Y(0.2));
    ctx.lineTo(x0 + w * 0.97, Y(0.85));
    ctx.stroke();
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(0, Y(0.05), w * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top gloss highlight.
  ctx.save();
  ctx.clip(body);
  const hl = ctx.createLinearGradient(x0, y0, x0 + w, y0 + l * 0.4);
  hl.addColorStop(0, 'rgba(255,255,255,0.18)');
  hl.addColorStop(0.35, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(x0, y0, w, l);
  ctx.restore();
}

// ---------- Sprite caches ----------

type Sprite = HTMLCanvasElement;
const spriteCache = new Map<string, Sprite>();
const dirtCache = new Map<string, Sprite>();

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w);
  c.height = Math.ceil(h);
  return c;
}

/** Cached base car sprite (front up). Sprite space: CAR_UNIT_* pixels. */
export function carSprite(type: VehicleId, color: string): Sprite {
  const key = `${type}|${color}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  const { w, l } = carSize(type);
  const scale = 1.4;
  const c = makeCanvas((w + PAD * 2) * scale, (l + PAD * 2) * scale);
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.scale(scale, scale);
    ctx.translate(w / 2 + PAD, l / 2 + PAD);
    paintCar(ctx, type, color, w, l);
  }
  spriteCache.set(key, c);
  return c;
}

/** Paints a dirt layer (dust + mud noise) clipped to the body. */
export function paintDirt(
  ctx: CanvasRenderingContext2D,
  type: VehicleId,
  dirt: DirtLevel,
  w: number,
  l: number,
  seed: number,
): void {
  const body = bodyPath(type, w, l);
  ctx.save();
  ctx.clip(body);
  // Matte dust over everything.
  ctx.fillStyle = `rgba(132,112,84,${0.3 + dirt * 0.1})`;
  ctx.fillRect(-w / 2 - 4, -l / 2 - 4, w + 8, l + 8);
  // Mud bands on the lower panels (sides and rear).
  const mud = `rgba(96,70,44,${0.55 + dirt * 0.15})`;
  const side = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  side.addColorStop(0, mud);
  side.addColorStop(0.16 + dirt * 0.05, 'rgba(96,70,44,0)');
  side.addColorStop(0.84 - dirt * 0.05, 'rgba(96,70,44,0)');
  side.addColorStop(1, mud);
  ctx.fillStyle = side;
  ctx.fillRect(-w / 2, -l / 2, w, l);
  const rear = ctx.createLinearGradient(0, l / 2, 0, l * 0.1);
  rear.addColorStop(0, mud);
  rear.addColorStop(1, 'rgba(96,70,44,0)');
  ctx.fillStyle = rear;
  ctx.fillRect(-w / 2, l * 0.1, w, l * 0.4);
  // Fine noise speckles, denser near the edges and the rear.
  const dots = 260 + dirt * 260;
  for (let i = 0; i < dots; i++) {
    const r1 = hash01(seed + i * 3);
    const r2 = hash01(seed + i * 3 + 1);
    const r3 = hash01(seed + i * 3 + 2);
    const sx = r1 < 0.5 ? -1 : 1;
    const x = sx * (w / 2) * Math.pow(r2, 0.35);
    const y = -l / 2 + l * Math.pow(r3, 0.55);
    const size = w * (0.006 + r1 * 0.018) * (1 + dirt * 0.35);
    const tone = 55 + Math.floor(r2 * 45);
    ctx.fillStyle = `rgba(${tone + 35},${tone + 15},${tone - 15},${0.3 + r3 * 0.45})`;
    ctx.beginPath();
    ctx.ellipse(x, y, size * (1 + r3), size, r1 * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // Splash streaks behind the wheels.
  if (dirt >= 1) {
    ctx.strokeStyle = 'rgba(92,64,40,0.5)';
    ctx.lineCap = 'round';
    ctx.lineWidth = w * 0.02;
    for (let i = 0; i < 12 + dirt * 10; i++) {
      const r = hash01(seed + 500 + i);
      const sx = r < 0.5 ? -1 : 1;
      const yy = -l / 2 + l * (0.12 + 0.8 * hash01(seed + 700 + i));
      ctx.beginPath();
      ctx.moveTo(sx * w * 0.5, yy);
      ctx.lineTo(sx * w * (0.3 + 0.12 * r), yy + l * 0.035);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Cached dirt overlay for a type and dirt level. */
export function dirtSprite(type: VehicleId, dirt: DirtLevel): Sprite {
  const key = `${type}|${dirt}`;
  const hit = dirtCache.get(key);
  if (hit) return hit;
  const { w, l } = carSize(type);
  const scale = 1.4;
  const c = makeCanvas((w + PAD * 2) * scale, (l + PAD * 2) * scale);
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.scale(scale, scale);
    ctx.translate(w / 2 + PAD, l / 2 + PAD);
    paintDirt(ctx, type, dirt, w, l, 1234 + dirt * 97 + type.length * 13);
  }
  dirtCache.set(key, c);
  return c;
}

export interface DrawCarOptions {
  /** 0..1 how much dirt remains visible. */
  dirt?: number;
  dirtLevel?: DirtLevel;
  /** Global alpha. */
  alpha?: number;
  shadow?: boolean;
}

/**
 * Draws a cached car centered at (x, y) so that a car of length 1.0 measures `unitLength` pixels.
 */
export function drawCar(
  ctx: CanvasRenderingContext2D,
  type: VehicleId,
  color: string,
  x: number,
  y: number,
  unitLength: number,
  angle = 0,
  opts: DrawCarOptions = {},
): void {
  const k = unitLength / CAR_UNIT_L;
  const { w, l } = carSize(type);
  ctx.save();
  ctx.translate(x, y);
  if (angle !== 0) ctx.rotate(angle);
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  if (opts.shadow !== false) {
    const sg = ctx.createRadialGradient(0, l * k * 0.04, 0, 0, l * k * 0.04, l * k * 0.62);
    sg.addColorStop(0, 'rgba(0,0,0,0.5)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.save();
    ctx.scale((w / l) * 1.25, 1);
    ctx.fillRect(-l * k, -l * k * 0.7, l * k * 2, l * k * 1.4);
    ctx.restore();
  }
  const sprite = carSprite(type, color);
  const sw = (w + PAD * 2) * k;
  const shh = (l + PAD * 2) * k;
  ctx.drawImage(sprite, -sw / 2, -shh / 2, sw, shh);
  if (opts.dirt !== undefined && opts.dirt > 0.01 && opts.dirtLevel !== undefined) {
    ctx.globalAlpha = (opts.alpha ?? 1) * Math.min(1, opts.dirt) * (0.55 + opts.dirtLevel * 0.22);
    ctx.drawImage(dirtSprite(type, opts.dirtLevel), -sw / 2, -shh / 2, sw, shh);
  }
  ctx.restore();
}

/** Clears the sprite caches (e.g. after a context loss). */
export function clearCarCaches(): void {
  spriteCache.clear();
  dirtCache.clear();
}
