import { useState } from 'react';
import { BriefcaseBusiness, RefreshCw, UserMinus, UserRoundCheck } from 'lucide-react';
import { engine, useG } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { S, locationName } from '../../game/data/strings';
import { formatMoney, formatPercent } from '../../game/format';
import { STAFF, SUPPORT_ROLES } from '../../game/data/staff';
import { LEVEL_COLORS, SKIN_TONES } from '../../game/palette';
import { courseCost, xpToNext } from '../../game/sim/staff';
import {
  assignWorker,
  fireWorker,
  hireSupport,
  hireWorker,
  refreshBoard,
  refreshCost,
} from '../../game/actions/hire';
import { trainWorker } from '../../game/actions/train';
import { workerLevelQuality, workerLevelSpeed } from '../../game/sim/economy';
import type { Worker } from '../../game/types';
import { BuyButton, Button } from '../components/Button';
import { Card, SectionTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressRing';
import { Modal } from '../components/Sheet';
import { play } from '../../audio/sfx';

export function Avatar({ w, size = 44 }: { w: Pick<Worker, 'level' | 'look'>; size?: number }) {
  const cap = LEVEL_COLORS[w.level - 1] ?? '#94A3B8';
  const skin = SKIN_TONES[w.look % SKIN_TONES.length] ?? '#E0AC69';
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden className="shrink-0">
      <circle cx="22" cy="22" r="21" fill="#1C2538" stroke={cap} strokeWidth="2" />
      <ellipse cx="22" cy="38" rx="14" ry="8" fill="#334155" />
      <circle cx="22" cy="22" r="10" fill={skin} />
      <path d="M11 20 Q22 6 33 20 Z" fill={cap} />
      <rect x="9" y="18" width="26" height="4" rx="2" fill={cap} />
      <circle cx="18" cy="24" r="1.4" fill="#0B0F17" />
      <circle cx="26" cy="24" r="1.4" fill="#0B0F17" />
      <path
        d="M18 28 Q22 31 26 28"
        stroke="#0B0F17"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Stat({
  label,
  value,
  tone = 'text-ink',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg bg-bg-0/60 px-2 py-1 text-center">
      <div className="text-[14px] leading-tight text-dim">{label}</div>
      <div className={`tabular text-[15px] leading-tight font-bold ${tone}`}>{value}</div>
    </div>
  );
}

export function StaffTab() {
  const s = useG((x) => x);
  const [firing, setFiring] = useState<Worker | null>(null);
  const toast = useUi((u) => u.toast);
  const bayNumber = (id: number): number => s.bays.findIndex((b) => b.id === id) + 1;
  const workerBays = s.bays.filter((b) => !b.isOwner);
  return (
    <div>
      <SectionTitle right={<Badge tone="dim">{s.workers.length}</Badge>}>
        {S.staff.employees}
      </SectionTitle>
      {s.workers.length === 0 && <p className="px-1 text-[14px] text-dim">{S.staff.noEmployees}</p>}
      <div className="flex flex-col gap-2">
        {s.workers.map((w) => {
          const bay = s.bays.find((b) => b.workerId === w.id);
          const maxed = w.level >= STAFF.maxLevel;
          return (
            <Card key={w.id} className="p-3">
              <div className="flex items-center gap-3">
                <Avatar w={w} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[16px] font-bold text-ink">{w.name}</span>
                    <Badge tone="water">{S.staff.level(w.level)}</Badge>
                  </div>
                  <div className="truncate text-[14px] text-dim">
                    <span className="text-soap">{S.traits[w.trait].name}</span> ·{' '}
                    {S.traits[w.trait].desc}
                  </div>
                </div>
                <Badge tone={bay ? 'gain' : 'warn'}>
                  {bay ? S.staff.bayLabel(bayNumber(bay.id)) : S.staff.bench}
                </Badge>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <Stat
                  label={S.staff.speed}
                  value={`${(w.speed * workerLevelSpeed(w.level)).toFixed(2)}×`}
                />
                <Stat
                  label={S.staff.quality}
                  value={`${(w.quality * workerLevelQuality(w.level)).toFixed(2)}×`}
                />
                <Stat
                  label={S.staff.commission}
                  value={formatPercent(w.commission)}
                  tone="text-warn"
                />
              </div>
              {!maxed && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[14px] text-dim">{S.staff.xp}</span>
                  <ProgressBar
                    value={w.xp / xpToNext(w.level)}
                    className="flex-1"
                    color="bg-soap"
                  />
                  <span className="tabular text-[14px] text-dim">
                    {S.staff.carsDone(w.carsDone)}
                  </span>
                </div>
              )}
              {workerBays.length > 1 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[14px] text-dim">{S.staff.assign}:</span>
                  {workerBays.map((b) => {
                    const here = b.workerId === w.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        disabled={here}
                        onClick={() => {
                          play('tap');
                          engine.dispatch(assignWorker, { workerId: w.id, bayId: b.id });
                        }}
                        className={`font-display h-11 min-w-11 rounded-xl border px-2 text-[15px] ${here ? 'border-water bg-water/15 text-water' : 'border-line bg-surface-1 text-ink'}`}
                      >
                        {bayNumber(b.id)}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="mt-2 flex gap-2">
                {maxed ? (
                  <div className="flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-surface-1 text-[14px] font-bold text-gain">
                    {S.staff.trainFull}
                  </div>
                ) : (
                  <BuyButton
                    small
                    className="flex-1"
                    cost={courseCost(w.level)}
                    money={s.money}
                    label={`${S.staff.train} → ${w.level + 1}`}
                    onBuy={() => engine.dispatch(trainWorker, { workerId: w.id })}
                  />
                )}
                <Button
                  small
                  variant="secondary"
                  ariaLabel={S.staff.fire}
                  onClick={() => setFiring(w)}
                >
                  <UserMinus size={17} />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <SectionTitle
        right={
          <BuyButton
            small
            cost={refreshCost(s)}
            money={s.money}
            label=""
            onBuy={() => engine.run(refreshBoard)}
            className="min-w-[120px]"
          />
        }
      >
        {S.staff.jobBoard}
      </SectionTitle>
      <p className="-mt-1 mb-2 flex items-center gap-1 px-1 text-[14px] text-dim">
        <RefreshCw size={14} /> {S.staff.refreshFree}
      </p>
      <div className="flex flex-col gap-2">
        {s.candidates.map((c) => (
          <Card key={c.id} className="p-3">
            <div className="flex items-center gap-3">
              <Avatar w={c} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[16px] font-bold text-ink">{c.name}</span>
                  <Badge tone="water">{S.staff.level(c.level)}</Badge>
                </div>
                <div className="truncate text-[14px] text-dim">
                  <span className="text-soap">{S.traits[c.trait].name}</span> ·{' '}
                  {S.traits[c.trait].desc}
                </div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <Stat
                label={S.staff.speed}
                value={`${(c.speed * workerLevelSpeed(c.level)).toFixed(2)}×`}
              />
              <Stat
                label={S.staff.quality}
                value={`${(c.quality * workerLevelQuality(c.level)).toFixed(2)}×`}
              />
              <Stat
                label={S.staff.commission}
                value={formatPercent(c.commission)}
                tone="text-warn"
              />
            </div>
            <BuyButton
              className="mt-2 w-full"
              cost={c.hireCost}
              money={s.money}
              label={S.staff.hire}
              onBuy={() => {
                if (engine.dispatch(hireWorker, { candidateId: c.id }))
                  toast(S.toasts.hired(c.name), 'good');
              }}
            />
          </Card>
        ))}
      </div>

      <SectionTitle>{S.staff.supportRoles}</SectionTitle>
      <div className="flex flex-col gap-2">
        {SUPPORT_ROLES.map((r) => {
          const hired = s.support[r.id];
          const locked = s.location < r.minLocation;
          return (
            <Card key={r.id} glow={hired} className="p-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${hired ? 'bg-gain/15 text-gain' : 'bg-surface-1 text-dim'}`}
                >
                  {r.id === 'manager' ? (
                    <BriefcaseBusiness size={22} />
                  ) : (
                    <UserRoundCheck size={22} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[16px] font-bold text-ink">
                    {S.support[r.id].name}
                    {hired && <Badge tone="gain">{S.staff.hired}</Badge>}
                  </div>
                  <div className="text-[14px] text-dim">{S.support[r.id].desc}</div>
                  <div className="text-[14px] text-warn">
                    {S.staff.wage(formatMoney(r.dailyWage))}
                  </div>
                </div>
              </div>
              {!hired && (
                <BuyButton
                  className="mt-2 w-full"
                  cost={r.hireCost}
                  money={s.money}
                  label={S.staff.hire}
                  blocked={locked ? S.staff.supportLocked(locationName(r.minLocation)) : null}
                  onBuy={() => engine.dispatch(hireSupport, { id: r.id })}
                />
              )}
            </Card>
          );
        })}
      </div>

      {firing && (
        <Modal label={S.staff.fire} onClose={() => setFiring(null)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar w={firing} size={64} />
            <p className="text-[16px] font-bold text-ink">{S.staff.fireConfirm(firing.name)}</p>
            <div className="flex w-full gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setFiring(null)}>
                {S.staff.cancel}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  engine.dispatch(fireWorker, { workerId: firing.id });
                  setFiring(null);
                }}
              >
                {S.staff.fireYes}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
