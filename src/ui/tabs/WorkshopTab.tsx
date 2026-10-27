import { CircleCheck, Clock3, FileText, MessageSquareQuote, Plus, Star, X } from 'lucide-react';
import { engine, useG } from '../../store/gameStore';
import { S, locationName } from '../../game/data/strings';
import { formatMoney } from '../../game/format';
import { BAY_LEVEL_SPEED, BAY_MAX_LEVEL } from '../../game/data/locations';
import { CONTRACTS } from '../../game/data/contracts';
import { bayCost, bayLevelCost, buyBay, maxBays, upgradeBay } from '../../game/actions/purchase';
import { acceptContract, rejectCustomer } from '../../game/actions/workshop';
import { contractsAvailable } from '../../game/sim/contracts';
import { canWorkerDo, isServiceUnlocked, isVehicleUnlocked } from '../../game/sim/economy';
import { BuyButton, Button } from '../components/Button';
import { Card, SectionTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Stars } from '../components/Stars';
import { ProgressBar } from '../components/ProgressRing';
import { SERVICE_ICONS } from '../icons';
import { VEHICLE_BY_ID } from '../../game/data/vehicles';
import type { Customer, GameState } from '../../game/types';
import { play } from '../../audio/sfx';

export function ServiceChips({ services }: { services: Customer['services'] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {services.map((id) => {
        const Icon = SERVICE_ICONS[id];
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded-lg bg-surface-1 px-1.5 py-0.5 text-[14px] text-ink"
          >
            <Icon size={14} className="text-water" aria-hidden />
            {S.services[id].short}
          </span>
        );
      })}
    </div>
  );
}

function canAnyoneDo(s: GameState, c: Customer): boolean {
  if (canWorkerDo(s, null, c)) return true;
  return s.workers.some((w) => canWorkerDo(s, w, c));
}

export function WorkshopTab() {
  const s = useG((x) => x);
  const max = maxBays(s);
  return (
    <div>
      <SectionTitle right={<Badge tone="dim">{`${s.bays.length}/${max}`}</Badge>}>
        {S.workshop.bays}
      </SectionTitle>
      <div className="flex flex-col gap-2">
        {s.bays.map((b, i) => {
          const worker = s.workers.find((w) => w.id === b.workerId);
          const pct = Math.round(BAY_LEVEL_SPEED * (b.level - 1) * 100);
          const nextPct = Math.round(BAY_LEVEL_SPEED * b.level * 100);
          return (
            <Card key={b.id} className="flex items-center gap-3 p-3">
              <div
                className={`font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[20px] ${b.isOwner ? 'bg-money/15 text-money' : 'bg-water/10 text-water'}`}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
                  <span className="truncate">
                    {b.isOwner ? S.workshop.yourBay : S.workshop.bay(i + 1)}
                  </span>
                  <Badge tone="water">{S.workshop.bayLevel(b.level)}</Badge>
                </div>
                <div className="truncate text-[14px] text-dim">
                  {b.isOwner ? S.workshop.owner : worker ? worker.name : S.workshop.emptyBay}
                </div>
                <div className="truncate text-[14px] text-dim">
                  {S.workshop.baySpeed(pct)}
                  {b.level < BAY_MAX_LEVEL && <span className="text-gain"> → +{nextPct}%</span>}
                </div>
              </div>
              {b.level < BAY_MAX_LEVEL ? (
                <BuyButton
                  small
                  cost={bayLevelCost(b.level)}
                  money={s.money}
                  label=""
                  onBuy={() => engine.dispatch(upgradeBay, { bayId: b.id })}
                  className="w-[132px] shrink-0"
                />
              ) : (
                <Badge tone="gain">{S.buttons.max}</Badge>
              )}
            </Card>
          );
        })}
        {s.bays.length < max ? (
          <Card className="flex items-center gap-3 p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-line text-water">
              <Plus size={22} />
            </div>
            <div className="min-w-0 flex-1 text-[15px] font-bold text-ink">{S.workshop.buyBay}</div>
            <BuyButton
              small
              cost={bayCost(s)}
              money={s.money}
              label=""
              onBuy={() => engine.run(buyBay)}
              className="w-[132px] shrink-0"
            />
          </Card>
        ) : (
          <p className="px-1 text-[14px] text-dim">{S.workshop.maxBays}</p>
        )}
      </div>

      <SectionTitle right={<Badge tone="dim">{s.queue.length}</Badge>}>
        {S.workshop.queue}
      </SectionTitle>
      {s.queue.length === 0 ? (
        <p className="px-1 text-[14px] text-dim">{S.workshop.queueEmpty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {s.queue.map((c) => (
            <CustomerRow key={c.id} c={c} s={s} />
          ))}
        </div>
      )}

      <SectionTitle>{S.workshop.contracts}</SectionTitle>
      {!contractsAvailable(s) ? (
        <Card className="flex items-center gap-3 p-3 text-[14px] text-dim">
          <FileText size={20} className="shrink-0" />
          {S.workshop.contractsLocked(locationName(CONTRACTS.minLocation))}
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {s.contracts.map((k) => (
            <Card key={k.id} glow className="p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[15px] font-bold text-ink">{k.client}</span>
                <Badge tone={k.deadlineDay - s.day <= 0 ? 'warn' : 'water'}>
                  <Clock3 size={13} /> {S.contracts.dueIn(k.deadlineDay - s.day)}
                </Badge>
              </div>
              <div className="mt-1 text-[14px] text-dim">
                {S.contracts.vehicles(k.count, S.vehicles[k.vehicle])} ·{' '}
                <span className="text-money">{formatMoney(k.payment)}</span>
              </div>
              <ProgressBar value={k.done / k.count} className="mt-2" color="bg-gain" />
              <div className="mt-1 text-[14px] text-dim">
                {S.contracts.progress(k.done, k.count)}
              </div>
            </Card>
          ))}
          {s.contractOffers.length === 0 && s.contracts.length === 0 && (
            <p className="px-1 text-[14px] text-dim">
              {S.workshop.noOffers(CONTRACTS.offerEveryDays)}
            </p>
          )}
          {s.contractOffers.map((o) => {
            const feasible =
              o.services.every((id) => isServiceUnlocked(s, id)) &&
              (isVehicleUnlocked(s, o.vehicle) ||
                s.location >= VEHICLE_BY_ID[o.vehicle].minLocation);
            return (
              <Card key={o.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[15px] font-bold text-ink">{o.client}</span>
                  {o.expiresDay <= s.day && <Badge tone="warn">{S.contracts.expires}</Badge>}
                </div>
                <div className="mt-1 text-[14px] text-dim">
                  {S.contracts.vehicles(o.count, S.vehicles[o.vehicle])} ·{' '}
                  {S.contracts.deadline(o.days)}
                </div>
                <div className="mt-1.5">
                  <ServiceChips services={o.services} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[14px] text-dim">{S.contracts.pay}</div>
                    <div className="font-display tabular text-[18px] text-money">
                      {formatMoney(o.payment)}
                    </div>
                    <div className="text-[14px] text-star">
                      {S.contracts.rep(o.repBonus.toFixed(1))}
                    </div>
                  </div>
                  {feasible ? (
                    <Button
                      onClick={() => {
                        play('buy');
                        engine.dispatch(acceptContract, { offerId: o.id });
                      }}
                    >
                      <CircleCheck size={18} /> {S.contracts.accept}
                    </Button>
                  ) : (
                    <span className="max-w-[50%] text-right text-[14px] text-warn">
                      {S.contracts.cantDo}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SectionTitle right={<MessageSquareQuote size={18} className="text-dim" />}>
        {S.workshop.reviews}
      </SectionTitle>
      {s.reviews.length === 0 ? (
        <p className="px-1 text-[14px] text-dim">{S.workshop.noReviews}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {s.reviews.map((r) => (
            <Card key={r.id} className="p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[14px] font-bold text-ink">
                  {r.name} · <span className="font-medium text-dim">{r.model}</span>
                </span>
                <Stars value={r.stars} size={14} />
              </div>
              <p className="mt-1 text-[14px] text-ink/90">“{r.text}”</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerRow({ c, s }: { c: Customer; s: GameState }) {
  const f = c.contractId !== null ? 1 : Math.max(0, 1 - c.waited / c.patience);
  const doable = canAnyoneDo(s, c);
  return (
    <Card className="flex items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
          <span className="truncate">{c.name}</span>
          {c.vip && (
            <Badge tone="money">
              <Star size={12} /> {S.workshop.vipTag}
            </Badge>
          )}
          {c.contractId !== null && <Badge tone="water">{S.workshop.contractTag}</Badge>}
        </div>
        <div className="truncate text-[14px] text-dim">
          {c.model} · {S.vehicles[c.vehicle]} · {S.dirt[c.dirt]}
        </div>
        <div className="mt-1.5">
          <ServiceChips services={c.services} />
        </div>
        {c.contractId === null && (
          <ProgressBar
            value={f}
            className="mt-2 h-1.5"
            color={f > 0.5 ? 'bg-gain' : f > 0.25 ? 'bg-money' : 'bg-loss'}
          />
        )}
        {!doable && <p className="mt-1 text-[14px] text-warn">{S.workshop.cantServe}</p>}
      </div>
      {c.contractId === null && (
        <Button
          small
          variant="secondary"
          ariaLabel={S.workshop.reject}
          onClick={() => engine.dispatch(rejectCustomer, { customerId: c.id })}
          className="shrink-0"
        >
          <X size={16} /> {S.workshop.reject}
        </Button>
      )}
    </Card>
  );
}
