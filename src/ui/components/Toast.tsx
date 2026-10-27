import { CircleAlert, Coins, Info, PartyPopper } from 'lucide-react';
import { useUi } from '../../store/uiStore';

export function Toasts() {
  const toasts = useUi((u) => u.toasts);
  const dismiss = useUi((u) => u.dismissToast);
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
      style={{ top: 'calc(var(--safe-top) + 92px)' }}
      aria-live="polite"
    >
      {toasts.map((t) => (
        <button
          type="button"
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`animate-toast pointer-events-auto flex max-w-full items-center gap-2 rounded-2xl border px-4 py-2.5 text-[14px] font-bold shadow-xl backdrop-blur ${
            t.tone === 'bad'
              ? 'border-loss/40 bg-[#2A1418]/95 text-[#FECACA]'
              : t.tone === 'good'
                ? 'border-gain/40 bg-[#0F2A1C]/95 text-[#BBF7D0]'
                : t.tone === 'money'
                  ? 'border-money/40 bg-[#2A2410]/95 text-[#FEF08A]'
                  : 'border-line bg-surface-1/95 text-ink'
          }`}
        >
          {t.tone === 'bad' ? (
            <CircleAlert size={18} />
          ) : t.tone === 'good' ? (
            <PartyPopper size={18} />
          ) : t.tone === 'money' ? (
            <Coins size={18} />
          ) : (
            <Info size={18} />
          )}
          <span className="text-left">{t.text}</span>
        </button>
      ))}
    </div>
  );
}
