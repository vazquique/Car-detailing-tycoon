import { Smartphone } from 'lucide-react';
import { S } from '../game/data/strings';

/** Shown only in landscape on phones (pure CSS media query). */
export function RotateNotice() {
  return (
    <div className="rotate-notice absolute inset-0 z-[100] hidden flex-col items-center justify-center gap-3 bg-bg-0 text-center">
      <Smartphone size={60} className="animate-wiggle text-water" />
      <div className="font-display text-[24px] text-ink">{S.rotate.title}</div>
      <div className="text-[16px] text-dim">{S.rotate.text}</div>
    </div>
  );
}
