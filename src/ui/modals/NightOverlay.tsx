import { Moon } from 'lucide-react';
import { useG } from '../../store/gameStore';
import { S } from '../../game/data/strings';

/** Short night transition while the shop closes. */
export function NightOverlay() {
  const night = useG((s) => s.night);
  if (night <= 0) return null;
  return (
    <div className="animate-fade pointer-events-none absolute inset-0 z-[45] flex items-center justify-center bg-gradient-to-b from-[#05070C]/90 via-[#0B1530]/85 to-[#05070C]/90">
      <div className="flex flex-col items-center gap-3">
        <Moon
          size={54}
          className="text-[#C7D2FE] drop-shadow-[0_0_18px_rgba(199,210,254,0.7)]"
          fill="#C7D2FE"
        />
        <span className="font-display text-[20px] text-ink">{S.daySummary.night}</span>
      </div>
    </div>
  );
}
