import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { engine, useG } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { S, equipmentName, locationName, serviceName } from '../../game/data/strings';
import { EQUIPMENT, EQUIPMENT_MAX_LEVEL, EQUIPMENT_BY_ID } from '../../game/data/equipment';
import { UPGRADES } from '../../game/data/upgrades';
import { SERVICES } from '../../game/data/services';
import {
  buyEquipment,
  buyUpgrade,
  equipmentBlock,
  equipmentCost,
  upgradeCost,
  upgradeMaxed,
} from '../../game/actions/purchase';
import type { EquipmentId, UpgradeId } from '../../game/types';
import { BuyButton } from '../components/Button';
import { Card, SectionTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { EQUIPMENT_ICONS, UPGRADE_ICONS } from '../icons';
import { canBuy } from '../../store/selectors';

function unlocksOf(id: EquipmentId): string {
  return SERVICES.filter((s) => s.requires.includes(id))
    .map((s) => serviceName(s.id))
    .join(', ');
}

export function UpgradesTab() {
  const s = useG((x) => x);
  const toast = useUi((u) => u.toast);
  const equipment = useMemo(() => {
    const list = EQUIPMENT.filter((e) => !(e.initial && s.equipment[e.id] >= EQUIPMENT_MAX_LEVEL));
    const rank = (id: EquipmentId): number => {
      const blocked = equipmentBlock(s, id);
      if (blocked === 'max') return 3;
      if (blocked) return 2;
      return canBuy(s, equipmentCost(s, id)) ? 0 : 1;
    };
    return [...list].sort(
      (a, b) => rank(a.id) - rank(b.id) || equipmentCost(s, a.id) - equipmentCost(s, b.id),
    );
  }, [s]);
  const upgrades = useMemo(() => {
    const rank = (id: UpgradeId): number =>
      upgradeMaxed(s, id) ? 2 : canBuy(s, upgradeCost(s, id)) ? 0 : 1;
    return [...UPGRADES].sort(
      (a, b) => rank(a.id) - rank(b.id) || upgradeCost(s, a.id) - upgradeCost(s, b.id),
    );
  }, [s]);

  return (
    <div>
      <SectionTitle>{S.upgradesTab.equipment}</SectionTitle>
      <div className="flex flex-col gap-2">
        {equipment.map((e) => {
          const lvl = s.equipment[e.id];
          const Icon = EQUIPMENT_ICONS[e.id];
          const block = equipmentBlock(s, e.id);
          const owned = lvl > 0;
          const unlocks = unlocksOf(e.id);
          const blockedText =
            block === 'location'
              ? S.upgradesTab.needsLocation(locationName(e.minLocation))
              : block === 'requires'
                ? S.upgradesTab.requires(
                    (EQUIPMENT_BY_ID[e.id].requires ?? []).map(equipmentName).join(', '),
                  )
                : null;
          return (
            <Card key={e.id} glow={!block && canBuy(s, equipmentCost(s, e.id))} className="p-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${owned ? 'bg-water/15 text-water' : 'bg-surface-1 text-dim'}`}
                >
                  <Icon size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-bold text-ink">
                      {S.equipment[e.id].name}
                    </span>
                    {owned && (
                      <Badge tone="water">{S.upgradesTab.levelOf(lvl, EQUIPMENT_MAX_LEVEL)}</Badge>
                    )}
                  </div>
                  <div className="text-[14px] text-dim">
                    {owned ? S.upgradesTab.perLevel : S.equipment[e.id].desc}
                  </div>
                  {!owned && unlocks && !S.equipment[e.id].desc.includes(unlocks) && (
                    <div className="text-[14px] text-water">{S.upgradesTab.unlocks(unlocks)}</div>
                  )}
                  {owned && lvl < EQUIPMENT_MAX_LEVEL && (
                    <div className="mt-0.5 flex items-center gap-1 text-[14px]">
                      <span className="text-dim">
                        {S.upgradesTab.levelOf(lvl, EQUIPMENT_MAX_LEVEL)}
                      </span>
                      <ArrowRight size={14} className="text-gain" />
                      <span className="font-bold text-gain">
                        {S.upgradesTab.levelOf(lvl + 1, EQUIPMENT_MAX_LEVEL)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {block === 'max' ? (
                <div className="mt-2 flex min-h-11 items-center justify-center rounded-2xl bg-surface-1 text-[14px] font-bold text-gain">
                  {S.upgradesTab.max}
                </div>
              ) : (
                <BuyButton
                  className="mt-2 w-full"
                  cost={equipmentCost(s, e.id)}
                  money={s.money}
                  blocked={blockedText}
                  label={owned ? S.upgradesTab.improve : S.upgradesTab.buy}
                  onBuy={() => {
                    if (engine.dispatch(buyEquipment, { id: e.id }) && !owned)
                      toast(S.toasts.bought(S.equipment[e.id].name), 'good');
                  }}
                />
              )}
            </Card>
          );
        })}
      </div>

      <SectionTitle>{S.upgradesTab.business}</SectionTitle>
      <div className="flex flex-col gap-2">
        {upgrades.map((u) => {
          const lvl = s.upgrades[u.id];
          const Icon = UPGRADE_ICONS[u.id];
          const maxed = upgradeMaxed(s, u.id);
          const text = S.upgrades[u.id];
          return (
            <Card key={u.id} glow={!maxed && canBuy(s, upgradeCost(s, u.id))} className="p-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${lvl > 0 ? 'bg-soap/15 text-soap' : 'bg-surface-1 text-dim'}`}
                >
                  <Icon size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-bold text-ink">{text.name}</span>
                    {u.maxLevel > 1 && (
                      <Badge tone={lvl > 0 ? 'soap' : 'dim'}>
                        {S.upgradesTab.levelOf(lvl, u.maxLevel)}
                      </Badge>
                    )}
                    {u.maxLevel === 1 && lvl > 0 && (
                      <Badge tone="gain">{S.upgradesTab.owned}</Badge>
                    )}
                  </div>
                  {u.maxLevel > 1 ? (
                    <div className="flex flex-wrap items-center gap-1 text-[14px]">
                      <span className="text-dim">
                        {lvl > 0 ? text.unit(lvl) : S.upgradesTab.current + ': —'}
                      </span>
                      {!maxed && (
                        <>
                          <ArrowRight size={14} className="text-gain" />
                          <span className="font-bold text-gain">{text.unit(lvl + 1)}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-[14px] text-dim">{text.unit(1)}</div>
                  )}
                </div>
              </div>
              {!maxed && (
                <BuyButton
                  className="mt-2 w-full"
                  cost={upgradeCost(s, u.id)}
                  money={s.money}
                  label={lvl > 0 ? S.upgradesTab.improve : S.upgradesTab.buy}
                  onBuy={() => engine.dispatch(buyUpgrade, { id: u.id })}
                />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
