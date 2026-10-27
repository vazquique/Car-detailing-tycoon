import { useEffect } from 'react';
import { Truck } from 'lucide-react';
import { useUi } from '../../store/uiStore';
import { S, locationName } from '../../game/data/strings';
import { burstConfetti, SCREEN_LAYER } from '../../render/particles';
import { play, vibrate } from '../../audio/sfx';
import { refitAll } from '../../render/loop';

const MOVE_MS = 2600;

/** Moving animation: truck crosses, confetti and the new sign. */
export function MovingOverlay() {
  const moving = useUi((u) => u.moving);
  const setMoving = useUi((u) => u.setMoving);
  const celebrate = useUi((u) => u.celebrate);
  const toast = useUi((u) => u.toast);
  useEffect(() => {
    if (moving === null) return;
    play('whoosh');
    vibrate([20, 60, 20]);
    const t1 = window.setTimeout(() => {
      const root = document.querySelector('#game')?.getBoundingClientRect();
      burstConfetti(SCREEN_LAYER, (root?.width ?? 390) / 2, (root?.height ?? 800) * 0.45, 80);
      play('achievement');
    }, MOVE_MS * 0.55);
    const t2 = window.setTimeout(() => {
      setMoving(null);
      refitAll();
      celebrate({ kind: 'location', index: moving });
      toast(S.toasts.moved(locationName(moving)), 'good');
    }, MOVE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [moving, setMoving, celebrate, toast]);
  if (moving === null) return null;
  return (
    <div className="animate-fade absolute inset-0 z-[58] flex flex-col items-center justify-center overflow-hidden bg-bg-0">
      <div className="font-display text-[22px] text-dim">{S.moving.title}</div>
      <div className="relative mt-6 h-28 w-full">
        <div className="absolute inset-x-0 bottom-3 h-1 bg-line" />
        <div
          className="absolute bottom-4 left-1/2 -ml-16 flex w-32 justify-center"
          style={{ animation: `truck ${MOVE_MS}ms ease-in-out forwards` }}
        >
          <Truck size={96} className="text-water drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
        </div>
      </div>
      <div
        className="animate-pop mt-6 rounded-2xl border-2 border-money/70 bg-surface-1 px-5 py-3 text-center shadow-[0_0_30px_rgba(250,204,21,0.25)]"
        style={{ animationDelay: `${MOVE_MS * 0.5}ms`, animationFillMode: 'both' }}
      >
        <div className="font-display text-[22px] text-money">{locationName(moving)}</div>
      </div>
    </div>
  );
}
