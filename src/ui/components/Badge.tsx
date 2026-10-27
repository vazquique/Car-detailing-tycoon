import type { ReactNode } from 'react';

type Tone = 'water' | 'soap' | 'money' | 'gain' | 'loss' | 'warn' | 'dim';

const TONES: Record<Tone, string> = {
  water: 'bg-water/15 text-water border-water/30',
  soap: 'bg-soap/15 text-soap border-soap/30',
  money: 'bg-money/15 text-money border-money/30',
  gain: 'bg-gain/15 text-gain border-gain/30',
  loss: 'bg-loss/15 text-loss border-loss/30',
  warn: 'bg-warn/15 text-warn border-warn/30',
  dim: 'bg-surface-1 text-dim border-line',
};

export function Badge({
  children,
  tone = 'dim',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[14px] leading-5 font-bold whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
