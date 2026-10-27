import type { WeatherId } from '../types';

export interface WeatherDef {
  id: WeatherId;
  chance: number;
  arrivals: number;
}

export const WEATHER: readonly WeatherDef[] = [
  { id: 'sunny', chance: 0.6, arrivals: 1 },
  { id: 'cloudy', chance: 0.25, arrivals: 1 },
  { id: 'rain', chance: 0.12, arrivals: 0.6 },
  { id: 'dust', chance: 0.03, arrivals: 1.3 },
];

export const WEATHER_BY_ID: Readonly<Record<WeatherId, WeatherDef>> = Object.fromEntries(
  WEATHER.map((w) => [w.id, w]),
) as Record<WeatherId, WeatherDef>;

export const EVENTS = {
  forecastAccuracy: 0.8,
  afterRainArrivals: 1.4,
  weekendArrivals: 1.25,
  paydayArrivals: 1.5,
  paydayDays: [15, 30] as readonly number[],
  buenFin: { month: 11, from: 16, to: 19, arrivals: 1.6, fairMult: 0.85 },
  aguinaldo: { month: 12, arrivals: 1.3 },
  waterCut: { chance: 0.05, seconds: 120, pipeCost: 500 },
  vip: {
    chancePerHour: 0.1,
    minLocation: 1,
    tipMult: 3,
    qualityNeeded: 0.9,
    repGain: 0.05,
    repLoss: 0.1,
  },
  viral: { chance: 0.03, minRep: 4.5, arrivals: 1.6 },
  inspector: { chance: 0.04, fine: 1000 },
} as const;
