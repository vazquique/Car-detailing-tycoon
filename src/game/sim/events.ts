// Timed effects, daily random events and the list of active modifiers for the HUD banner.
import type { GameState, TimedEffect } from '../types';
import { CALENDAR } from '../data/economy';
import { EVENTS, WEATHER_BY_ID } from '../data/events';
import { UPGRADE_EFFECTS } from '../data/upgrades';
import { MARKETING_BY_ID } from '../data/marketing';
import { chance, randRange } from '../rng';
import { calendarOf, isBuenFin, secondsToClose } from './calendar';

export function hasEffect(s: GameState, id: TimedEffect['id']): boolean {
  for (const e of s.effects) if (e.id === id && e.remaining > 0) return true;
  return false;
}

export function addEffect(s: GameState, id: TimedEffect['id'], seconds: number): void {
  const existing = s.effects.find((e) => e.id === id);
  if (existing) {
    existing.remaining = Math.max(existing.remaining, seconds);
    existing.total = Math.max(existing.total, seconds);
  } else {
    s.effects.push({ id, remaining: seconds, total: seconds });
  }
}

export function removeEffect(s: GameState, id: TimedEffect['id']): void {
  s.effects = s.effects.filter((e) => e.id !== id);
}

export function updateEffects(s: GameState, dt: number): void {
  for (const e of s.effects) e.remaining -= dt;
  if (s.effects.some((e) => e.remaining <= 0)) {
    const ended = s.effects.filter((e) => e.remaining <= 0);
    s.effects = s.effects.filter((e) => e.remaining > 0);
    for (const e of ended) if (e.id === 'waterCut') s.fx.push({ kind: 'event', id: 'waterCutEnd' });
  }
}

/** Plans today's random events (called at the start of each day). */
export function planDailyEvents(s: GameState): void {
  const open = CALENDAR.openMinute;
  s.planned = { waterCut: -1, inspector: -1, viral: -1 };
  if (chance(s, EVENTS.waterCut.chance)) s.planned.waterCut = randRange(s, open + 60, 15 * 60);
  if (chance(s, EVENTS.inspector.chance)) s.planned.inspector = randRange(s, open + 30, 18 * 60);
  if (s.reputation >= EVENTS.viral.minRep && chance(s, EVENTS.viral.chance)) {
    s.planned.viral = randRange(s, open + 30, 16 * 60);
  }
}

/** Fires planned events when their minute arrives. */
export function runPlannedEvents(s: GameState): void {
  if (s.planned.waterCut >= 0 && s.minute >= s.planned.waterCut) {
    s.planned.waterCut = -1;
    if (s.upgrades.cistern <= 0) {
      addEffect(s, 'waterCut', EVENTS.waterCut.seconds);
      s.fx.push({ kind: 'event', id: 'waterCutStart' });
    }
  }
  if (s.planned.inspector >= 0 && s.minute >= s.planned.inspector) {
    s.planned.inspector = -1;
    if (s.upgrades.permits > 0) {
      s.fx.push({ kind: 'event', id: 'inspectorOk' });
    } else {
      const fine = EVENTS.inspector.fine * (s.location + 1);
      s.money -= fine;
      s.dayStats.fines += fine;
      s.fx.push({ kind: 'fine', amount: fine });
    }
  }
  if (s.planned.viral >= 0 && s.minute >= s.planned.viral) {
    s.planned.viral = -1;
    addEffect(s, 'viral', secondsToClose(s));
    s.fx.push({ kind: 'event', id: 'viral' });
  }
}

export type ModifierId =
  | 'rain'
  | 'dust'
  | 'afterRain'
  | 'weekend'
  | 'payday'
  | 'buenFin'
  | 'aguinaldo'
  | 'waterCut'
  | 'viral'
  | 'flyers'
  | 'influencer'
  | 'social';

export interface ActiveModifier {
  id: ModifierId;
  /** Arrival multiplier delta, e.g. +0.25 or -0.4. */
  arrivals: number;
  /** Remaining real seconds, or null for "all day". */
  remaining: number | null;
  /** Kind of icon for the banner. */
  tone: 'good' | 'bad' | 'info';
}

/** Lists the effects active right now, for the HUD banner. */
export function activeModifiers(s: GameState): ActiveModifier[] {
  const list: ActiveModifier[] = [];
  const cal = calendarOf(s.day);
  const toClose = secondsToClose(s);
  for (const e of s.effects) {
    if (e.remaining <= 0) continue;
    if (e.id === 'waterCut')
      list.push({ id: 'waterCut', arrivals: 0, remaining: e.remaining, tone: 'bad' });
    if (e.id === 'viral')
      list.push({
        id: 'viral',
        arrivals: EVENTS.viral.arrivals - 1,
        remaining: e.remaining,
        tone: 'good',
      });
    if (e.id === 'flyers')
      list.push({
        id: 'flyers',
        arrivals: MARKETING_BY_ID.flyers.arrivals,
        remaining: e.remaining,
        tone: 'good',
      });
    if (e.id === 'influencer')
      list.push({
        id: 'influencer',
        arrivals: MARKETING_BY_ID.influencer.arrivals,
        remaining: e.remaining,
        tone: 'good',
      });
  }
  if (s.weather === 'rain') {
    const penalty =
      s.upgrades.awning > 0 ? UPGRADE_EFFECTS.awningRainPenalty : 1 - WEATHER_BY_ID.rain.arrivals;
    list.push({ id: 'rain', arrivals: -penalty, remaining: toClose, tone: 'bad' });
  }
  if (s.weather === 'dust')
    list.push({
      id: 'dust',
      arrivals: WEATHER_BY_ID.dust.arrivals - 1,
      remaining: toClose,
      tone: 'info',
    });
  if (s.afterRain)
    list.push({
      id: 'afterRain',
      arrivals: EVENTS.afterRainArrivals - 1,
      remaining: toClose,
      tone: 'good',
    });
  if (isBuenFin(s))
    list.push({
      id: 'buenFin',
      arrivals: EVENTS.buenFin.arrivals - 1,
      remaining: toClose,
      tone: 'info',
    });
  if (EVENTS.paydayDays.includes(cal.dayOfMonth))
    list.push({
      id: 'payday',
      arrivals: EVENTS.paydayArrivals - 1,
      remaining: toClose,
      tone: 'good',
    });
  if (cal.month === EVENTS.aguinaldo.month)
    list.push({
      id: 'aguinaldo',
      arrivals: EVENTS.aguinaldo.arrivals - 1,
      remaining: null,
      tone: 'good',
    });
  if (cal.weekend)
    list.push({
      id: 'weekend',
      arrivals: EVENTS.weekendArrivals - 1,
      remaining: toClose,
      tone: 'good',
    });
  if (s.socialActive)
    list.push({
      id: 'social',
      arrivals: MARKETING_BY_ID.social.arrivals,
      remaining: null,
      tone: 'good',
    });
  return list;
}
