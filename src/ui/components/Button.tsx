import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { formatMoney } from '../../game/format';
import { S } from '../../game/data/strings';
import { play, unlockAudio, vibrate } from '../../audio/sfx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
  className?: string;
  small?: boolean;
  ariaLabel?: string;
  sound?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-water to-water-deep text-bg-0 shadow-[0_6px_18px_-6px_rgba(34,211,238,0.7),inset_0_1px_0_rgba(255,255,255,0.45)]',
  gold: 'bg-gradient-to-b from-[#FDE047] to-[#EAB308] text-bg-0 shadow-[0_6px_18px_-6px_rgba(250,204,21,0.7),inset_0_1px_0_rgba(255,255,255,0.5)]',
  secondary:
    'bg-surface-1 text-ink border border-line shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
  ghost: 'bg-transparent text-dim',
  danger:
    'bg-gradient-to-b from-[#F87171] to-[#DC2626] text-white shadow-[0_6px_18px_-6px_rgba(248,113,113,0.6)]',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
  small,
  ariaLabel,
  sound = true,
}: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        unlockAudio();
        if (disabled) return;
        if (sound) play('tap');
        vibrate(8);
        onClick?.();
      }}
      className={`btn-press inline-flex items-center justify-center gap-2 rounded-2xl font-bold ${small ? 'min-h-11 px-3 text-[14px]' : 'min-h-12 px-4 text-[15px]'} ${VARIANTS[variant]} ${disabled ? 'opacity-45 saturate-50' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

interface BuyButtonProps {
  cost: number;
  money: number;
  onBuy: () => void;
  label: string;
  className?: string;
  small?: boolean;
  /** Extra reason that blocks the purchase (e.g. needs another item). */
  blocked?: string | null;
}

/** Purchase button: shows the price, or a lock with what's missing and a progress bar. */
export function BuyButton({
  cost,
  money,
  onBuy,
  label,
  className = '',
  small,
  blocked,
}: BuyButtonProps) {
  const debt = money < 0;
  const can = !debt && money >= cost && !blocked;
  if (blocked) {
    return (
      <div
        className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-bg-1 px-3 text-center text-[14px] font-medium text-dim ${className}`}
      >
        <Lock size={15} aria-hidden />
        <span>{blocked}</span>
      </div>
    );
  }
  if (can) {
    return (
      <Button
        small={small}
        className={className}
        sound={false}
        onClick={() => {
          play('buy');
          vibrate([10, 30, 10]);
          onBuy();
        }}
      >
        {label && <span>{label}</span>}
        <span className={`tabular rounded-lg ${label ? 'bg-bg-0/15 px-2 py-0.5' : ''}`}>
          {formatMoney(cost)}
        </span>
      </Button>
    );
  }
  const pct = debt ? 0 : Math.max(0, Math.min(1, money / Math.max(1, cost)));
  return (
    <button
      type="button"
      onClick={() => {
        unlockAudio();
        play('error');
      }}
      className={`relative flex ${small ? 'min-h-11' : 'min-h-12'} items-center justify-center gap-2 overflow-hidden rounded-2xl border border-line bg-bg-1 px-3 text-[14px] font-medium text-dim ${className}`}
    >
      <span
        className="absolute inset-y-0 left-0 bg-water/12"
        style={{ width: `${pct * 100}%` }}
        aria-hidden
      />
      <span
        className="absolute bottom-0 left-0 h-[3px] bg-water/70"
        style={{ width: `${pct * 100}%` }}
        aria-hidden
      />
      <Lock size={15} className="relative" aria-hidden />
      <span className="tabular relative">
        {debt ? S.buttons.debt : S.buttons.missing(formatMoney(cost - money))}
      </span>
    </button>
  );
}
