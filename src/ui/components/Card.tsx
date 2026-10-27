import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-surface-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${glow ? 'border-water/50 shadow-[0_0_0_1px_rgba(34,211,238,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]' : 'border-line'} ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-5 mb-2 flex items-center justify-between px-1 first:mt-1">
      <h3 className="font-display text-[15px] tracking-wide text-ink uppercase">{children}</h3>
      {right}
    </div>
  );
}
