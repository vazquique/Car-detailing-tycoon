// Number formatting shared by the UI and the canvas.

const BIG_SUFFIXES = ['K', 'M', 'B', 'T'];

function suffixFor(tier: number): string {
  // tier 1 = K, 2 = M, 3 = B, 4 = T, 5 = aa, 6 = ab ...
  if (tier <= BIG_SUFFIXES.length) return BIG_SUFFIXES[tier - 1] ?? '';
  const n = tier - BIG_SUFFIXES.length - 1;
  const first = String.fromCharCode(97 + (Math.floor(n / 26) % 26));
  const second = String.fromCharCode(97 + (n % 26));
  return first + second;
}

function groupThousands(value: number): string {
  const digits = Math.floor(value).toString();
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Formats a plain amount: 1,240 / 125.4K / 3.2M. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs < 100_000) return sign + groupThousands(Math.round(abs));
  // Floor instead of round so the player never sees more money than they have.
  const tier = Math.floor(Math.log10(abs) / 3 + 1e-9);
  const scaled = abs / Math.pow(1000, tier);
  return `${sign}${(Math.floor(scaled * 10 + 1e-6) / 10).toFixed(1)}${suffixFor(tier)}`;
}

/** Formats money: $1,240 / $125.4K / -$3.2M. */
export function formatMoney(value: number): string {
  const text = formatNumber(value);
  return text.startsWith('-') ? `-$${text.slice(1)}` : `$${text}`;
}

/** Formats a duration in real seconds: 45 s / 1 min 20 s / 3 h 05 min. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  if (s < 60) return `${s} s`;
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const rest = s % 60;
    return rest === 0 ? `${m} min` : `${m} min ${rest} s`;
  }
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h} h ${m.toString().padStart(2, '0')} min`;
}

/** Formats reputation: 4.3 ★ */
export function formatRep(value: number): string {
  return `${value.toFixed(1)} ★`;
}

/** Formats a percentage from a ratio: 0.25 -> 25% */
export function formatPercent(ratio: number, decimals = 0): string {
  return `${(ratio * 100).toFixed(decimals)}%`;
}

/** Formats a clock time from minutes since midnight: 15:40 */
export function formatClock(minutes: number): string {
  const total = Math.floor(minutes);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
