import { useState } from 'react';
import { Check, Crown, X } from 'lucide-react';
import { engine, useG } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { S } from '../../game/data/strings';
import { ECONOMY } from '../../game/data/economy';
import { franchise, pfForRun, canFranchise } from '../../game/actions/prestige';
import { Modal } from '../components/Sheet';
import { Button } from '../components/Button';

export function FranchiseModal({ onClose }: { onClose: () => void }) {
  const pf = useG(pfForRun);
  const can = useG(canFranchise);
  const [step, setStep] = useState(0);
  const celebrate = useUi((u) => u.celebrate);
  const setTab = useUi((u) => u.setTab);
  return (
    <Modal label={S.franchise.title} onClose={onClose} wide>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[21px] text-soap">{S.franchise.title}</h2>
        <button
          type="button"
          aria-label={S.buttons.close}
          onClick={onClose}
          className="-mr-2 flex h-11 w-11 items-center justify-center text-dim"
        >
          <X size={22} />
        </button>
      </div>
      <p className="text-[15px] text-ink/90">{S.franchise.intro}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-loss/30 bg-loss/5 p-3">
          <div className="mb-1 text-[14px] font-bold text-loss">{S.franchise.lose}</div>
          {S.franchise.loseItems.map((t) => (
            <div key={t} className="flex items-center gap-1.5 text-[14px] text-ink">
              <X size={14} className="text-loss" /> {t}
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-gain/30 bg-gain/5 p-3">
          <div className="mb-1 text-[14px] font-bold text-gain">{S.franchise.keep}</div>
          {S.franchise.keepItems.map((t) => (
            <div key={t} className="flex items-start gap-1.5 text-[14px] text-ink">
              <Check size={14} className="mt-0.5 shrink-0 text-gain" /> {t}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-soap/40 bg-soap/10 p-3 text-center">
        <div className="font-display text-[26px] text-soap">{S.franchise.receive(pf)}</div>
        <div className="text-[14px] text-ink">
          {S.franchise.bonus(Math.round(pf * ECONOMY.prestigeIncome * 100))}
        </div>
      </div>
      {!can ? (
        <p className="mt-3 text-center text-[14px] text-dim">{S.franchise.needMore}</p>
      ) : step === 0 ? (
        <Button variant="gold" className="mt-3 w-full" onClick={() => setStep(1)}>
          <Crown size={18} /> {S.franchise.confirm1}
        </Button>
      ) : (
        <div className="mt-3">
          <p className="mb-2 text-center text-[15px] font-bold text-warn">{S.franchise.confirm2}</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              {S.franchise.notYet}
            </Button>
            <Button
              variant="gold"
              className="flex-1"
              onClick={() => {
                const gained = pfForRun(engine.state);
                if (engine.run(franchise)) {
                  engine.save();
                  setTab('business');
                  celebrate({ kind: 'franchise', pf: gained });
                  onClose();
                }
              }}
            >
              {S.franchise.confirmYes}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
