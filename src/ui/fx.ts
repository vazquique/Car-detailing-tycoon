// Turns engine FX events into particles, sounds, toasts and celebrations.
import type { FxEvent, GameState } from '../game/types';
import { engine } from '../store/gameStore';
import { useUi } from '../store/uiStore';
import { S, serviceName } from '../game/data/strings';
import { formatMoney } from '../game/format';
import { PALETTE } from '../game/palette';
import { bayCarDone, bayLevelUp } from '../render/bayPainter';
import { queueAngry, queueHonk } from '../render/queuePainter';
import { SCREEN_LAYER, burstConfetti, floatText, setCoinArrive, spawn } from '../render/particles';
import { bumpMoney, moneyPoint, toRoot } from './hud/anchors';
import { play, vibrate } from '../audio/sfx';
import { ACHIEVEMENTS } from '../game/data/achievements';

let lastReviewToast = 0;
let lastAngryToast = 0;
let lastHonkToast = 0;

function bayCenter(bayId: number): [number, number] | null {
  const el = document.querySelector(`[data-bay="${bayId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.bottom < 0 || r.top > window.innerHeight) return null;
  return toRoot(r.left + r.width / 2, r.top + r.height * 0.5);
}

function queueWidth(): number {
  const el = document.querySelector('[data-tutorial="queue"]');
  return el?.getBoundingClientRect().width ?? 360;
}

/** Coins fly from a point to the money counter. */
export function coinsFrom(x: number, y: number, n: number): void {
  const [tx, ty] = moneyPoint();
  for (let i = 0; i < n; i++) {
    spawn('coin', SCREEN_LAYER, x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 20, {
      life: 0.6 + i * 0.06 + Math.random() * 0.1,
      size: 7,
      tx,
      ty,
      a: (Math.random() - 0.5) * 2,
    });
  }
}

export function burstCoinsFromCenter(n: number): void {
  const root = document.querySelector('#game')?.getBoundingClientRect();
  const w = root?.width ?? 390;
  const h = root?.height ?? 800;
  coinsFrom(w / 2, h / 2, n);
  burstConfetti(SCREEN_LAYER, w / 2, h / 2, 40);
}

/** Subtle screen shake for big moments (skipped with reduced motion). */
export function shake(): void {
  if (useUi.getState().settings.reducedMotion) return;
  const el = document.querySelector('#game');
  if (!el) return;
  el.classList.remove('animate-shake');
  void (el as HTMLElement).offsetWidth;
  el.classList.add('animate-shake');
}

let coinSound = 0;
setCoinArrive(() => {
  coinSound++;
  if (coinSound % 2 === 0) play('coin');
  bumpMoney();
});

function handle(e: FxEvent, s: GameState): void {
  const ui = useUi.getState();
  switch (e.kind) {
    case 'paid': {
      bayCarDone(e.bayId, e.customer, e.quality);
      // Coins and texts only fly from bays the player can actually see.
      const covered = ui.tab !== null || ui.modal !== null || ui.scrubBayId !== null;
      const p = covered ? null : bayCenter(e.bayId);
      const total = e.amount + e.tip;
      play('cash');
      vibrate(12);
      if (p) {
        if (total > 0) {
          coinsFrom(p[0], p[1], Math.min(8, 3 + Math.floor(Math.log10(Math.max(10, total)))));
          floatText(SCREEN_LAYER, p[0], p[1] - 20, S.income(formatMoney(total)), PALETTE.money, 22);
        }
        if (e.stars > 0 && e.stars >= 4)
          floatText(SCREEN_LAYER, p[0], p[1] + 8, '★'.repeat(e.stars), PALETTE.star, 16);
      }
      break;
    }
    case 'angry':
      queueAngry(e.customer);
      play('angry');
      if (performance.now() - lastAngryToast > 6000) {
        lastAngryToast = performance.now();
        ui.toast(S.events.angry, 'bad');
      }
      break;
    case 'honk':
      queueHonk(queueWidth());
      play('honk');
      if (performance.now() - lastHonkToast > 15000) {
        lastHonkToast = performance.now();
        ui.toast(S.events.honk, 'info');
      }
      break;
    case 'arrive':
      play('pop');
      break;
    case 'review':
      if (performance.now() - lastReviewToast > 9000 && e.review.stars >= 4) {
        lastReviewToast = performance.now();
        ui.toast(`${'★'.repeat(e.review.stars)} “${e.review.text}”`, 'good');
      }
      break;
    case 'levelUp': {
      const w = s.workers.find((x) => x.id === e.workerId);
      const bay = s.bays.find((b) => b.workerId === e.workerId);
      if (bay) bayLevelUp(bay.id);
      play('levelUp');
      if (w) ui.toast(S.toasts.levelUp(w.name, w.level), 'good');
      break;
    }
    case 'achievement': {
      const def = ACHIEVEMENTS.find((a) => a.id === e.id);
      if (def) ui.celebrate({ kind: 'achievement', id: e.id });
      break;
    }
    case 'unlockService':
      ui.celebrate({ kind: 'service', id: e.id });
      break;
    case 'hint':
      ui.toast(S.events.hint(serviceName(e.service)), 'info');
      break;
    case 'dayEnd':
      play('whoosh');
      break;
    case 'dayStart': {
      const summary = s.lastSummary;
      if (summary && ui.settings.daySummary && !ui.modal && ui.scrubBayId === null)
        ui.openModal({ kind: 'daySummary', summary });
      break;
    }
    case 'vip':
      play('achievement');
      ui.toast(S.events.vip, 'money');
      break;
    case 'contractOffer':
      ui.toast(S.contracts.newOffer, 'info');
      break;
    case 'contractDone': {
      if (e.success) {
        play('achievement');
        ui.toast(S.contracts.success(e.client), 'good');
        burstCoinsFromCenter(16);
        shake();
      } else {
        play('error');
        ui.toast(S.contracts.fail(e.client), 'bad');
      }
      break;
    }
    case 'fine':
      play('error');
      vibrate([30, 40, 30]);
      ui.toast(S.events.inspector(formatMoney(e.amount)), 'bad');
      break;
    case 'event':
      switch (e.id) {
        case 'waterCutStart':
          play('error');
          ui.toast(S.events.waterCutStart, 'bad');
          break;
        case 'waterCutEnd':
          ui.toast(S.events.waterCutEnd, 'good');
          break;
        case 'viral':
          play('achievement');
          ui.toast(S.events.viral, 'good');
          break;
        case 'inspectorOk':
          ui.toast(S.events.inspectorOk, 'good');
          break;
        case 'vipHappy':
          ui.toast(S.events.vipHappy, 'money');
          break;
        case 'vipSad':
          ui.toast(S.events.vipSad, 'bad');
          break;
        default:
          break;
      }
      break;
    case 'serviceStep':
      break;
  }
}

let installed = false;
export function installFx(): void {
  if (installed) return;
  installed = true;
  engine.onFx(handle);
}
