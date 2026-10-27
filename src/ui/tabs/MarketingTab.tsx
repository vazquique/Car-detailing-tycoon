import { CircleCheck, Clock3 } from 'lucide-react';
import { engine, useG } from '../../store/gameStore';
import { S, locationName } from '../../game/data/strings';
import { MARKETING } from '../../game/data/marketing';
import { formatDuration, formatMoney } from '../../game/format';
import {
  cancelSocial,
  launchMarketing,
  marketingCost,
  marketingStatus,
} from '../../game/actions/marketing';
import { BuyButton, Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressRing';
import { MARKETING_ICONS } from '../icons';
import { play } from '../../audio/sfx';

export function MarketingTab() {
  const s = useG((x) => x);
  return (
    <div className="flex flex-col gap-2 pt-1">
      <p className="px-1 text-[14px] text-dim">{S.marketingTab.hint}</p>
      {MARKETING.map((m) => {
        const status = marketingStatus(s, m.id);
        const Icon = MARKETING_ICONS[m.id];
        const cost = marketingCost(s, m.id);
        const effect = s.effects.find((e) => e.id === m.id);
        const pct = S.marketingPct(m.id);
        return (
          <Card key={m.id} glow={status === 'active'} className="p-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${status === 'active' || status === 'owned' ? 'bg-soap/15 text-soap' : 'bg-surface-1 text-dim'}`}
              >
                <Icon size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[15px] font-bold text-ink">
                    {S.marketing[m.id].name}
                  </span>
                  {status === 'active' && <Badge tone="gain">{S.marketingTab.active}</Badge>}
                  {status === 'owned' && <Badge tone="gain">{S.marketingTab.owned}</Badge>}
                </div>
                <div className="text-[14px] text-dim">
                  {S.marketing[m.id].desc(pct, m.duration)}
                </div>
                {m.kind === 'subscription' && (
                  <div className="text-[14px] text-warn">
                    {S.marketingTab.perDay(formatMoney(cost))}
                  </div>
                )}
              </div>
            </div>
            {status === 'active' && effect && (
              <div className="mt-2 flex items-center gap-2">
                <Clock3 size={15} className="text-dim" />
                <ProgressBar
                  value={effect.remaining / effect.total}
                  className="flex-1"
                  color="bg-soap"
                />
                <span className="tabular text-[14px] text-dim">
                  {S.marketingTab.remaining(formatDuration(effect.remaining))}
                </span>
              </div>
            )}
            {status === 'available' && m.kind === 'subscription' && (
              <Button
                className="mt-2 w-full"
                disabled={s.money < 0}
                onClick={() => {
                  play('buy');
                  engine.dispatch(launchMarketing, { id: m.id });
                }}
              >
                <CircleCheck size={18} /> {S.marketingTab.subscribe}
              </Button>
            )}
            {status === 'active' && m.kind === 'subscription' && (
              <Button
                className="mt-2 w-full"
                variant="secondary"
                onClick={() => engine.run(cancelSocial)}
              >
                {S.marketingTab.unsubscribe}
              </Button>
            )}
            {status === 'available' && m.kind !== 'subscription' && (
              <BuyButton
                className="mt-2 w-full"
                cost={cost}
                money={s.money}
                label={S.marketingTab.launch}
                onBuy={() => engine.dispatch(launchMarketing, { id: m.id })}
              />
            )}
            {status === 'locked' && (
              <BuyButton
                className="mt-2 w-full"
                cost={cost}
                money={s.money}
                label=""
                blocked={S.marketingTab.needsLocation(locationName(m.minLocation))}
                onBuy={() => undefined}
              />
            )}
            {status === 'used' && (
              <p className="mt-2 text-center text-[14px] text-dim">{S.marketingTab.used}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
