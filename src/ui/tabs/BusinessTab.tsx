import { Check, Lock, MapPinned, Truck } from 'lucide-react';
import { engine, useG } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { S } from '../../game/data/strings';
import { LOCATIONS } from '../../game/data/locations';
import { ACHIEVEMENTS } from '../../game/data/achievements';
import { PRESTIGE, PRESTIGE_NODES } from '../../game/data/prestige';
import { ECONOMY } from '../../game/data/economy';
import { formatDuration, formatMoney, formatNumber } from '../../game/format';
import { relocate, moveCost } from '../../game/actions/relocate';
import { buyNode, canFranchise, nodeCost, pfForRun } from '../../game/actions/prestige';
import { BuyButton, Button } from '../components/Button';
import { Card, SectionTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { ACHIEVEMENT_ICONS, LOCATION_ICONS } from '../icons';
import type { LifetimeStats } from '../../game/types';
import { play } from '../../audio/sfx';

const STAT_KEYS: (keyof LifetimeStats)[] = [
  'carsServed',
  'totalEarned',
  'tips',
  'customersLost',
  'contractsDone',
  'workersHired',
  'handWashes',
  'daysPlayed',
  'playSeconds',
  'bestDayProfit',
  'franchises',
];

function statValue(k: keyof LifetimeStats, v: number): string {
  if (k === 'totalEarned' || k === 'tips' || k === 'bestDayProfit') return formatMoney(v);
  if (k === 'playSeconds') return formatDuration(v);
  return formatNumber(v);
}

export function BusinessTab() {
  const s = useG((x) => x);
  const setMoving = useUi((u) => u.setMoving);
  const setTab = useUi((u) => u.setTab);
  const openModal = useUi((u) => u.openModal);
  const pf = pfForRun(s);
  return (
    <div>
      <SectionTitle>{S.business.locations}</SectionTitle>
      <div className="flex flex-col gap-2">
        {LOCATIONS.map((loc, i) => {
          const Icon = LOCATION_ICONS[i] ?? MapPinned;
          const here = s.location === i;
          const past = s.location > i;
          const next = i === s.location + 1;
          const text = S.locations[i];
          return (
            <Card key={i} glow={here} className={`p-3 ${past ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${here ? 'bg-water/15 text-water' : 'bg-surface-1 text-dim'}`}
                >
                  <Icon size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-bold text-ink">{text?.name}</span>
                    {here && <Badge tone="water">{S.business.current}</Badge>}
                    {past && <Check size={16} className="text-gain" />}
                  </div>
                  <div className="text-[14px] text-dim">{text?.desc}</div>
                  <div className="tabular mt-0.5 text-[14px] text-ink/85">
                    {S.business.baysQueue(loc.maxBays, loc.queueSlots)} ·{' '}
                    {S.business.arrival(String(loc.arrivalSeconds))}
                  </div>
                  {loc.rent > 0 && (
                    <div className="tabular text-[14px] text-warn">
                      {S.business.rent(formatMoney(loc.rent))}
                    </div>
                  )}
                </div>
              </div>
              {next && (
                <BuyButton
                  className="mt-2 w-full"
                  cost={moveCost(i)}
                  money={s.money}
                  label={S.business.move}
                  onBuy={() => {
                    if (engine.dispatch(relocate, { location: i })) {
                      setTab(null);
                      setMoving(i);
                    }
                  }}
                />
              )}
              {!here && !past && !next && (
                <div className="mt-2 flex items-center gap-1.5 text-[14px] text-dim">
                  <Lock size={14} /> {S.business.moveCost}:{' '}
                  <span className="tabular font-bold text-ink">{formatMoney(moveCost(i))}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <SectionTitle
        right={
          <Badge tone="money">
            {S.business.achievementBonus(
              Math.round(s.achievements.length * ECONOMY.achievementIncome * 100),
            )}
          </Badge>
        }
      >
        {S.business.achievements}
      </SectionTitle>
      <p className="-mt-1 mb-2 px-1 text-[14px] text-dim">
        {S.business.achievementsCount(s.achievements.length, ACHIEVEMENTS.length)}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const got = s.achievements.includes(a.id);
          const Icon = ACHIEVEMENT_ICONS[a.icon];
          const t = S.achievements[a.id];
          return (
            <Card key={a.id} className={`flex items-start gap-2 p-2.5 ${got ? '' : 'opacity-55'}`}>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${got ? 'bg-money/15 text-money' : 'bg-surface-1 text-dim'}`}
              >
                {got ? <Icon size={19} /> : <Lock size={16} />}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] leading-tight font-bold text-ink">{t?.name}</div>
                <div className="text-[14px] leading-tight text-dim">{t?.desc}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <SectionTitle>{S.business.stats}</SectionTitle>
      <Card className="p-3">
        <div className="mb-1 grid grid-cols-[1fr_auto_auto] gap-x-3 text-[14px] font-bold text-dim">
          <span />
          <span className="text-right">{S.statsLabels.thisRun}</span>
          <span className="text-right">{S.statsLabels.allTime}</span>
        </div>
        {STAT_KEYS.map((k) => (
          <div
            key={k}
            className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-t border-line/60 py-1.5 text-[14px]"
          >
            <span className="text-dim">{S.statsLabels[k as keyof typeof S.statsLabels]}</span>
            <span className="tabular text-right text-ink">{statValue(k, s.runStats[k])}</span>
            <span className="tabular text-right font-bold text-ink">
              {statValue(k, s.stats[k])}
            </span>
          </div>
        ))}
      </Card>

      <SectionTitle
        right={
          <Badge tone="money">
            {S.business.pfBonus(Math.round(s.prestige.earnedTotal * ECONOMY.prestigeIncome * 100))}
          </Badge>
        }
      >
        {S.business.franchise}
      </SectionTitle>
      <Card glow={canFranchise(s)} className="p-3">
        {s.location < PRESTIGE.minLocation ? (
          <p className="flex items-center gap-2 text-[14px] text-dim">
            <Lock size={16} />{' '}
            {S.business.franchiseLocked(S.locations[PRESTIGE.minLocation]?.name ?? '')}
          </p>
        ) : (
          <>
            <div className="font-display text-[22px] text-soap">{S.business.pfNow(pf)}</div>
            {pf < 1 && <p className="text-[14px] text-dim">{S.franchise.needMore}</p>}
            <Button
              variant="gold"
              className="mt-2 w-full"
              disabled={!canFranchise(s)}
              onClick={() => {
                play('tap');
                openModal({ kind: 'franchise' });
              }}
            >
              <Truck size={18} /> {S.business.franchiseCta}
            </Button>
          </>
        )}
      </Card>

      {(s.prestige.earnedTotal > 0 || s.prestige.points > 0) && (
        <>
          <SectionTitle right={<Badge tone="soap">{S.business.pfHave(s.prestige.points)}</Badge>}>
            {S.business.tree}
          </SectionTitle>
          <div className="flex flex-col gap-2">
            {PRESTIGE_NODES.map((n) => {
              const lvl = s.prestige.nodes[n.id];
              const maxed = lvl >= n.maxLevel;
              const cost = nodeCost(n.id, lvl);
              const t = S.prestigeNodes[n.id];
              const seed = PRESTIGE.seedCapital[Math.max(lvl, maxed ? lvl : lvl + 1)] ?? 0;
              return (
                <Card key={n.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-bold text-ink">{t.name}</span>
                    <Badge tone={lvl > 0 ? 'soap' : 'dim'}>{`${lvl}/${n.maxLevel}`}</Badge>
                  </div>
                  <div className="text-[14px] text-dim">
                    {t.desc(Math.max(1, maxed ? lvl : lvl + 1), seed)}
                  </div>
                  {!maxed && (
                    <Button
                      small
                      className="mt-2 w-full"
                      variant={s.prestige.points >= cost ? 'primary' : 'secondary'}
                      disabled={s.prestige.points < cost}
                      onClick={() => {
                        play('buy');
                        engine.dispatch(buyNode, { id: n.id });
                      }}
                    >
                      {S.business.buyNode} · {S.business.nodeCost(cost)}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
