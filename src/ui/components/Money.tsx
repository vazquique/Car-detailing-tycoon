import { formatMoney } from '../../game/format';

export function Money({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`tabular font-bold ${value < 0 ? 'text-loss' : 'text-money'} ${className}`}>
      {formatMoney(value)}
    </span>
  );
}
