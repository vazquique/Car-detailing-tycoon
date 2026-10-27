// Synthesized sound effects with the Web Audio API. No audio files.

type SfxId =
  | 'tap'
  | 'water'
  | 'bubbles'
  | 'cash'
  | 'coin'
  | 'buy'
  | 'levelUp'
  | 'achievement'
  | 'error'
  | 'angry'
  | 'honk'
  | 'whoosh'
  | 'step'
  | 'pop';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let noiseBuffer: AudioBuffer | null = null;
const lastPlayed = new Map<SfxId, number>();

const MIN_GAP: Partial<Record<SfxId, number>> = {
  tap: 0.04,
  coin: 0.05,
  water: 0.12,
  bubbles: 0.1,
  pop: 0.05,
};

export function setSoundEnabled(v: boolean): void {
  enabled = v;
  if (master) master.gain.value = v ? 0.5 : 0;
}

/** Must be called from a user gesture (first tap) to unlock audio. */
export function unlockAudio(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  const Ctor = window.AudioContext;
  if (!Ctor) return;
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.5 : 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  } catch {
    ctx = null;
  }
}

export function suspendAudio(): void {
  if (ctx && ctx.state === 'running') void ctx.suspend();
}

export function resumeAudio(): void {
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

function tone(
  type: OscillatorType,
  freq: number,
  start: number,
  dur: number,
  vol: number,
  endFreq?: number,
): void {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g);
  g.connect(master);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function noise(
  start: number,
  dur: number,
  vol: number,
  filterFreq: number,
  q = 1,
  type: BiquadFilterType = 'bandpass',
): void {
  if (!ctx || !master || !noiseBuffer) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = filterFreq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(start, Math.random() * 0.5);
  src.stop(start + dur + 0.02);
}

export function play(id: SfxId): void {
  if (!enabled || !ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  const gap = MIN_GAP[id] ?? 0.03;
  const last = lastPlayed.get(id) ?? -1;
  if (now - last < gap) return;
  lastPlayed.set(id, now);
  switch (id) {
    case 'tap':
      tone('sine', 660 + Math.random() * 80, now, 0.07, 0.18, 880);
      break;
    case 'pop':
      tone('sine', 900 + Math.random() * 300, now, 0.06, 0.12, 1500);
      break;
    case 'water':
      noise(now, 0.35, 0.18, 2400, 0.7);
      break;
    case 'bubbles':
      for (let i = 0; i < 4; i++)
        tone(
          'sine',
          500 + Math.random() * 700,
          now + i * 0.05,
          0.06,
          0.1,
          1200 + Math.random() * 600,
        );
      break;
    case 'coin':
      tone('square', 1320, now, 0.05, 0.06);
      tone('square', 1760, now + 0.05, 0.08, 0.06);
      break;
    case 'cash':
      noise(now, 0.06, 0.15, 3000, 2);
      tone('triangle', 1568, now + 0.03, 0.15, 0.2);
      tone('triangle', 2093, now + 0.1, 0.3, 0.2);
      break;
    case 'buy':
      tone('triangle', 523, now, 0.1, 0.2);
      tone('triangle', 659, now + 0.07, 0.1, 0.2);
      tone('triangle', 1047, now + 0.14, 0.2, 0.22);
      break;
    case 'levelUp':
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        tone('triangle', f, now + i * 0.07, 0.18, 0.18),
      );
      break;
    case 'achievement':
      [392, 523, 659, 784].forEach((f, i) => tone('square', f, now + i * 0.1, 0.14, 0.09));
      tone('triangle', 1047, now + 0.42, 0.5, 0.2);
      tone('triangle', 1319, now + 0.42, 0.5, 0.14);
      break;
    case 'error':
      tone('sine', 220, now, 0.12, 0.15, 180);
      break;
    case 'angry':
      tone('sawtooth', 160, now, 0.3, 0.08, 90);
      noise(now, 0.4, 0.06, 400, 0.6, 'lowpass');
      break;
    case 'honk':
      tone('square', 392, now, 0.16, 0.07);
      tone('square', 330, now, 0.16, 0.07);
      tone('square', 392, now + 0.2, 0.22, 0.07);
      tone('square', 330, now + 0.2, 0.22, 0.07);
      break;
    case 'whoosh':
      noise(now, 0.45, 0.14, 900, 0.5);
      break;
    case 'step':
      tone('sine', 784, now, 0.12, 0.18);
      tone('sine', 1175, now + 0.08, 0.2, 0.18);
      break;
  }
}

let vibrationEnabled = true;
export function setVibrationEnabled(v: boolean): void {
  vibrationEnabled = v;
}

export function vibrate(ms: number | number[]): void {
  if (!vibrationEnabled) return;
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
  } catch {
    // Not supported.
  }
}
