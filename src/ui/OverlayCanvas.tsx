import { useEffect, useRef } from 'react';
import { registerSurface } from '../render/loop';
import { SCREEN_LAYER, drawParticles, hasParticles, updateParticles } from '../render/particles';

/** Full-screen canvas for coins, floating texts and confetti. */
export function OverlayCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let wasActive = true;
    return registerSurface(
      c,
      (sf, _now, dt) => {
        sf.ctx.clearRect(0, 0, sf.w, sf.h);
        updateParticles(dt, SCREEN_LAYER);
        drawParticles(sf.ctx, SCREEN_LAYER);
      },
      () => {
        const active = hasParticles(SCREEN_LAYER);
        // One extra frame after the last particle so it gets cleared.
        const result = active || wasActive;
        wasActive = active;
        return result;
      },
    );
  }, []);
  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 z-[55] h-full w-full"
      aria-hidden
    />
  );
}
