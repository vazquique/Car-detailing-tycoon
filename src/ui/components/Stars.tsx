import { Star } from 'lucide-react';

/** Five stars with partial fill. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-[1px]"
      aria-label={`${value.toFixed(1)} de 5 estrellas`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star
              size={size}
              className="absolute inset-0 text-line"
              fill="currentColor"
              strokeWidth={0}
            />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-star" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
