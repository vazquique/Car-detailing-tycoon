import { useEffect, useLayoutEffect, useState } from 'react';
import { Hand, X } from 'lucide-react';
import { useG } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { S } from '../../game/data/strings';
import { formatMoney } from '../../game/format';
import { equipmentCost } from '../../game/actions/purchase';

type Step = 'welcome' | 'tapCar' | 'firstPay' | 'buyWasher' | 'hire' | 'prices' | 'goal' | null;

const TARGETS: Partial<Record<NonNullable<Step>, string>> = {
  tapCar: 'owner-bay',
  buyWasher: 'tab-upgrades',
  hire: 'tab-staff',
  prices: 'tab-services',
  firstPay: 'money',
};

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function useTargetRect(id: string | undefined): Rect | null {
  const [state, setState] = useState<{ id: string; rect: Rect } | null>(null);
  useLayoutEffect(() => {
    if (!id) return;
    let timer = 0;
    const measure = (): void => {
      const el = document.querySelector(`[data-tutorial="${id}"]`);
      const root = document.querySelector('#game')?.getBoundingClientRect();
      const r = el?.getBoundingClientRect();
      if (r && root) {
        const next = { x: r.left - root.left, y: r.top - root.top, w: r.width, h: r.height };
        setState((prev) =>
          prev &&
          prev.id === id &&
          prev.rect.x === next.x &&
          prev.rect.y === next.y &&
          prev.rect.w === next.w &&
          prev.rect.h === next.h
            ? prev
            : { id, rect: next },
        );
      }
      timer = window.setTimeout(measure, 250);
    };
    measure();
    return () => window.clearTimeout(timer);
  }, [id]);
  return id && state?.id === id ? state.rect : null;
}

export function Tutorial() {
  const done = useUi((u) => u.settings.tutorialDone);
  const pricesSeen = useUi((u) => u.settings.tutorialPrices);
  const setSetting = useUi((u) => u.setSetting);
  const tab = useUi((u) => u.tab);
  const modal = useUi((u) => u.modal);
  const scrub = useUi((u) => u.scrubBayId);
  const moving = useUi((u) => u.moving);
  const cars = useG((s) => s.runStats.carsServed);
  const washer = useG((s) => s.equipment.pressureWasher);
  const workers = useG((s) => s.workers.length);
  const money = useG((s) => s.money);
  const washerCost = useG((s) => equipmentCost(s, 'pressureWasher'));
  const [welcomeOver, setWelcomeOver] = useState(false);
  const [goalOver, setGoalOver] = useState(false);

  let step: Step = null;
  if (!done) {
    if (cars === 0) step = welcomeOver ? 'tapCar' : 'welcome';
    else if (washer === 0) step = money < washerCost ? 'firstPay' : 'buyWasher';
    else if (workers === 0) step = 'hire';
    else if (!pricesSeen) step = 'prices';
    else step = 'goal';
  }

  useEffect(() => {
    if (done || welcomeOver) return;
    const t = window.setTimeout(() => setWelcomeOver(true), 3200);
    return () => window.clearTimeout(t);
  }, [done, welcomeOver]);

  useEffect(() => {
    if (step === 'prices' && tab === 'services') setSetting('tutorialPrices', true);
  }, [step, tab, setSetting]);

  useEffect(() => {
    if (step !== 'goal' || modal || tab) return;
    const t = window.setTimeout(() => setGoalOver(true), 5500);
    return () => window.clearTimeout(t);
  }, [step, modal, tab]);

  useEffect(() => {
    if (goalOver && !done) setSetting('tutorialDone', true);
  }, [goalOver, done, setSetting]);

  const target = step ? TARGETS[step] : undefined;
  const rect = useTargetRect(target);

  // Stay out of the way of sheets, modals, the mini-game and the moving animation.
  const tabStep = step === 'buyWasher' || step === 'hire' || step === 'prices';
  if (!step || scrub !== null || moving !== null || modal) return null;
  if (tab && !(tabStep && tab !== stepTab(step))) return null;

  const text =
    step === 'welcome'
      ? S.tutorial.welcome
      : step === 'tapCar'
        ? S.tutorial.firstCustomer
        : step === 'firstPay'
          ? S.tutorial.firstPay(formatMoney(washerCost))
          : step === 'buyWasher'
            ? S.tutorial.buyWasher
            : step === 'hire'
              ? S.tutorial.hire
              : step === 'prices'
                ? S.tutorial.prices
                : S.tutorial.goal;

  const pad = 6;
  const spot = rect && step !== 'firstPay' ? rect : null;
  const bubbleBelow = !spot || spot.y < 300;
  return (
    <div className="pointer-events-none absolute inset-0 z-[48]" aria-live="polite">
      {spot ? (
        <div
          className="absolute rounded-2xl"
          style={{
            left: spot.x - pad,
            top: spot.y - pad,
            width: spot.w + pad * 2,
            height: spot.h + pad * 2,
            animation: 'spotlight 1.6s ease-in-out infinite',
          }}
        />
      ) : (
        step !== 'firstPay' && <div className="animate-fade absolute inset-0 bg-bg-0/55" />
      )}
      {spot && (
        <div
          className="absolute"
          style={{
            left: spot.x + spot.w / 2 - 22,
            top: bubbleBelow ? spot.y + spot.h * 0.55 : spot.y - 10,
            animation: 'hand-tap 1s ease-in-out infinite',
          }}
        >
          <Hand
            size={44}
            fill="#E8EEF9"
            className="text-bg-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
          />
        </div>
      )}
      <div
        className="animate-pop absolute inset-x-4 flex items-start gap-3 rounded-2xl border border-water/50 bg-bg-1 p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
        style={
          spot
            ? bubbleBelow
              ? { top: Math.min(spot.y + spot.h + 64, 600) }
              : { top: Math.max(90, spot.y - 150) }
            : step === 'firstPay'
              ? { top: 'calc(var(--safe-top) + 112px)' }
              : { top: '38%' }
        }
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-water/15 text-water">
          <Hand size={22} />
        </div>
        <p className="flex-1 pt-0.5 text-[16px] leading-snug font-medium text-ink">{text}</p>
        <button
          type="button"
          aria-label={S.tutorial.skip}
          onClick={() => setSetting('tutorialDone', true)}
          className="pointer-events-auto -mt-1 -mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-dim"
        >
          <X size={20} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => setSetting('tutorialDone', true)}
        className="pointer-events-auto absolute right-3 rounded-full border border-line bg-bg-1/90 px-3 py-2 text-[14px] font-bold text-dim"
        style={{ bottom: 'calc(var(--safe-bottom) + 76px)' }}
      >
        {S.tutorial.skip}
      </button>
    </div>
  );
}

function stepTab(step: Step): string | null {
  if (step === 'buyWasher') return 'upgrades';
  if (step === 'hire') return 'staff';
  if (step === 'prices') return 'services';
  return null;
}
