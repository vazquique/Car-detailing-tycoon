import { useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import { engine, useG } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { registerSurface } from '../../render/loop';
import { drawQueue, queueHit } from '../../render/queuePainter';
import { queueCapacity } from '../../game/sim/economy';
import { S } from '../../game/data/strings';
import { unlockAudio, play } from '../../audio/sfx';

export const QUEUE_HEIGHT = 118;
/** Lane plus the small caption bar under it. */
export const QUEUE_BLOCK_HEIGHT = QUEUE_HEIGHT + 28;

export function QueueStrip() {
  const ref = useRef<HTMLCanvasElement>(null);
  const count = useG((s) => s.queue.length);
  const cap = useG(queueCapacity);
  const night = useG((s) => s.night > 0);
  const openModal = useUi((u) => u.openModal);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    return registerSurface(c, (sf, now, dt) => drawQueue(sf, engine.state, now, dt));
  }, []);

  return (
    <div className="sticky top-0 z-10 border-b border-line/70 bg-bg-0" data-tutorial="queue">
      <div className="relative" style={{ height: QUEUE_HEIGHT }}>
        <canvas
          ref={ref}
          className="absolute inset-0 h-full w-full"
          onPointerUp={(e) => {
            unlockAudio();
            const r = ref.current?.getBoundingClientRect();
            if (!r) return;
            const c = queueHit(engine.state, r.width, e.clientX - r.left);
            if (c) {
              play('tap');
              openModal({ kind: 'customer', customerId: c.id });
            }
          }}
        />
        {count === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[14px] font-medium text-dim">
            {night ? S.daySummary.night : S.workshop.queueEmpty}
          </div>
        )}
      </div>
      <div className="flex h-7 items-center justify-between bg-bg-1/80 px-3 text-[14px] text-dim">
        <span className="flex items-center gap-1.5 font-bold">
          <Users size={14} aria-hidden />
          <span className="tabular">
            {S.workshop.queue} {count}/{cap}
          </span>
        </span>
        {count > 0 && <span className="truncate pl-2">{S.workshop.queueTip}</span>}
      </div>
    </div>
  );
}
