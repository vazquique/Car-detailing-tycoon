import { useMemo } from 'react';
import { Briefcase, Megaphone, Tag, Users, Warehouse, Wrench } from 'lucide-react';
import { useGame } from '../store/gameStore';
import { useUi, type TabId } from '../store/uiStore';
import { S } from '../game/data/strings';
import { affordableKeys } from '../store/selectors';
import { play, unlockAudio, vibrate } from '../audio/sfx';

export const TAB_BAR_HEIGHT = 64;

const TABS: { id: TabId; icon: typeof Wrench }[] = [
  { id: 'workshop', icon: Warehouse },
  { id: 'services', icon: Tag },
  { id: 'staff', icon: Users },
  { id: 'upgrades', icon: Wrench },
  { id: 'marketing', icon: Megaphone },
  { id: 'business', icon: Briefcase },
];

export function TabBar() {
  const tab = useUi((u) => u.tab);
  const setTab = useUi((u) => u.setTab);
  const seen = useUi((u) => u.seen);
  const markSeen = useUi((u) => u.markSeen);
  const s = useGame((g) => g.s);
  const keys = useMemo(() => affordableKeys(s), [s]);
  const dots = useMemo(() => {
    const out: Partial<Record<TabId, boolean>> = {};
    for (const t of TABS) {
      const list = keys[t.id] ?? [];
      const known = seenKeys.get(t.id);
      out[t.id] = list.some((k) => !known?.has(k));
    }
    void seen;
    return out;
  }, [keys, seen]);

  return (
    <nav
      className="relative z-40 shrink-0 border-t border-line bg-bg-1/95 backdrop-blur"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
      aria-label="Pestañas"
    >
      <div className="grid grid-cols-6" style={{ height: TAB_BAR_HEIGHT }}>
        {TABS.map(({ id, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              data-tutorial={`tab-${id}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => {
                unlockAudio();
                play('tap');
                vibrate(6);
                const list = keys[id] ?? [];
                seenKeys.set(id, new Set(list));
                markSeen(id, Date.now());
                setTab(active ? null : id);
              }}
              className={`relative flex flex-col items-center justify-center gap-0.5 ${active ? 'text-water' : 'text-dim'}`}
            >
              {active && (
                <span className="absolute top-0 h-[3px] w-10 rounded-b-full bg-water shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
              )}
              <span className="relative">
                <Icon size={23} strokeWidth={active ? 2.4 : 2} />
                {dots[id] && !active && (
                  <span
                    className="absolute -top-1 -right-1.5 h-2.5 w-2.5 rounded-full border-2 border-bg-1 bg-loss"
                    aria-label="Novedades"
                  />
                )}
              </span>
              <span
                className={`text-[14px] leading-tight tracking-tight ${active ? 'font-bold' : 'font-medium'}`}
              >
                {S.tabs[id]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Keys the player has already seen per tab (in memory for the session). */
const seenKeys = new Map<string, Set<string>>();
