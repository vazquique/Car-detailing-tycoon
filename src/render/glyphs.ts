// Tiny canvas icons for services and equipment (used inside the bays and the line).
import type { EquipmentId, ServiceId } from '../game/types';

export const SERVICE_COLORS: Record<ServiceId, string> = {
  exterior: '#22D3EE',
  interior: '#A78BFA',
  wheels: '#94A3B8',
  wax: '#FACC15',
  engine: '#FB923C',
  headlights: '#FEF08A',
  upholstery: '#F472B6',
  clay: '#4ADE80',
  polish: '#38BDF8',
  correction: '#F87171',
  ceramic: '#C084FC',
  ppf: '#E2E8F0',
};

/** Draws a service glyph centered at (x,y) inside a circle of radius r. */
export function drawServiceGlyph(
  ctx: CanvasRenderingContext2D,
  id: ServiceId,
  x: number,
  y: number,
  r: number,
  withBg = true,
): void {
  const c = SERVICE_COLORS[id];
  if (withBg) {
    ctx.fillStyle = '#0B0F17';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c;
    ctx.lineWidth = Math.max(1, r * 0.18);
    ctx.stroke();
  }
  const s = r * 0.55;
  ctx.fillStyle = c;
  ctx.strokeStyle = c;
  ctx.lineWidth = Math.max(1, r * 0.16);
  ctx.lineCap = 'round';
  ctx.beginPath();
  switch (id) {
    case 'exterior':
      ctx.moveTo(x, y - s);
      ctx.quadraticCurveTo(x + s, y + s * 0.1, x, y + s);
      ctx.quadraticCurveTo(x - s, y + s * 0.1, x, y - s);
      ctx.fill();
      break;
    case 'interior':
      for (let i = -1; i <= 1; i++) {
        ctx.moveTo(x - s, y + i * s * 0.6);
        ctx.quadraticCurveTo(x, y + i * s * 0.6 - s * 0.3, x + s, y + i * s * 0.6);
      }
      ctx.stroke();
      break;
    case 'wheels':
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, s * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'wax':
    case 'ceramic': {
      const k = id === 'ceramic' ? 1 : 0.9;
      ctx.moveTo(x, y - s * k);
      ctx.quadraticCurveTo(x, y, x + s * k, y);
      ctx.quadraticCurveTo(x, y, x, y + s * k);
      ctx.quadraticCurveTo(x, y, x - s * k, y);
      ctx.quadraticCurveTo(x, y, x, y - s * k);
      ctx.fill();
      break;
    }
    case 'engine':
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.moveTo(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5);
        ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'headlights':
      ctx.arc(x - s * 0.2, y, s * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      for (let i = -1; i <= 1; i++) {
        ctx.moveTo(x + s * 0.5, y + i * s * 0.45);
        ctx.lineTo(x + s, y + i * s * 0.6);
      }
      ctx.stroke();
      break;
    case 'upholstery':
      ctx.roundRect(x - s * 0.6, y - s, s * 1.2, s * 1.2, s * 0.3);
      ctx.roundRect(x - s * 0.8, y + s * 0.2, s * 1.6, s * 0.7, s * 0.25);
      ctx.fill();
      break;
    case 'clay':
      ctx.roundRect(x - s, y - s * 0.45, s * 2, s * 0.9, s * 0.4);
      ctx.fill();
      break;
    case 'polish':
    case 'correction':
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, s * 0.45, 0.3, Math.PI * 1.6);
      ctx.stroke();
      if (id === 'correction') {
        ctx.beginPath();
        ctx.moveTo(x + s * 0.7, y + s * 0.7);
        ctx.lineTo(x + s * 1.1, y + s * 1.1);
        ctx.stroke();
      }
      break;
    case 'ppf':
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s * 0.85, y - s * 0.55);
      ctx.lineTo(x + s * 0.7, y + s * 0.5);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s * 0.7, y + s * 0.5);
      ctx.lineTo(x - s * 0.85, y - s * 0.55);
      ctx.closePath();
      ctx.stroke();
      break;
  }
  ctx.lineCap = 'butt';
}

/** Small wall icon for a piece of equipment. */
export function drawEquipmentGlyph(
  ctx: CanvasRenderingContext2D,
  id: EquipmentId,
  x: number,
  y: number,
  s: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(1, s * 0.12);
  ctx.lineCap = 'round';
  switch (id) {
    case 'bucket':
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.35);
      ctx.lineTo(s * 0.5, -s * 0.35);
      ctx.lineTo(s * 0.38, s * 0.5);
      ctx.lineTo(-s * 0.38, s * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.arc(0, -s * 0.35, s * 0.45, Math.PI, 0);
      ctx.stroke();
      break;
    case 'pressureWasher':
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-s * 0.5, -s * 0.3, s * 0.7, s * 0.7);
      ctx.strokeStyle = '#1F2937';
      ctx.beginPath();
      ctx.moveTo(s * 0.2, 0);
      ctx.lineTo(s * 0.55, -s * 0.45);
      ctx.stroke();
      break;
    case 'vacuum':
      ctx.fillStyle = '#A78BFA';
      ctx.beginPath();
      ctx.arc(-s * 0.1, s * 0.1, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.moveTo(s * 0.2, -s * 0.1);
      ctx.quadraticCurveTo(s * 0.6, -s * 0.5, s * 0.3, -s * 0.55);
      ctx.stroke();
      break;
    case 'wheelKit':
      ctx.strokeStyle = '#94A3B8';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'waxKit':
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.1, s * 0.45, s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF9C3';
      ctx.fillRect(-s * 0.45, -s * 0.15, s * 0.9, s * 0.18);
      break;
    case 'foamCannon':
      ctx.fillStyle = '#F472B6';
      ctx.fillRect(-s * 0.15, -s * 0.1, s * 0.3, s * 0.55);
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(-s * 0.25 + i * s * 0.25, -s * 0.3, s * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'engineKit':
      ctx.strokeStyle = '#FB923C';
      ctx.strokeRect(-s * 0.4, -s * 0.3, s * 0.8, s * 0.6);
      ctx.beginPath();
      ctx.moveTo(-s * 0.2, -s * 0.3);
      ctx.lineTo(-s * 0.2, -s * 0.5);
      ctx.moveTo(s * 0.2, -s * 0.3);
      ctx.lineTo(s * 0.2, -s * 0.5);
      ctx.stroke();
      break;
    case 'headlightKit':
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(-s * 0.1, 0, s * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'extractor':
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.roundRect(-s * 0.35, -s * 0.45, s * 0.7, s * 0.9, s * 0.15);
      ctx.fill();
      ctx.fillStyle = '#FDF2F8';
      ctx.fillRect(-s * 0.2, -s * 0.3, s * 0.4, s * 0.15);
      break;
    case 'clayKit':
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.roundRect(-s * 0.45, -s * 0.2, s * 0.9, s * 0.4, s * 0.18);
      ctx.fill();
      break;
    case 'orbitalPolisher':
    case 'rotaryPolisher':
      ctx.fillStyle = id === 'orbitalPolisher' ? '#38BDF8' : '#F87171';
      ctx.beginPath();
      ctx.arc(0, s * 0.1, s * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(-s * 0.1, -s * 0.5, s * 0.2, s * 0.4);
      break;
    case 'inspectionLamps':
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(-s * 0.45, -s * 0.12, s * 0.9, s * 0.24);
      ctx.fillStyle = 'rgba(248,250,252,0.3)';
      ctx.beginPath();
      ctx.moveTo(-s * 0.45, s * 0.12);
      ctx.lineTo(s * 0.45, s * 0.12);
      ctx.lineTo(s * 0.6, s * 0.55);
      ctx.lineTo(-s * 0.6, s * 0.55);
      ctx.fill();
      break;
    case 'curingBooth':
      ctx.strokeStyle = '#C084FC';
      ctx.strokeRect(-s * 0.45, -s * 0.4, s * 0.9, s * 0.8);
      ctx.fillStyle = 'rgba(192,132,252,0.5)';
      ctx.fillRect(-s * 0.3, -s * 0.25, s * 0.6, s * 0.5);
      break;
    case 'ppfPlotter':
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(-s * 0.5, -s * 0.2, s, s * 0.35);
      ctx.fillStyle = '#22D3EE';
      ctx.fillRect(-s * 0.35, s * 0.15, s * 0.7, s * 0.25);
      break;
  }
  ctx.restore();
}
