import { useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { S } from '../../game/data/strings';

interface SheetProps {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Bottom offset in px (to sit above the tab bar). */
  bottom?: number | string;
  height?: string;
  right?: ReactNode;
}

/** Panel that slides up from the bottom; closes by swiping down or tapping outside. */
export function Sheet({
  title,
  icon,
  onClose,
  children,
  bottom = 0,
  height = '74%',
  right,
}: SheetProps) {
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);
  return (
    <div className="absolute inset-x-0 top-0 z-30" style={{ bottom }}>
      <button
        type="button"
        aria-label={S.buttons.close}
        className="animate-fade absolute inset-0 bg-bg-0/55"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-label={title}
        className="animate-sheet absolute inset-x-0 bottom-0 flex flex-col rounded-t-[22px] border-t border-line bg-bg-1 shadow-[0_-12px_40px_rgba(0,0,0,0.55)]"
        style={{
          height,
          transform: `translateY(${drag}px)`,
          transition: dragging ? 'none' : 'transform 180ms ease-out',
        }}
      >
        <header
          className="shrink-0 touch-none px-4 pt-2 pb-2"
          onPointerDown={(e) => {
            start.current = e.clientY;
            setDragging(true);
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (start.current !== null) setDrag(Math.max(0, e.clientY - start.current));
          }}
          onPointerUp={() => {
            const d = drag;
            start.current = null;
            setDragging(false);
            if (d > 90) onClose();
            else setDrag(0);
          }}
          onPointerCancel={() => {
            start.current = null;
            setDragging(false);
            setDrag(0);
          }}
        >
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-line" />
          <div className="flex items-center gap-2">
            {icon && <span className="text-water">{icon}</span>}
            <h2 className="font-display flex-1 truncate text-[20px] text-ink">{title}</h2>
            {right}
            <button
              type="button"
              aria-label={S.buttons.close}
              onClick={onClose}
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-dim active:bg-surface-1"
            >
              <X size={22} />
            </button>
          </div>
        </header>
        <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6">
          {children}
        </div>
      </section>
    </div>
  );
}

/** Centered modal card. */
export function Modal({
  children,
  onClose,
  label,
  wide,
}: {
  children: ReactNode;
  onClose?: () => void;
  label: string;
  wide?: boolean;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-label={label}
    >
      <button
        type="button"
        aria-label={S.buttons.close}
        className="animate-fade absolute inset-0 bg-bg-0/75 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={`animate-pop relative max-h-[88%] w-full ${wide ? 'max-w-[440px]' : 'max-w-[380px]'} overflow-y-auto rounded-3xl border border-line bg-bg-1 p-5 shadow-2xl`}
      >
        {children}
      </div>
    </div>
  );
}
