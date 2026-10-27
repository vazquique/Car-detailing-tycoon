import { useEffect, useState } from 'react';
import { CalendarDays, Coins, Moon, Star, Sunrise, X } from 'lucide-react';
import { engine, useG } from '../../store/gameStore';
import { S } from '../../game/data/strings';
import { formatDuration, formatMoney } from '../../game/format';
import { calendarOf } from '../../game/sim/calendar';
import { jobTimeLeft } from '../../game/sim/bays';
import { canWorkerDo } from '../../game/sim/economy';
import { rejectCustomer } from '../../game/actions/workshop';
import type { DaySummary } from '../../game/types';
import { ECONOMY } from '../../game/data/economy';
import type { OfflineResult } from '../../game/sim/offline';
import { Modal } from '../components/Sheet';
import { Button } from '../components/Button';
import { Stars } from '../components/Stars';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressRing';
import { WeatherIcon } from '../hud/WeatherIcon';
import { ServiceChips } from '../tabs/WorkshopTab';
import { Avatar } from '../tabs/StaffTab';
import { burstCoinsFromCenter } from '../fx';
import { play } from '../../audio/sfx';

export function ForecastModal({ onClose }: { onClose: () => void }) {
  const weather = useG((s) => s.weather);
  const forecast = useG((s) => s.forecast.weather);
  const day = useG((s) => s.day);
  const cal = calendarOf(day);
  return (
    <Modal label={S.hud.forecastTitle} onClose={onClose}>
      <div className="flex items-center gap-2">
        <CalendarDays size={20} className="text-water" />
        <h2 className="font-display text-[20px] text-ink">{S.hud.forecastTitle}</h2>
      </div>
      <p className="mt-1 text-[14px] text-dim">
        {S.months[cal.month - 1]} · {cal.dayOfMonth}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-line bg-surface-0 p-3 text-center">
          <div className="text-[14px] text-dim">{S.hud.today}</div>
          <div className="my-1 flex justify-center">
            <WeatherIcon id={weather} size={34} />
          </div>
          <div className="text-[15px] font-bold text-ink">{S.weather[weather]}</div>
        </div>
        <div className="rounded-2xl border border-water/40 bg-water/10 p-3 text-center">
          <div className="text-[14px] text-dim">{S.hud.forecastTitle}</div>
          <div className="my-1 flex justify-center">
            <WeatherIcon id={forecast} size={34} />
          </div>
          <div className="text-[15px] font-bold text-ink">{S.weather[forecast]}</div>
        </div>
      </div>
      <p className="mt-3 text-center text-[14px] text-dim">{S.hud.forecastNote}</p>
      <Button className="mt-3 w-full" onClick={onClose}>
        {S.buttons.ok}
      </Button>
    </Modal>
  );
}

const SUMMARY_SECONDS = 6;

export function DaySummaryModal({
  summary,
  onClose,
}: {
  summary: DaySummary;
  onClose: () => void;
}) {
  const [left, setLeft] = useState(SUMMARY_SECONDS);
  useEffect(() => {
    const t = window.setInterval(() => setLeft((v) => v - 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (left <= 0) onClose();
  }, [left, onClose]);
  const rows: [string, number, string][] = [
    [S.daySummary.revenue, summary.revenue, 'text-ink'],
    [S.daySummary.tips, summary.tips, 'text-gain'],
    [S.daySummary.commissions, -summary.commissions, 'text-loss'],
    [S.daySummary.supplies, -summary.supplies, 'text-loss'],
    [S.daySummary.rent, -summary.rent, 'text-loss'],
    [S.daySummary.wages, -summary.wages, 'text-loss'],
    [S.daySummary.marketing, -summary.marketing, 'text-loss'],
    [S.daySummary.fines, -summary.fines, 'text-loss'],
    [S.daySummary.other, -summary.other, 'text-loss'],
  ];
  const rating = summary.starsCount > 0 ? summary.starsSum / summary.starsCount : summary.repEnd;
  return (
    <Modal label={S.daySummary.title(summary.day)} onClose={onClose}>
      <div className="flex items-center gap-2">
        <Moon size={22} className="text-water" />
        <h2 className="font-display text-[21px] text-ink">{S.daySummary.title(summary.day)}</h2>
      </div>
      <div className="mt-3 rounded-2xl border border-line bg-surface-0 p-3">
        {rows
          .filter(([, v], i) => i < 2 || Math.abs(v) >= 0.5)
          .map(([label, v, tone]) => (
            <div key={label} className="flex items-center justify-between py-0.5 text-[15px]">
              <span className="text-dim">{label}</span>
              <span className={`tabular font-bold ${tone}`}>{formatMoney(v)}</span>
            </div>
          ))}
        <div className="mt-1 flex items-center justify-between border-t border-line pt-2 text-[17px]">
          <span className="font-bold text-ink">{S.daySummary.profit}</span>
          <span
            className={`font-display tabular ${summary.profit >= 0 ? 'text-money' : 'text-loss'}`}
          >
            {formatMoney(summary.profit)}
          </span>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-surface-0 p-2">
          <div className="font-display tabular text-[20px] text-ink">{summary.carsServed}</div>
          <div className="text-[14px] leading-tight text-dim">{S.daySummary.cars}</div>
        </div>
        <div className="rounded-xl bg-surface-0 p-2">
          <div
            className={`font-display tabular text-[20px] ${summary.lost > 0 ? 'text-loss' : 'text-gain'}`}
          >
            {summary.lost}
          </div>
          <div className="text-[14px] leading-tight text-dim">{S.daySummary.lost}</div>
        </div>
        <div className="rounded-xl bg-surface-0 p-2">
          <div className="font-display tabular text-[20px] text-star">{rating.toFixed(1)}</div>
          <div className="text-[14px] leading-tight text-dim">{S.daySummary.rating}</div>
        </div>
      </div>
      {summary.bestReview && (
        <div className="mt-2 rounded-2xl border border-star/30 bg-star/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-dim">{S.daySummary.bestReview}</span>
            <Stars value={summary.bestReview.stars} />
          </div>
          <p className="mt-1 text-[15px] text-ink">“{summary.bestReview.text}”</p>
          <p className="text-[14px] text-dim">
            — {summary.bestReview.name} · {summary.bestReview.model}
          </p>
        </div>
      )}
      <Button className="mt-3 w-full" onClick={onClose}>
        <Sunrise size={18} /> {S.daySummary.close}
      </Button>
      <p className="tabular mt-2 text-center text-[14px] text-dim">
        {S.daySummary.autoClose(Math.max(0, left))}
      </p>
    </Modal>
  );
}

export function OfflineModal({ result, onClose }: { result: OfflineResult; onClose: () => void }) {
  return (
    <Modal label={S.offline.title}>
      <div className="flex flex-col items-center text-center">
        <div className="animate-glow flex h-20 w-20 items-center justify-center rounded-full bg-money/15 text-money">
          <Coins size={44} />
        </div>
        <h2 className="font-display mt-3 text-[22px] text-ink">{S.offline.title}</h2>
        <p className="mt-1 text-[15px] text-dim">{S.offline.away(formatDuration(result.away))}</p>
        <p className="mt-3 text-[15px] text-ink">{S.offline.earned}</p>
        <div className="font-display tabular text-[34px] text-money">
          {formatMoney(result.money)}
        </div>
        <p className="mt-1 text-[14px] text-dim">
          {S.offline.efficiency(Math.round(result.efficiency * 100))}
        </p>
        <Button
          variant="gold"
          className="mt-4 w-full"
          sound={false}
          onClick={() => {
            play('cash');
            engine.collectOffline(result);
            burstCoinsFromCenter(24);
            onClose();
          }}
        >
          <Coins size={20} /> {S.offline.collect}
        </Button>
      </div>
    </Modal>
  );
}

export function CustomerModal({
  customerId,
  onClose,
}: {
  customerId: number;
  onClose: () => void;
}) {
  const c = useG((s) => s.queue.find((x) => x.id === customerId));
  const doable = useG((s) => {
    const x = s.queue.find((q) => q.id === customerId);
    return x ? canWorkerDo(s, null, x) || s.workers.some((w) => canWorkerDo(s, w, x)) : true;
  });
  useEffect(() => {
    if (!c) onClose();
  }, [c, onClose]);
  if (!c) return null;
  const f = c.contractId !== null ? 1 : Math.max(0, 1 - c.waited / c.patience);
  return (
    <Modal label={S.workshop.customerTicket} onClose={onClose}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[14px] font-bold text-dim uppercase">
            {S.workshop.customerTicket}
          </div>
          <h2 className="font-display text-[22px] text-ink">{c.name}</h2>
          <p className="text-[15px] text-dim">
            {c.model} · {S.vehicles[c.vehicle]} · {S.dirt[c.dirt]}
          </p>
        </div>
        <button
          type="button"
          aria-label={S.buttons.close}
          onClick={onClose}
          className="-mt-1 -mr-2 flex h-11 w-11 items-center justify-center text-dim"
        >
          <X size={22} />
        </button>
      </div>
      <div className="mt-2 flex gap-1.5">
        {c.vip && (
          <Badge tone="money">
            <Star size={12} /> {S.workshop.vipTag}
          </Badge>
        )}
        {c.contractId !== null && <Badge tone="water">{S.workshop.contractTag}</Badge>}
      </div>
      <div className="mt-3">
        <ServiceChips services={c.services} />
      </div>
      {c.contractId === null && (
        <div className="mt-3">
          <div className="mb-1 text-[14px] text-dim">{S.workshop.patience}</div>
          <ProgressBar value={f} color={f > 0.5 ? 'bg-gain' : f > 0.25 ? 'bg-money' : 'bg-loss'} />
        </div>
      )}
      {!doable && <p className="mt-2 text-[14px] text-warn">{S.workshop.cantServe}</p>}
      {c.contractId === null && (
        <>
          <Button
            variant="danger"
            className="mt-4 w-full"
            onClick={() => {
              engine.dispatch(rejectCustomer, { customerId: c.id });
              onClose();
            }}
          >
            <X size={18} /> {S.workshop.reject}
          </Button>
          <p className="mt-1 text-center text-[14px] text-dim">
            {S.workshop.rejectNote(ECONOMY.rejectPenalty.toFixed(2))}
          </p>
        </>
      )}
    </Modal>
  );
}

export function BayDetailModal({ bayId, onClose }: { bayId: number; onClose: () => void }) {
  const bay = useG((s) => s.bays.find((b) => b.id === bayId));
  const index = useG((s) => s.bays.findIndex((b) => b.id === bayId));
  const worker = useG((s) => {
    const b = s.bays.find((x) => x.id === bayId);
    return b?.workerId != null ? s.workers.find((w) => w.id === b.workerId) : undefined;
  });
  const left = useG((s) => {
    const b = s.bays.find((x) => x.id === bayId);
    return b ? jobTimeLeft(s, b) : 0;
  });
  if (!bay) return null;
  const job = bay.job;
  return (
    <Modal label={S.workshop.detailTitle} onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[21px] text-ink">
          {bay.isOwner ? S.workshop.yourBay : S.workshop.bay(index + 1)}
        </h2>
        <Badge tone="water">{S.workshop.bayLevel(bay.level)}</Badge>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface-0 p-3">
        {worker ? <Avatar w={worker} /> : null}
        <div>
          <div className="text-[14px] text-dim">{S.workshop.worker}</div>
          <div className="text-[16px] font-bold text-ink">
            {bay.isOwner ? S.workshop.owner : (worker?.name ?? S.workshop.emptyBay)}
          </div>
          {worker && (
            <div className="text-[14px] text-soap">
              {S.staff.level(worker.level)} · {S.traits[worker.trait].name}
            </div>
          )}
        </div>
      </div>
      {job ? (
        <div className="mt-2 rounded-2xl border border-line bg-surface-0 p-3">
          <div className="text-[16px] font-bold text-ink">
            {job.customer.name} · <span className="text-dim">{job.customer.model}</span>
          </div>
          <div className="text-[14px] text-dim">
            {S.vehicles[job.customer.vehicle]} · {S.dirt[job.customer.dirt]}
          </div>
          <div className="mt-2">
            <ServiceChips services={job.customer.services.slice(job.serviceIndex)} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[15px]">
            <span className="text-dim">{S.workshop.timeLeft}</span>
            <span className="tabular font-bold text-ink">{formatDuration(left)}</span>
          </div>
          <ProgressBar
            value={job.duration > 0 ? job.progress / job.duration : 0}
            className="mt-1"
          />
        </div>
      ) : (
        <p className="mt-3 text-[15px] text-dim">{S.workshop.noJob}</p>
      )}
      <Button className="mt-3 w-full" onClick={onClose}>
        {S.buttons.ok}
      </Button>
    </Modal>
  );
}
