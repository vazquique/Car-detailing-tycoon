// Calendar helpers: day number -> month, day of month, weekday.
import type { GameState } from '../types';
import { CALENDAR } from '../data/economy';
import { EVENTS } from '../data/events';

export interface CalendarInfo {
  day: number;
  dayOfMonth: number;
  month: number;
  year: number;
  /** 0 = Monday ... 6 = Sunday */
  weekday: number;
  weekend: boolean;
}

export function calendarOf(day: number): CalendarInfo {
  const d = Math.max(1, Math.floor(day)) - 1;
  const dayOfMonth = (d % CALENDAR.daysPerMonth) + 1;
  const monthIndex = Math.floor(d / CALENDAR.daysPerMonth);
  const month = (monthIndex % CALENDAR.monthsPerYear) + 1;
  const year = Math.floor(monthIndex / CALENDAR.monthsPerYear) + 1;
  const weekday = d % CALENDAR.daysPerWeek;
  return { day: d + 1, dayOfMonth, month, year, weekday, weekend: weekday >= 5 };
}

export function isBuenFin(s: GameState): boolean {
  const c = calendarOf(s.day);
  return (
    c.month === EVENTS.buenFin.month &&
    c.dayOfMonth >= EVENTS.buenFin.from &&
    c.dayOfMonth <= EVENTS.buenFin.to
  );
}

export function isOpen(s: GameState): boolean {
  return s.night <= 0 && s.minute < CALENDAR.closeMinute;
}

/** Real seconds until closing. */
export function secondsToClose(s: GameState): number {
  return Math.max(0, (CALENDAR.closeMinute - s.minute) / CALENDAR.minutesPerSecond);
}

/** Real seconds of a full open day. */
export function daySeconds(): number {
  return (CALENDAR.closeMinute - CALENDAR.openMinute) / CALENDAR.minutesPerSecond;
}

/** Real seconds of a day when customers can arrive. */
export function arrivalSeconds(): number {
  return (CALENDAR.lastArrivalMinute - CALENDAR.openMinute) / CALENDAR.minutesPerSecond;
}
