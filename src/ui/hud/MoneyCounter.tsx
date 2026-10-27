import { useEffect, useRef } from 'react';
import { engine } from '../../store/gameStore';
import { onFrame } from '../../render/loop';
import { formatMoney } from '../../game/format';
import { setMoneyAnchor } from './anchors';

/** Money that counts up smoothly towards the real value (updated outside React). */
export function MoneyCounter() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    setMoneyAnchor(ref.current);
    let shown = engine.state.money;
    let lastText = '';
    const off = onFrame((_now, dt) => {
      const target = engine.state.money;
      const diff = target - shown;
      if (Math.abs(diff) < 0.5) shown = target;
      else shown += diff * Math.min(1, dt * 7);
      const text = formatMoney(shown);
      const el = ref.current;
      if (el && text !== lastText) {
        el.textContent = text;
        el.classList.toggle('text-loss', shown < 0);
        el.classList.toggle('text-money', shown >= 0);
        lastText = text;
      }
    });
    return () => {
      off();
      setMoneyAnchor(null);
    };
  }, []);
  return (
    <span
      ref={ref}
      className="font-display tabular inline-block origin-left text-[30px] leading-none text-money drop-shadow-[0_2px_10px_rgba(250,204,21,0.35)]"
      aria-live="off"
    />
  );
}
