import { useState } from 'react';
import { Bug, X } from 'lucide-react';
import { engine } from '../store/gameStore';
import { useUi } from '../store/uiStore';
import { S } from '../game/data/strings';
import { formatMoney } from '../game/format';
import { CALENDAR } from '../game/data/economy';
import { DEBUG, debugApi } from './debugApi';

function Btn({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-xl border px-2 text-[14px] font-bold ${active ? 'border-water bg-water/20 text-water' : 'border-line bg-surface-1 text-ink'}`}
    >
      {label}
    </button>
  );
}

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [speed, setSpeed] = useState(engine.speed);
  const toast = useUi((u) => u.toast);
  if (!DEBUG) return null;
  if (!open) {
    return (
      <button
        type="button"
        aria-label={S.debug.title}
        onClick={() => setOpen(true)}
        className="absolute right-2 z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-warn/50 bg-bg-1/90 text-warn"
        style={{ top: 'calc(var(--safe-top) + 120px)' }}
      >
        <Bug size={20} />
      </button>
    );
  }
  return (
    <div
      className="absolute inset-x-2 z-[70] rounded-2xl border border-warn/50 bg-bg-1/95 p-3 shadow-2xl backdrop-blur"
      style={{ top: 'calc(var(--safe-top) + 90px)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-[16px] text-warn">{S.debug.title}</span>
        <button
          type="button"
          aria-label={S.buttons.close}
          onClick={() => setOpen(false)}
          className="flex h-11 w-11 items-center justify-center text-dim"
        >
          <X size={20} />
        </button>
      </div>
      <div className="text-[14px] text-dim">{S.debug.money}</div>
      <div className="mb-2 grid grid-cols-4 gap-1.5">
        {[1e3, 1e5, 1e7, 1e9].map((v) => (
          <Btn key={v} label={`+${formatMoney(v)}`} onClick={() => debugApi.addMoney(v)} />
        ))}
      </div>
      <div className="text-[14px] text-dim">{S.debug.time}</div>
      <div className="mb-2 grid grid-cols-5 gap-1.5">
        <Btn
          label={S.debug.hour}
          onClick={() => debugApi.advance(60 / CALENDAR.minutesPerSecond)}
        />
        <Btn
          label={S.debug.day}
          onClick={() =>
            debugApi.advance(
              (CALENDAR.closeMinute - CALENDAR.openMinute) / CALENDAR.minutesPerSecond +
                CALENDAR.nightSeconds,
            )
          }
        />
        {[1, 5, 20].map((v) => (
          <Btn
            key={v}
            label={`×${v}`}
            active={speed === v}
            onClick={() => {
              debugApi.speed(v);
              setSpeed(v);
            }}
          />
        ))}
      </div>
      <div className="text-[14px] text-dim">{S.debug.events}</div>
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        <Btn label={S.debug.rain} onClick={debugApi.rain} />
        <Btn label={S.debug.waterCut} onClick={debugApi.waterCut} />
        <Btn label={S.debug.vip} onClick={debugApi.vip} />
        <Btn label={S.debug.viral} onClick={debugApi.viral} />
        <Btn label={S.debug.inspector} onClick={debugApi.inspector} />
        <Btn label={S.debug.offer} onClick={debugApi.offer} />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <Btn label={S.debug.unlockAll} onClick={debugApi.unlockAll} />
        <Btn label={S.debug.fill} onClick={() => debugApi.fillQueue(5)} />
        <Btn
          label={S.debug.reset}
          onClick={() => {
            debugApi.reset();
            toast(S.debug.reset, 'info');
          }}
        />
      </div>
    </div>
  );
}
