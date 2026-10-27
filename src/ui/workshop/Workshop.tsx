import { useEffect, useRef, useState } from 'react';
import { ArrowBigUpDash, Plus } from 'lucide-react';
import { engine, useG } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { S, locationName } from '../../game/data/strings';
import { buyBay, bayCost, maxBays } from '../../game/actions/purchase';
import { LOCATIONS } from '../../game/data/locations';
import { BuyButton } from '../components/Button';
import { BayTile } from './BayTile';
import { QueueStrip, QUEUE_BLOCK_HEIGHT } from './QueueStrip';

const GAP = 8;

/** Tile height: fill the screen when there are few bays, never squash below 5:4 or stretch past 3:2. */
function useTileHeight(tiles: number): [React.RefObject<HTMLElement | null>, number | null] {
  const ref = useRef<HTMLElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (!size) return [ref, null];
  const colW = (size.w - GAP * 3) / 2;
  const rows = Math.max(1, Math.ceil(tiles / 2));
  const avail = (size.h - QUEUE_BLOCK_HEIGHT - GAP * (rows + 1)) / rows;
  return [ref, Math.round(Math.max(colW * 1.2, Math.min(colW * 1.5, avail)))];
}

export function Workshop() {
  const bayIds = useG((s) => s.bays.map((b) => b.id).join(','));
  const money = useG((s) => s.money);
  const cost = useG(bayCost);
  const max = useG(maxBays);
  const count = useG((s) => s.bays.length);
  const location = useG((s) => s.location);
  const setTab = useUi((u) => u.setTab);
  const ids = bayIds.split(',').filter(Boolean).map(Number);
  const next = LOCATIONS[location + 1];
  const extraTile = count < max || !!next;
  const [ref, tileH] = useTileHeight(ids.length + (extraTile ? 1 : 0));
  const tileStyle = tileH ? { height: tileH } : { aspectRatio: '4 / 5' };
  return (
    <main
      ref={ref}
      className="scroll-area relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
    >
      <QueueStrip />
      <div className="grid grid-cols-2 gap-2 p-2 pb-4">
        {ids.map((id, i) => (
          <BayTile key={id} bayId={id} number={i + 1} style={tileStyle} />
        ))}
        {count < max ? (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface-0/50 p-3 text-center"
            style={tileStyle}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-water/15 text-water">
              <Plus size={26} />
            </span>
            <span className="font-display text-[16px] text-ink">{S.workshop.buyBay}</span>
            <span className="text-[14px] text-dim">
              {count + 1} / {max}
            </span>
            <BuyButton
              small
              className="w-full"
              cost={cost}
              money={money}
              label={S.upgradesTab.buy}
              onBuy={() => engine.run(buyBay)}
            />
          </div>
        ) : next ? (
          <button
            type="button"
            onClick={() => setTab('business')}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line/70 bg-surface-0/30 p-3 text-center"
            style={tileStyle}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-1 text-dim">
              <ArrowBigUpDash size={24} />
            </span>
            <span className="text-[14px] font-bold text-ink">{S.workshop.moveForMore}</span>
            <span className="text-[14px] text-dim">{locationName(location + 1)}</span>
          </button>
        ) : null}
      </div>
    </main>
  );
}
