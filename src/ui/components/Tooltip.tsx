import { useState, type ReactNode } from 'react';

/** Tap-to-toggle info bubble (no hover on phones). */
export function Tooltip({ children, content }: { children: ReactNode; content: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center"
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          onClick={() => setOpen(false)}
          className="animate-pop absolute top-full right-0 z-30 mt-1 w-56 rounded-xl border border-line bg-surface-1 p-3 text-[14px] text-ink shadow-xl"
        >
          {content}
        </span>
      )}
    </span>
  );
}
