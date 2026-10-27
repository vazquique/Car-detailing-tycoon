import { useEffect, useRef } from 'react';
import { Hand, UserPlus, Zap } from 'lucide-react';
import { engine, useG } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { registerSurface } from '../../render/loop';
import { bayBusy, bayTapFx, drawBay } from '../../render/bayPainter';
import { hasParticles } from '../../render/particles';
import { canHandWash, jobTimeLeft, tapBay } from '../../game/sim/bays';
import { beginHandWash } from '../../game/actions/workshop';
import { S } from '../../game/data/strings';
import { formatDuration } from '../../game/format';
import { play, unlockAudio, vibrate } from '../../audio/sfx';
import { ProgressBar } from '../components/ProgressRing';
import { LEVEL_COLORS } from '../../game/palette';

const LONG_PRESS_MS = 450;

export function BayTile({
  bayId,
  number,
  style,
}: {
  bayId: number;
  number: number;
  style: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const press = useRef<{ timer: number; long: boolean } | null>(null);
  const bay = useG((s) => s.bays.find((b) => b.id === bayId));
  const worker = useG((s) => {
    const b = s.bays.find((x) => x.id === bayId);
    return b?.workerId != null ? s.workers.find((w) => w.id === b.workerId) : undefined;
  });
  const timeLeft = useG((s) => {
    const b = s.bays.find((x) => x.id === bayId);
    return b ? Math.ceil(jobTimeLeft(s, b)) : 0;
  });
  const handReady = useG((s) => {
    const b = s.bays.find((x) => x.id === bayId);
    return b ? canHandWash(s, b) : false;
  });
  const openModal = useUi((u) => u.openModal);
  const setScrub = useUi((u) => u.setScrub);
  const setTab = useUi((u) => u.setTab);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    return registerSurface(
      c,
      (sf, now, dt) => {
        const s = engine.state;
        const b = s.bays.find((x) => x.id === bayId);
        if (b) drawBay(sf, s, b, number, now, dt);
      },
      () => {
        const b = engine.state.bays.find((x) => x.id === bayId);
        return b ? bayBusy(b) || hasParticles(bayId) : false;
      },
    );
  }, [bayId, number]);

  if (!bay) return null;
  const job = bay.job;
  const service = job ? job.customer.services[job.serviceIndex] : undefined;
  const phase = job && job.duration > 0 ? job.progress / job.duration : 0;
  const empty = !bay.isOwner && !worker;

  const onTap = (clientX: number, clientY: number): void => {
    unlockAudio();
    const s = engine.state;
    const b = s.bays.find((x) => x.id === bayId);
    if (!b) return;
    if (b.isOwner && canHandWash(s, b)) {
      if (engine.dispatch(beginHandWash, { bayId })) {
        play('whoosh');
        setScrub(bayId);
      }
      return;
    }
    if (!b.isOwner && b.workerId === null) {
      setTab('staff');
      return;
    }
    if (engine.input((st) => tapBay(st, bayId))) {
      const r = canvasRef.current?.getBoundingClientRect();
      if (r) bayTapFx(bayId, clientX - r.left, clientY - r.top, S.workshop.hurry);
      play('tap');
      vibrate(5);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${bay.isOwner ? 'border-water/60 shadow-[0_0_18px_-6px_rgba(34,211,238,0.6)]' : 'border-line'} bg-bg-1 select-none`}
      style={{ ...style, touchAction: 'manipulation' }}
      data-bay={bayId}
      data-tutorial={bay.isOwner ? 'owner-bay' : undefined}
      onPointerDown={(e) => {
        const p = { timer: 0, long: false };
        p.timer = window.setTimeout(() => {
          p.long = true;
          vibrate(15);
          openModal({ kind: 'bayDetail', bayId });
        }, LONG_PRESS_MS);
        press.current = p;
        void e;
      }}
      onPointerUp={(e) => {
        const p = press.current;
        press.current = null;
        if (!p) return;
        window.clearTimeout(p.timer);
        if (!p.long) onTap(e.clientX, e.clientY);
      }}
      onPointerLeave={() => {
        if (press.current) window.clearTimeout(press.current.timer);
        press.current = null;
      }}
      onPointerCancel={() => {
        if (press.current) window.clearTimeout(press.current.timer);
        press.current = null;
      }}
      onContextMenu={(e) => e.preventDefault()}
      role="button"
      aria-label={bay.isOwner ? S.workshop.yourBay : S.workshop.bay(number)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Name plate */}
      <div className="pointer-events-none absolute top-1.5 left-1.5 flex max-w-[calc(100%-12px)] items-center gap-1 rounded-full bg-bg-0/80 py-0.5 pr-2 pl-1 text-[14px] font-bold backdrop-blur-sm">
        {bay.isOwner ? (
          <>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-money text-bg-0">
              <Hand size={14} />
            </span>
            <span className="truncate text-ink">{S.workshop.yourBay}</span>
          </>
        ) : worker ? (
          <>
            <span
              className="flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[14px] leading-none text-bg-0"
              style={{ background: LEVEL_COLORS[worker.level - 1] }}
            >
              {worker.level}
            </span>
            <span className="truncate text-ink">{worker.name}</span>
          </>
        ) : (
          <span className="truncate pl-1 text-dim">{S.workshop.bay(number)}</span>
        )}
      </div>
      {bay.tapsThisSecond > 0.5 && job && (
        <div className="pointer-events-none absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-water text-bg-0">
          <Zap size={14} />
        </div>
      )}
      {/* Status */}
      {job && !job.handActive && !handReady && (
        <div className="pointer-events-none absolute inset-x-1.5 bottom-1.5 rounded-xl bg-bg-0/85 px-2 py-1.5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-1 text-[14px] leading-tight">
            <span className="truncate font-bold text-ink">
              {service ? S.services[service].short : ''}
            </span>
            <span className="tabular shrink-0 text-dim">{formatDuration(timeLeft)}</span>
          </div>
          <ProgressBar value={phase} className="mt-1 h-1.5" />
        </div>
      )}
      {handReady && (
        <div className="pointer-events-none absolute inset-x-1.5 bottom-1.5 flex justify-center">
          <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-money to-[#EAB308] px-2 py-2 text-[14px] font-bold text-bg-0 shadow-[0_0_18px_rgba(250,204,21,0.45)]">
            <Hand size={17} className="animate-wiggle" /> {S.workshop.tapToWash}
          </span>
        </div>
      )}
      {empty && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-line bg-bg-0/70 text-dim">
            <UserPlus size={20} />
          </span>
          <span className="text-[14px] font-bold text-ink">{S.workshop.emptyBay}</span>
          <span className="text-[14px] text-dim">{S.workshop.hireHint}</span>
        </div>
      )}
      {!job && !empty && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[14px] font-medium text-dim/90">
          {S.workshop.waiting}
        </div>
      )}
    </div>
  );
}
