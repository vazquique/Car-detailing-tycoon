import { useMemo } from 'react';
import {
  CalendarHeart,
  CloudRain,
  Droplets,
  Flame,
  Gift,
  Megaphone,
  PartyPopper,
  Sparkles,
  Star,
  Tornado,
  Wallet,
  Zap,
} from 'lucide-react';
import { useGame } from '../../store/gameStore';
import { S } from '../../game/data/strings';
import { formatDuration } from '../../game/format';
import { activeModifiers, type ModifierId } from '../../game/sim/events';

const ICONS: Record<ModifierId, typeof Star> = {
  rain: CloudRain,
  dust: Tornado,
  afterRain: Sparkles,
  weekend: PartyPopper,
  payday: Wallet,
  buenFin: Gift,
  aguinaldo: CalendarHeart,
  waterCut: Droplets,
  viral: Flame,
  flyers: Megaphone,
  influencer: Zap,
  social: Megaphone,
};

export function EventBanner() {
  const s = useGame((g) => g.s);
  const mods = useMemo(() => activeModifiers(s), [s]);
  if (mods.length === 0 || s.night > 0) return null;
  const shown = mods.slice(0, 2);
  return (
    <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden" aria-live="polite">
      {shown.map((m) => {
        const Icon = ICONS[m.id];
        const tone =
          m.tone === 'bad'
            ? 'border-loss/40 bg-loss/10 text-[#FECACA]'
            : m.tone === 'good'
              ? 'border-gain/35 bg-gain/10 text-[#BBF7D0]'
              : 'border-warn/40 bg-warn/10 text-[#FED7AA]';
        const effect =
          m.id === 'waterCut'
            ? S.modifiers.noWater
            : S.modifiers.arrivals(Math.round(m.arrivals * 100));
        return (
          <div
            key={m.id}
            className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border px-2 py-1 text-[14px] leading-tight ${tone}`}
          >
            <Icon size={16} className="shrink-0" aria-hidden />
            <div className="min-w-0">
              <div className="truncate font-bold">{S.modifiers[m.id]}</div>
              <div className="tabular truncate opacity-85">
                {effect}
                {m.remaining !== null ? ` · ${formatDuration(m.remaining)}` : ''}
              </div>
            </div>
          </div>
        );
      })}
      {mods.length > 2 && (
        <span className="shrink-0 rounded-full bg-surface-1 px-2 py-1 text-[14px] font-bold text-dim">
          +{mods.length - 2}
        </span>
      )}
    </div>
  );
}
