// Draws one bay: floor by location, lines, number, drain, wall equipment, car, worker and effects.
import type { Bay, Customer, GameState, ServiceId } from '../game/types';
import { EQUIPMENT } from '../game/data/equipment';
import { PALETTE } from '../game/palette';
import { hash01 } from '../game/rng';
import { drawCar } from './carPainter';
import { drawEquipmentGlyph } from './glyphs';
import { drawWorker, toolFor } from './workerPainter';
import {
  drawFilm,
  drawFilmEdge,
  drawFoam,
  drawHeadlightGlow,
  drawInspection,
  drawShineSweep,
  drawSwirls,
  drawWet,
  emitServiceParticles,
  type CarFrame,
} from './effects';
import { burstSparkles, drawParticles, floatText, spawn, updateParticles } from './particles';
import type { Surface } from './loop';

// ---------- Floors ----------

const floorCache = new Map<string, HTMLCanvasElement>();

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export const WALL_FRAC = 0.13;

function paintFloor(
  ctx: CanvasRenderingContext2D,
  loc: number,
  w: number,
  h: number,
  seed: number,
): void {
  const wallH = h * WALL_FRAC;
  // Floor base.
  if (loc === 0) {
    ctx.fillStyle = '#474C55';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const v = 60 + Math.floor(hash01(seed + i) * 40);
      ctx.fillStyle = `rgba(${v},${v + 4},${v + 10},0.35)`;
      ctx.fillRect(hash01(seed + i * 2) * w, wallH + hash01(seed + i * 3) * (h - wallH), 2, 2);
    }
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = 'rgba(15,15,20,0.35)';
      ctx.beginPath();
      ctx.ellipse(
        w * (0.2 + 0.6 * hash01(seed + 40 + i)),
        h * (0.3 + 0.55 * hash01(seed + 50 + i)),
        w * 0.08,
        w * 0.05,
        hash01(seed + i) * 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    const warm = ctx.createRadialGradient(w / 2, wallH, 0, w / 2, wallH, h * 0.9);
    warm.addColorStop(0, 'rgba(255,196,120,0.28)');
    warm.addColorStop(1, 'rgba(255,196,120,0)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, w, h);
  } else if (loc === 1) {
    const tile = Math.max(14, w / 9);
    for (let y = wallH; y < h; y += tile) {
      for (let x = 0; x < w; x += tile) {
        const odd = (Math.floor(x / tile) + Math.floor(y / tile)) % 2 === 0;
        ctx.fillStyle = odd ? '#5A6372' : '#4E5665';
        ctx.fillRect(x, y, tile, tile);
      }
    }
    ctx.strokeStyle = 'rgba(30,35,45,0.5)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, wallH);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    const cool = ctx.createLinearGradient(0, wallH, 0, h);
    cool.addColorStop(0, 'rgba(220,240,255,0.18)');
    cool.addColorStop(1, 'rgba(220,240,255,0)');
    ctx.fillStyle = cool;
    ctx.fillRect(0, 0, w, h);
  } else if (loc === 2) {
    const g = ctx.createLinearGradient(0, wallH, w, h);
    g.addColorStop(0, '#465063');
    g.addColorStop(0.5, '#3A4352');
    g.addColorStop(1, '#333B49');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const sheen = ctx.createLinearGradient(0, 0, w, 0);
    sheen.addColorStop(0.3, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0.07)');
    sheen.addColorStop(0.7, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, wallH, w, h - wallH);
    // Hazard stripes at the entrance.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, h - h * 0.05, w, h * 0.05);
    ctx.clip();
    for (let x = -h; x < w + h; x += 16) {
      ctx.fillStyle = '#EAB308';
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 8, h);
      ctx.lineTo(x + 8 + h * 0.05, h - h * 0.05);
      ctx.lineTo(x + h * 0.05, h - h * 0.05);
      ctx.fill();
    }
    ctx.restore();
  } else {
    const g = ctx.createLinearGradient(0, wallH, 0, h);
    g.addColorStop(0, '#121826');
    g.addColorStop(1, '#0A0E16');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Reflections of the hexagonal ceiling lights.
    const r = w * 0.13;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const cx = col * r * 1.8 + (row % 2) * r * 0.9;
        const cy = wallH + row * r * 1.55 + r * 0.5;
        hexPath(ctx, cx, cy, r * 0.75);
        ctx.strokeStyle = 'rgba(226,240,255,0.10)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  // Wall.
  const wall = ctx.createLinearGradient(0, 0, 0, wallH);
  const wallColors: [string, string][] = [
    ['#3B302B', '#2A221E'],
    ['#1E4A55', '#163842'],
    ['#2B313C', '#1F242D'],
    ['#0B0F17', '#151C2C'],
  ];
  const [wa, wb] = wallColors[loc] ?? ['#222', '#111'];
  wall.addColorStop(0, wa);
  wall.addColorStop(1, wb);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, wallH);
  if (loc === 0) {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    for (let y = 4; y < wallH; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }
  if (loc === 2) {
    ctx.fillStyle = PALETTE.water;
    ctx.shadowColor = PALETTE.water;
    ctx.shadowBlur = 8;
    ctx.fillRect(4, wallH - 3, w - 8, 2);
    ctx.shadowBlur = 0;
  }
  if (loc === 3) {
    for (let i = 0; i < 4; i++) {
      hexPath(ctx, w * (0.15 + i * 0.23), wallH * 0.5, wallH * 0.28);
      ctx.strokeStyle = 'rgba(240,248,255,0.85)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#E0F2FE';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, wallH, w, 3);

  // Parking lines.
  const lineColor =
    loc === 2 ? '#FACC15' : loc === 3 ? 'rgba(248,250,252,0.7)' : 'rgba(241,245,249,0.75)';
  ctx.fillStyle = lineColor;
  const lw = Math.max(2, w * 0.02);
  ctx.fillRect(w * 0.06, wallH + 6, lw, h - wallH - 10);
  ctx.fillRect(w * 0.94 - lw, wallH + 6, lw, h - wallH - 10);

  // Drain grate.
  const dw = w * 0.22;
  const dh = h * 0.035;
  ctx.fillStyle = 'rgba(15,20,28,0.8)';
  ctx.fillRect(w / 2 - dw / 2, h * 0.6, dw, dh);
  ctx.strokeStyle = 'rgba(148,163,184,0.5)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) {
    const x = w / 2 - dw / 2 + (dw * i) / 8;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.6);
    ctx.lineTo(x, h * 0.6 + dh);
    ctx.stroke();
  }
}

function floorFor(loc: number, w: number, h: number, dpr: number, seed: number): HTMLCanvasElement {
  const key = `${loc}|${w}|${h}|${dpr}|${seed}`;
  const hit = floorCache.get(key);
  if (hit) return hit;
  if (floorCache.size > 40) floorCache.clear();
  const c = document.createElement('canvas');
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
    paintFloor(ctx, loc, w, h, seed);
  }
  floorCache.set(key, c);
  return c;
}

// ---------- Per-bay animation memory ----------

interface Departure {
  customer: Customer;
  t: number;
  quality: number;
}

interface BayAnim {
  departures: Departure[];
  lastService: ServiceId | null;
  workerU: number;
  levelRing: number;
}

const anims = new Map<number, BayAnim>();

function animFor(id: number): BayAnim {
  let a = anims.get(id);
  if (!a) {
    a = { departures: [], lastService: null, workerU: Math.random(), levelRing: 0 };
    anims.set(id, a);
  }
  return a;
}

/** Called by the FX handler when a car finishes in this bay. */
export function bayCarDone(bayId: number, customer: Customer, quality: number): void {
  animFor(bayId).departures.push({ customer, t: 0, quality });
}

export function bayLevelUp(bayId: number): void {
  animFor(bayId).levelRing = 1;
}

export function bayBusy(bay: Bay): boolean {
  const a = anims.get(bay.id);
  return (
    !!bay.job ||
    (a !== undefined && (a.departures.length > 0 || a.levelRing > 0)) ||
    bay.tapFlash > 0
  );
}

// ---------- Drawing ----------

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Dirt still visible on the car (0..1). */
function dirtRemaining(services: ServiceId[], serviceIndex: number, phase: number): number {
  const idx = services.indexOf('exterior');
  if (idx >= 0) {
    if (serviceIndex < idx) return 1;
    if (serviceIndex === idx) return 1 - clamp01((phase - 0.35) / 0.5);
    return 0;
  }
  const overall = (serviceIndex + phase) / Math.max(1, services.length);
  return 1 - overall * 0.7;
}

/** Position of the worker around the car for a service (u: 0..1 loop). */
function workerSpot(
  service: ServiceId | null,
  u: number,
  cx: number,
  cy: number,
  hw: number,
  hl: number,
): [number, number] {
  const side = u < 0.5 ? -1 : 1;
  const t = (u % 0.5) / 0.5;
  switch (service) {
    case 'engine':
    case 'headlights':
      return [cx + (t - 0.5) * hw * 1.4, cy - hl - 10];
    case 'interior':
    case 'upholstery':
      return [cx + side * (hw + 12), cy - hl * 0.15 + Math.sin(t * Math.PI * 2) * hl * 0.15];
    case 'wheels': {
      const front = t < 0.5;
      return [cx + side * (hw + 12), cy + (front ? -hl * 0.6 : hl * 0.58)];
    }
    default: {
      // Loop around the whole car.
      const per = 2 * (hw * 2 + hl * 2);
      let d = u * per;
      const W = (hw + 14) * 2;
      const L = (hl + 12) * 2;
      if (d < W) return [cx - W / 2 + d, cy - L / 2];
      d -= W;
      if (d < L) return [cx + W / 2, cy - L / 2 + d];
      d -= L;
      if (d < W) return [cx + W / 2 - d, cy + L / 2];
      d -= W;
      return [cx - W / 2, cy + L / 2 - Math.min(L, d)];
    }
  }
}

export function drawBay(
  sf: Surface,
  s: GameState,
  bay: Bay,
  bayNumber: number,
  now: number,
  dt: number,
): void {
  const { ctx, w, h } = sf;
  const time = now / 1000;
  const anim = animFor(bay.id);
  ctx.drawImage(floorFor(s.location, w, h, sf.dpr, bayNumber * 17), 0, 0, w, h);

  const wallH = h * WALL_FRAC;
  // Equipment icons on the wall.
  const owned = EQUIPMENT.filter((e) => s.equipment[e.id] > 0);
  const icon = Math.min(wallH * 0.62, w / 9);
  const shown = owned.slice(-Math.max(1, Math.floor((w - 16) / (icon * 1.25))));
  shown.forEach((e, i) =>
    drawEquipmentGlyph(ctx, e.id, w - 10 - icon / 2 - i * icon * 1.25, wallH * 0.52, icon),
  );

  // Painted bay number.
  ctx.save();
  ctx.font = `${Math.round(h * 0.16)}px "Russo One", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = s.location === 2 ? 'rgba(250,204,21,0.28)' : 'rgba(241,245,249,0.16)';
  ctx.fillText(bay.isOwner ? '1' : String(bayNumber), w / 2, h * 0.95);
  ctx.restore();

  const cx = w / 2;
  const cy = wallH + (h - wallH) * 0.45;
  const unit = Math.min((h - wallH) * 0.72, w * 1.45);
  const reflect = s.location === 3;

  // Departing cars (finished): drive out downwards with shine.
  for (const d of anim.departures) {
    d.t += dt;
    const k = clamp01(d.t / 0.9);
    const y = cy + easeOut(Math.max(0, k - 0.25) / 0.75) * (h * 0.9);
    const car: CarFrame = { type: d.customer.vehicle, x: cx, y, unit, seed: d.customer.seed };
    drawCar(ctx, d.customer.vehicle, d.customer.color, cx, y, unit);
    const iridescent = d.customer.services.includes('ceramic');
    drawShineSweep(ctx, car, clamp01(d.t / 0.6), iridescent, 1);
    if (d.customer.services.includes('ppf')) drawFilmEdge(ctx, car, 1 - k);
    if (reflect) drawHexReflection(ctx, car, 0.6);
    if (d.t < dt * 1.5) {
      burstSparkles(bay.id, cx, cy, 6, unit * 0.3, '#FFFFFF');
    }
  }
  anim.departures = anim.departures.filter((d) => d.t < 0.9);

  const job = bay.job;
  const doer = bay.isOwner ? null : (s.workers.find((x) => x.id === bay.workerId) ?? null);
  if (job) {
    const c = job.customer;
    const entering = clamp01(job.age / 0.6);
    const y = cy - (1 - easeOut(entering)) * (h * 0.75);
    const service = c.services[job.serviceIndex] ?? null;
    const phase = clamp01(job.duration > 0 ? job.progress / job.duration : 0);
    const dirt = job.handActive ? 1 : dirtRemaining(c.services, job.serviceIndex, phase);
    drawCar(ctx, c.vehicle, c.color, cx, y, unit, 0, { dirt, dirtLevel: c.dirt });
    const car: CarFrame = { type: c.vehicle, x: cx, y, unit, seed: c.seed };
    if (reflect) drawHexReflection(ctx, car, 0.25);

    const working = entering >= 1 && !job.handActive && (bay.isOwner || doer !== null);
    if (service && entering >= 1 && !job.handActive) {
      switch (service) {
        case 'exterior':
          drawFoam(ctx, car, phase < 0.4 ? phase / 0.4 : 1 - clamp01((phase - 0.4) / 0.3), time);
          drawWet(ctx, car, phase > 0.5 ? 1 - clamp01((phase - 0.85) / 0.15) : 0);
          break;
        case 'wax':
          drawSwirls(ctx, car, phase, 'rgba(254,240,138,0.45)');
          if (phase > 0.8) drawShineSweep(ctx, car, (phase - 0.8) / 0.2, false, 0.6);
          break;
        case 'polish':
        case 'correction':
          drawSwirls(ctx, car, 1 - phase, 'rgba(255,255,255,0.35)');
          if (service === 'correction') drawInspection(ctx, car, time);
          break;
        case 'ceramic':
          drawShineSweep(ctx, car, (time * 0.35) % 1, true, 0.5 + phase * 0.5);
          break;
        case 'ppf':
          drawFilm(ctx, car, phase, time);
          break;
        case 'headlights':
          drawHeadlightGlow(ctx, car, phase);
          break;
        case 'clay':
          drawSwirls(ctx, car, phase, 'rgba(74,222,128,0.35)');
          break;
        default:
          break;
      }
    }

    // Worker.
    if (bay.isOwner || doer) {
      const hw = unit * 0.2;
      const hl = unit * 0.45;
      if (service !== anim.lastService) anim.lastService = service;
      if (working) anim.workerU = (anim.workerU + dt * 0.05) % 1;
      const [wx, wy] =
        entering < 1 || job.handActive
          ? [cx - hw - 18, cy + hl * 0.7]
          : workerSpot(service, anim.workerU, cx, y, hw, hl);
      const angle = Math.atan2(y - wy, cx - wx) + Math.PI / 2;
      const size = Math.max(14, unit * 0.13);
      const tool = working ? toolFor(service, phase) : 'none';
      drawWorker(
        ctx,
        wx,
        wy,
        angle,
        size,
        { level: doer?.level ?? 10, skin: doer?.look ?? 1, owner: bay.isOwner },
        tool,
        time,
        working,
      );
      if (anim.levelRing > 0) drawLevelRing(ctx, wx, wy, size, anim.levelRing, time);
      if (working && service) {
        const tx = wx + Math.sin(angle) * size * 0.8;
        const ty = wy - Math.cos(angle) * size * 0.8;
        emitServiceParticles(bay.id, service, phase, tx, ty, cx, y, dt, Math.max(0.7, unit / 140));
      }
    }

    // Tap feedback.
    if (bay.tapFlash > 0) {
      ctx.fillStyle = `rgba(34,211,238,${bay.tapFlash * 0.18})`;
      ctx.fillRect(0, 0, w, h);
    }
  } else if (!bay.isOwner && !doer && anim.departures.length === 0) {
    ctx.fillStyle = 'rgba(11,15,23,0.6)';
    ctx.fillRect(0, wallH, w, h - wallH);
  }

  if (anim.levelRing > 0) {
    anim.levelRing = Math.max(0, anim.levelRing - dt * 0.8);
  }

  updateParticles(dt, bay.id);
  drawParticles(ctx, bay.id);
}

function drawLevelRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  k: number,
  time: number,
): void {
  ctx.save();
  ctx.globalAlpha = Math.min(1, k * 2);
  ctx.strokeStyle = PALETTE.money;
  ctx.shadowColor = PALETTE.money;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(
    x,
    y - size * 0.15,
    size * (0.55 + (1 - k) * 0.4),
    size * (0.3 + (1 - k) * 0.2),
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.money;
  for (let i = 0; i < 3; i++) {
    const a = time * 4 + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(
      x + Math.cos(a) * size * 0.7,
      y - size * 0.15 + Math.sin(a) * size * 0.35,
      2.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

function drawHexReflection(ctx: CanvasRenderingContext2D, car: CarFrame, alpha: number): void {
  // Reflection of the hexagonal ceiling lights on the car (Studio).
  drawShineSweep(ctx, car, 0.35, false, alpha * 0.5);
  const r = car.unit * 0.05;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    hexPath(
      ctx,
      car.x - car.unit * 0.06 + i * r * 1.9,
      car.y - car.unit * 0.05 + (i % 2) * r * 1.6,
      r,
    );
    ctx.stroke();
  }
  ctx.restore();
}

/** Visual reaction to a tap on a bay. */
export function bayTapFx(bayId: number, x: number, y: number, text: string): void {
  floatText(bayId, x, y - 10, text, PALETTE.water, 16);
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    spawn('drop', bayId, x, y, {
      vx: Math.cos(a) * 90,
      vy: Math.sin(a) * 90 - 40,
      life: 0.4,
      size: 2,
      color: 'rgba(125,231,255,0.9)',
    });
  }
}
