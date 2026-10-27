import { describe, expect, it } from 'vitest';
import { formatDuration, formatMoney, formatRep, formatClock } from '../src/game/format';

describe('formatMoney', () => {
  it('uses thousands separators up to 99,999', () => {
    expect(formatMoney(0)).toBe('$0');
    expect(formatMoney(350)).toBe('$350');
    expect(formatMoney(1240)).toBe('$1,240');
    expect(formatMoney(99_999)).toBe('$99,999');
  });
  it('abbreviates large amounts with one decimal', () => {
    expect(formatMoney(125_400)).toBe('$125.4K');
    expect(formatMoney(3_200_000)).toBe('$3.2M');
    expect(formatMoney(1_700_000_000)).toBe('$1.7B');
    expect(formatMoney(4e12)).toBe('$4.0T');
    expect(formatMoney(2.5e15)).toBe('$2.5aa');
    expect(formatMoney(1e18)).toBe('$1.0ab');
  });
  it('floors at the boundary and handles negatives', () => {
    expect(formatMoney(999_990)).toBe('$999.9K');
    expect(formatMoney(1_000_000)).toBe('$1.0M');
    expect(formatMoney(-1240)).toBe('-$1,240');
    expect(formatMoney(Number.NaN)).toBe('$0');
  });
});

describe('formatDuration', () => {
  it('formats seconds, minutes and hours', () => {
    expect(formatDuration(45)).toBe('45 s');
    expect(formatDuration(80)).toBe('1 min 20 s');
    expect(formatDuration(3 * 3600 + 5 * 60)).toBe('3 h 05 min');
  });
});

describe('misc formats', () => {
  it('formats reputation and clock', () => {
    expect(formatRep(4.32)).toBe('4.3 ★');
    expect(formatClock(15 * 60 + 40)).toBe('15:40');
  });
});
