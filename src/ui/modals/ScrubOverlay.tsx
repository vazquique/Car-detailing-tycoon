import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, FastForward, Hand } from 'lucide-react';
import { engine, useG } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { registerSurface } from '../../render/loop';
import { ScrubGame } from '../../render/scrubGame';
import { SERVICE_BY_ID } from '../../game/data/services';
import { S } from '../../game/data/strings';
import { endHandWash } from '../../game/actions/workshop';
import { handServiceCount } from '../../game/sim/bays';
import { expectedQuality } from '../../game/sim/economy';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressRing';
import type { HandStep } from '../../game/types';
import { play, vibrate } from '../../audio/sfx';

function handQuality(game: ScrubGame, bayId: number): number {
  const s = engine.state;
  const job = s.bays.find((b) => b.id === bayId)?.job;
  if (!job) return 0.8;
  const n = handServiceCount(job);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const id = job.customer.services[job.serviceIndex + i];
    if (id) sum += expectedQuality(s, id, null, true);
  }
  return Math.min(1, (n > 0 ? sum / n : 0.8) * game.performance());
}

export function ScrubOverlay() {
  const bayId = useUi((u) => u.scrubBayId);
  if (bayId === null) return null;
  return <ScrubInner key={bayId} bayId={bayId} />;
}

function ScrubInner({ bayId }: { bayId: number }) {
  const setScrub = useUi((u) => u.setScrub);
  const tutorialDone = useUi((u) => u.settings.tutorialDone);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<ScrubGame | null>(null);
  const closing = useRef(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [coverage, setCoverage] = useState(0);
  const [finished, setFinished] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const jobAlive = useG((s) => !!s.bays.find((b) => b.id === bayId)?.job?.handActive);

  const [setup] = useState(() => {
    const job = engine.state.bays.find((b) => b.id === bayId)?.job;
    if (!job) return null;
    const n = handServiceCount(job);
    const steps: HandStep[] = [];
    for (let i = 0; i < n; i++) {
      const id = job.customer.services[job.serviceIndex + i];
      if (id) steps.push(...SERVICE_BY_ID[id].handSteps);
    }
    return { customer: job.customer, steps };
  });

  const close = useCallback(
    (fraction: number, quality: number): void => {
      if (closing.current) return;
      closing.current = true;
      engine.dispatch(endHandWash, { bayId, fraction, quality });
      setScrub(null);
    },
    [bayId, setScrub],
  );

  useEffect(() => {
    if (!setup) return;
    const game = new ScrubGame(setup.customer, setup.steps);
    gameRef.current = game;
    game.onStep = (i) => {
      setStepIdx(i);
      if (i > 0) {
        play('step');
        vibrate(20);
      }
    };
    game.onFinish = () => {
      const q = handQuality(game, bayId);
      setFinished(q);
      play('cash');
      vibrate([20, 40, 20]);
      window.setTimeout(() => close(1, q), 1100);
    };
    const c = canvasRef.current;
    if (!c) return;
    let last = -1;
    return registerSurface(c, (sf, now, dt) => {
      game.draw(sf, now, dt);
      const cov = Math.round(game.coverage * 100);
      if (cov !== last) {
        last = cov;
        setCoverage(game.coverage);
      }
    });
  }, [setup, bayId, close]);

  // The job may end without us (closing time): then just close.
  useEffect(() => {
    if (!jobAlive && !closing.current && finished === null) setScrub(null);
  }, [jobAlive, finished, setScrub]);

  if (!setup) return null;
  const steps = setup.steps;
  const step = steps[stepIdx];
  const stepText = step ? S.scrub.steps[step] : null;

  const pos = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  return (
    <div
      className="animate-fade absolute inset-0 z-50 flex flex-col bg-bg-0"
      role="dialog"
      aria-label={S.scrub.title}
    >
      <div className="shrink-0 px-4 pb-2" style={{ paddingTop: 'calc(var(--safe-top) + 10px)' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[20px] text-ink">{S.scrub.title}</h2>
          <span className="tabular text-[14px] font-bold text-dim">
            {S.scrub.stepOf(Math.min(stepIdx + 1, steps.length), steps.length)}
          </span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {steps.map((st, i) => (
            <div
              key={`${st}-${i}`}
              className={`flex flex-1 items-center justify-center gap-1 rounded-xl border py-1.5 text-[14px] font-bold ${i < stepIdx || finished !== null ? 'border-gain/40 bg-gain/15 text-gain' : i === stepIdx ? 'border-water/60 bg-water/15 text-water' : 'border-line bg-surface-0 text-dim'}`}
            >
              {(i < stepIdx || finished !== null) && <Check size={14} />}
              {S.scrub.steps[st].name}
            </div>
          ))}
        </div>
        <div className="mt-2 text-[15px] font-medium text-ink">
          {finished !== null ? S.scrub.done : stepText?.hint}
        </div>
        <ProgressBar
          value={finished !== null ? 1 : Math.min(1, coverage / 0.85)}
          className="mt-2 h-2.5"
          color={finished !== null ? 'bg-gain' : 'bg-water'}
        />
      </div>
      <div className="relative min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const [x, y] = pos(e);
            setTouched(true);
            gameRef.current?.pointerDown(e.pointerId, x, y);
            play('water');
          }}
          onPointerMove={(e) => {
            const [x, y] = pos(e);
            gameRef.current?.pointerMove(e.pointerId, x, y);
            if (Math.random() < 0.08) play(step === 'soap' ? 'bubbles' : 'water');
          }}
          onPointerUp={(e) => gameRef.current?.pointerUp(e.pointerId)}
          onPointerCancel={(e) => gameRef.current?.pointerUp(e.pointerId)}
        />
        {!touched && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div
                style={{ animation: 'hand-scrub 1.6s ease-in-out infinite' }}
                className="text-ink drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              >
                <Hand size={56} fill="#E8EEF9" className="text-bg-0" />
              </div>
              {!tutorialDone && (
                <span className="rounded-full bg-bg-0/85 px-3 py-1.5 text-[15px] font-bold text-ink">
                  {S.tutorial.scrub}
                </span>
              )}
            </div>
          </div>
        )}
        {finished !== null && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="animate-pop rounded-3xl border border-gain/40 bg-bg-0/85 px-6 py-4 text-center">
              <div className="font-display text-[24px] text-gain">{S.scrub.done}</div>
              <div className="tabular text-[16px] font-bold text-ink">
                {S.scrub.quality(Math.round(finished * 100))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        className="shrink-0 px-4 pt-2"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}
      >
        <p className="mb-2 text-center text-[14px] text-dim">{S.scrub.remaining}</p>
        <Button
          variant="secondary"
          className="w-full"
          disabled={finished !== null}
          onClick={() => {
            const g = gameRef.current;
            if (!g) return;
            close(g.fraction(), handQuality(g, bayId));
          }}
        >
          <FastForward size={18} /> {S.scrub.autoFinish}
        </Button>
      </div>
    </div>
  );
}
