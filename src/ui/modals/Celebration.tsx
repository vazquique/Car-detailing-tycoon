import { useEffect } from 'react';
import { Crown, Sparkles, Store } from 'lucide-react';
import { useUi, type Celebration as C } from '../../store/uiStore';
import { S, locationName, serviceName } from '../../game/data/strings';
import { ACHIEVEMENTS } from '../../game/data/achievements';
import { ACHIEVEMENT_ICONS, SERVICE_ICONS } from '../icons';
import { burstConfetti, SCREEN_LAYER } from '../../render/particles';
import { play, vibrate } from '../../audio/sfx';
import { shake } from '../fx';
import type { ServiceId } from '../../game/types';
import { ECONOMY } from '../../game/data/economy';

function content(c: C): {
  title: string;
  name: string;
  desc: string;
  Icon: typeof Crown;
  color: string;
} {
  switch (c.kind) {
    case 'service': {
      const id = c.id as ServiceId;
      return {
        title: S.celebrations.service,
        name: serviceName(id),
        desc: S.services_tab.unlocked,
        Icon: SERVICE_ICONS[id] ?? Sparkles,
        color: 'text-water',
      };
    }
    case 'location':
      return {
        title: S.celebrations.location,
        name: locationName(c.index),
        desc: S.locations[c.index]?.desc ?? '',
        Icon: Store,
        color: 'text-water',
      };
    case 'achievement': {
      const def = ACHIEVEMENTS.find((a) => a.id === c.id);
      const t = S.achievements[c.id];
      return {
        title: S.celebrations.achievement,
        name: t?.name ?? '',
        desc: `${t?.desc ?? ''} +${Math.round(ECONOMY.achievementIncome * 100)}%`,
        Icon: def ? ACHIEVEMENT_ICONS[def.icon] : Crown,
        color: 'text-money',
      };
    }
    case 'franchise':
      return {
        title: S.celebrations.franchise,
        name: S.franchise.welcome,
        desc: S.franchise.receive(c.pf),
        Icon: Crown,
        color: 'text-soap',
      };
  }
}

export function Celebrations() {
  const list = useUi((u) => u.celebrations);
  const pop = useUi((u) => u.popCelebration);
  const busy = useUi((u) => u.scrubBayId !== null || u.moving !== null || u.modal !== null);
  const current = busy ? undefined : list[0];
  useEffect(() => {
    if (!current) return;
    play(current.kind === 'achievement' ? 'achievement' : 'levelUp');
    vibrate([20, 50, 20]);
    const root = document.querySelector('#game')?.getBoundingClientRect();
    burstConfetti(SCREEN_LAYER, (root?.width ?? 390) / 2, (root?.height ?? 800) * 0.42, 60);
    if (current.kind === 'franchise' || current.kind === 'location') shake();
    const t = window.setTimeout(pop, 3200);
    return () => window.clearTimeout(t);
  }, [current, pop]);
  if (!current) return null;
  const { title, name, desc, Icon, color } = content(current);
  return (
    <button
      type="button"
      className="animate-fade absolute inset-0 z-[52] flex items-center justify-center bg-bg-0/70 p-6"
      onClick={pop}
      aria-label={S.celebrations.tapToContinue}
    >
      <div className="animate-pop relative flex w-full max-w-[320px] flex-col items-center rounded-3xl border border-line bg-bg-1 px-5 pt-8 pb-5 text-center shadow-2xl">
        <div className="absolute -top-14 flex h-28 w-28 items-center justify-center">
          <div className="animate-rays absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,rgba(250,204,21,0.35),transparent_25%,rgba(34,211,238,0.35),transparent_50%,rgba(244,114,182,0.35),transparent_75%,rgba(250,204,21,0.35))] blur-[2px]" />
          <div
            className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-line bg-surface-1 ${color} animate-glow`}
          >
            <Icon size={40} />
          </div>
        </div>
        <div className="mt-8 text-[14px] font-bold tracking-wider text-dim uppercase">{title}</div>
        <div className={`font-display mt-1 text-[24px] leading-tight ${color}`}>{name}</div>
        <p className="mt-2 text-[15px] text-ink/90">{desc}</p>
        <span className="mt-4 text-[14px] text-dim">{S.celebrations.tapToContinue}</span>
      </div>
    </button>
  );
}
