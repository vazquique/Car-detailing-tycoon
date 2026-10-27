// Daily weather and tomorrow's forecast.
import type { GameState, WeatherId } from '../types';
import { WEATHER, EVENTS } from '../data/events';
import { chance, weightedPick } from '../rng';

export function rollWeather(s: GameState): WeatherId {
  return weightedPick(s, WEATHER, (w) => w.chance).id;
}

/** Rolls tomorrow's hidden weather and a forecast that is right most of the time. */
export function rollTomorrow(s: GameState): void {
  s.tomorrowWeather = rollWeather(s);
  if (chance(s, EVENTS.forecastAccuracy)) {
    s.forecast = { weather: s.tomorrowWeather };
  } else {
    const others = WEATHER.filter((w) => w.id !== s.tomorrowWeather);
    s.forecast = { weather: weightedPick(s, others, (w) => w.chance).id };
  }
}
