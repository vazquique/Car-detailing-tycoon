// Reputation (exponential moving average of reviews) and review creation.
import type { Customer, GameState, Review } from '../types';
import { ECONOMY } from '../data/economy';
import { MAPS_REVIEW_WEIGHT } from '../data/marketing';
import { REVIEW_TEXTS } from '../data/reviews';
import { MAX_REVIEWS } from '../constants';
import { pick } from '../rng';
import { clamp } from './economy';

export function reviewAlpha(s: GameState): number {
  return ECONOMY.repAlpha * (s.marketingOwned.mapsProfile ? MAPS_REVIEW_WEIGHT : 1);
}

/** Moves reputation towards the given star rating. */
export function applyStars(s: GameState, stars: number): void {
  const alpha = reviewAlpha(s);
  s.reputation = clamp(
    ECONOMY.repMin,
    ECONOMY.repMax,
    s.reputation + alpha * (stars - s.reputation),
  );
  if (s.reputation < s.dayStats.minRep) s.dayStats.minRep = s.reputation;
}

export function adjustReputation(s: GameState, delta: number): void {
  s.reputation = clamp(ECONOMY.repMin, ECONOMY.repMax, s.reputation + delta);
  if (s.reputation < s.dayStats.minRep) s.dayStats.minRep = s.reputation;
}

export function addReview(s: GameState, c: Customer, stars: number): Review {
  const texts = REVIEW_TEXTS[clamp(1, 5, Math.round(stars)) - 1] ?? REVIEW_TEXTS[0] ?? [''];
  const review: Review = {
    id: s.nextId++,
    name: c.name,
    model: c.model,
    vehicle: c.vehicle,
    stars: Math.round(stars),
    text: pick(s, texts),
    day: s.day,
  };
  s.reviews.unshift(review);
  if (s.reviews.length > MAX_REVIEWS) s.reviews.length = MAX_REVIEWS;
  s.stats.reviews++;
  s.runStats.reviews++;
  s.dayStats.starsSum += review.stars;
  s.dayStats.starsCount++;
  if (!s.dayStats.bestReview || review.stars > s.dayStats.bestReview.stars) {
    s.dayStats.bestReview = review;
  }
  s.fx.push({ kind: 'review', review });
  return review;
}
