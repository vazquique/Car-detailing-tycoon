export function ProgressRing({
  value,
  size = 40,
  stroke = 4,
  color = 'var(--water)',
  track = 'rgba(255,255,255,0.1)',
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      className="-rotate-90"
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v)}
      />
    </svg>
  );
}

export function ProgressBar({
  value,
  color = 'bg-water',
  className = '',
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-bg-0/70 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(v * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${color} transition-[width] duration-150`}
        style={{ width: `${v * 100}%` }}
      />
    </div>
  );
}
