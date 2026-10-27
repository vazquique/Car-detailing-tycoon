import { Lock, Minus, Plus, TrendingUp } from 'lucide-react';
import { engine, useG } from '../../store/gameStore';
import { S, equipmentName, locationName } from '../../game/data/strings';
import { SERVICES } from '../../game/data/services';
import { ECONOMY } from '../../game/data/economy';
import { formatMoney } from '../../game/format';
import { fairPrice, isServiceUnlocked, playerPrice } from '../../game/sim/economy';
import { setPrice } from '../../game/actions/pricing';
import { demandOf, serviceIncomePerHour } from '../../store/selectors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { SERVICE_ICONS } from '../icons';
import type { ServiceId } from '../../game/types';
import { play, vibrate } from '../../audio/sfx';

const DEMAND_TONE = { high: 'gain', mid: 'warn', low: 'loss' } as const;

export function ServicesTab() {
  const s = useG((x) => x);
  return (
    <div className="flex flex-col gap-2 pt-1">
      <p className="px-1 text-[14px] text-dim">{S.services_tab.hint}</p>
      {SERVICES.map((def) => {
        const unlocked = isServiceUnlocked(s, def.id);
        const Icon = SERVICE_ICONS[def.id];
        if (!unlocked) {
          const missing = def.requires.filter((e) => s.equipment[e] <= 0).map(equipmentName);
          return (
            <Card key={def.id} className="flex items-center gap-3 p-3 opacity-80">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-1 text-dim">
                <Lock size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold text-ink">{S.services[def.id].name}</div>
                {s.location < def.minLocation ? (
                  <div className="text-[14px] text-dim">
                    {S.services_tab.needsLocation(locationName(def.minLocation))}
                  </div>
                ) : (
                  <div className="text-[14px] text-dim">
                    {S.services_tab.needs(missing.join(' + '))}
                  </div>
                )}
                <div className="text-[14px] text-dim">
                  {S.services_tab.needsLevel(def.minLevel)}
                </div>
              </div>
              <Icon size={20} className="shrink-0 text-line" aria-hidden />
            </Card>
          );
        }
        return <PriceCard key={def.id} id={def.id} />;
      })}
    </div>
  );
}

function PriceCard({ id }: { id: ServiceId }) {
  const mult = useG((s) => s.prices[id]);
  const fair = useG((s) => fairPrice(s, id));
  const price = useG((s) => playerPrice(s, id));
  const demand = useG((s) => demandOf(s, id));
  const perHour = useG((s) => serviceIncomePerHour(s, id));
  const base = SERVICES.find((d) => d.id === id)?.basePrice ?? 1;
  const Icon = SERVICE_ICONS[id];
  const min = ECONOMY.priceMin * 100;
  const max = ECONOMY.priceMax * 100;
  const fairPct = Math.max(min, Math.min(max, (fair / base) * 100));
  const fairPos = ((fairPct - min) / (max - min)) * 100;
  const change = (next: number): void => {
    if (engine.dispatch(setPrice, { service: id, mult: next })) {
      play('tap');
      vibrate(4);
    }
  };
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-water/12 text-water">
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-ink">{S.services[id].name}</div>
          <div className="flex items-center gap-1.5 text-[14px] text-dim">
            <span>{S.services_tab.demand}:</span>
            <Badge tone={DEMAND_TONE[demand]}>{S.services_tab.demandLevels[demand]}</Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display tabular text-[20px] text-money">{formatMoney(price)}</div>
          <div className="tabular text-[14px] text-dim">
            {S.services_tab.basePct(Math.round(mult * 100))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Bajar precio"
          onClick={() => change(mult - ECONOMY.priceStep)}
          className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-1 text-ink"
        >
          <Minus size={18} />
        </button>
        <div className="relative flex-1">
          <input
            type="range"
            className="price-slider w-full"
            min={min}
            max={max}
            step={ECONOMY.priceStep * 100}
            value={Math.round(mult * 100)}
            aria-label={S.services_tab.price}
            onChange={(e) => change(Number(e.target.value) / 100)}
          />
          <div
            className="pointer-events-none absolute -top-1 bottom-0 flex flex-col items-center"
            style={{
              left: `calc(${fairPos}% + ${(0.5 - fairPos / 100) * 28}px)`,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="h-full w-[2px] rounded bg-gain/80" />
          </div>
        </div>
        <button
          type="button"
          aria-label="Subir precio"
          onClick={() => change(mult + ECONOMY.priceStep)}
          className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-1 text-ink"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between text-[14px]">
        <span className="text-dim">
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-gain align-middle" />
          {S.services_tab.fair}:{' '}
          <span className="tabular font-bold text-gain">{formatMoney(fair)}</span>
        </span>
        <span className="flex items-center gap-1 text-dim">
          <TrendingUp size={14} />
          <span className="tabular font-bold text-ink">
            {S.services_tab.perHourValue(formatMoney(perHour))}
          </span>
        </span>
      </div>
    </Card>
  );
}
