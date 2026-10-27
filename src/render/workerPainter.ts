// Top-down workers: cap colored by level, shoulders, swinging arms and the tool of the current service.
import type { ServiceId } from '../game/types';
import { LEVEL_COLORS, SKIN_TONES, PALETTE } from '../game/palette';

export type Tool =
  'sponge' | 'gun' | 'hose' | 'brush' | 'polisher' | 'towel' | 'applicator' | 'none';

export function toolFor(service: ServiceId | null, phase: number): Tool {
  switch (service) {
    case 'exterior':
      return phase < 0.4 ? 'sponge' : phase < 0.85 ? 'gun' : 'towel';
    case 'engine':
      return 'gun';
    case 'interior':
    case 'upholstery':
      return 'hose';
    case 'wheels':
      return 'brush';
    case 'wax':
    case 'ceramic':
    case 'clay':
      return 'applicator';
    case 'polish':
    case 'correction':
      return 'polisher';
    case 'headlights':
      return 'polisher';
    case 'ppf':
      return 'applicator';
    default:
      return 'none';
  }
}

export interface WorkerLook {
  level: number;
  skin: number;
  owner: boolean;
}

/**
 * Draws a worker at (x,y) facing `angle` (radians, 0 = up). `size` is the shoulder width in px.
 */
export function drawWorker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  look: WorkerLook,
  tool: Tool,
  time: number,
  working: boolean,
): void {
  const s = size;
  const swing = working ? Math.sin(time * 9) * 0.35 : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(s * 0.06, s * 0.1, s * 0.62, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  const shirt = look.owner ? '#0EA5E9' : '#1E293B';
  const trim = look.owner ? PALETTE.money : (LEVEL_COLORS[look.level - 1] ?? '#94A3B8');
  const skin = SKIN_TONES[look.skin % SKIN_TONES.length] ?? '#E0AC69';

  // Arms (reaching forward).
  for (const side of [-1, 1]) {
    const a = side * (0.25 + (side > 0 ? swing : -swing));
    ctx.save();
    ctx.translate(side * s * 0.38, 0);
    ctx.rotate(a);
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.roundRect(-s * 0.1, -s * 0.62, s * 0.2, s * 0.62, s * 0.1);
    ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -s * 0.64, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Tool in front of the hands.
  drawTool(ctx, tool, 0, -s * 0.78, s, time, working);

  // Shoulders.
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.5, s * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = trim;
  ctx.lineWidth = Math.max(1, s * 0.06);
  ctx.stroke();

  // Head and cap.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -s * 0.02, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = trim;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.2, s * 0.17, s * 0.1, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(-s * 0.06, -s * 0.05, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTool(
  ctx: CanvasRenderingContext2D,
  tool: Tool,
  x: number,
  y: number,
  s: number,
  time: number,
  working: boolean,
): void {
  switch (tool) {
    case 'sponge':
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.roundRect(x - s * 0.2, y - s * 0.12, s * 0.4, s * 0.24, s * 0.08);
      ctx.fill();
      ctx.fillStyle = 'rgba(180,120,0,0.5)';
      ctx.fillRect(x - s * 0.12, y - s * 0.04, s * 0.06, s * 0.06);
      ctx.fillRect(x + s * 0.05, y - s * 0.02, s * 0.05, s * 0.05);
      break;
    case 'towel':
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.roundRect(x - s * 0.24, y - s * 0.12, s * 0.48, s * 0.24, s * 0.06);
      ctx.fill();
      break;
    case 'gun':
      ctx.fillStyle = '#334155';
      ctx.fillRect(x - s * 0.05, y - s * 0.32, s * 0.1, s * 0.4);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(x - s * 0.08, y, s * 0.16, s * 0.12);
      break;
    case 'hose':
      ctx.strokeStyle = '#A78BFA';
      ctx.lineWidth = s * 0.1;
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.1);
      ctx.lineTo(x, y - s * 0.3);
      ctx.stroke();
      ctx.fillStyle = '#4C1D95';
      ctx.fillRect(x - s * 0.12, y - s * 0.36, s * 0.24, s * 0.08);
      break;
    case 'brush':
      ctx.fillStyle = '#64748B';
      ctx.fillRect(x - s * 0.04, y - s * 0.1, s * 0.08, s * 0.3);
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.ellipse(x, y - s * 0.15, s * 0.14, s * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'applicator':
      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.ellipse(x, y, s * 0.16, s * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'polisher': {
      const r = s * 0.24;
      ctx.fillStyle = '#1F2937';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(working ? time * 30 : 0);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, 0, Math.PI * 1.3);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'none':
      break;
  }
}
