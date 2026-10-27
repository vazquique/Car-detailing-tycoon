import type { MarketingId } from '../types';

export interface MarketingDef {
  id: MarketingId;
  /** Cost; multiplied by (location index + 1) when `scalesWithLocation`. */
  cost: number;
  scalesWithLocation: boolean;
  kind: 'timed' | 'permanent' | 'subscription' | 'oncePerRun';
  /** Real seconds for timed campaigns. */
  duration: number;
  arrivals: number;
  minLocation: number;
}

export const MARKETING: readonly MarketingDef[] = [
  {
    id: 'flyers',
    cost: 300,
    scalesWithLocation: true,
    kind: 'timed',
    duration: 180,
    arrivals: 0.4,
    minLocation: 0,
  },
  {
    id: 'banner',
    cost: 2500,
    scalesWithLocation: false,
    kind: 'permanent',
    duration: 0,
    arrivals: 0.08,
    minLocation: 0,
  },
  {
    id: 'mapsProfile',
    cost: 1500,
    scalesWithLocation: false,
    kind: 'permanent',
    duration: 0,
    arrivals: 0.1,
    minLocation: 0,
  },
  {
    id: 'social',
    cost: 2000,
    scalesWithLocation: true,
    kind: 'subscription',
    duration: 0,
    arrivals: 0.25,
    minLocation: 0,
  },
  {
    id: 'influencer',
    cost: 80000,
    scalesWithLocation: false,
    kind: 'timed',
    duration: 300,
    arrivals: 1.0,
    minLocation: 1,
  },
  {
    id: 'classicExpo',
    cost: 2000000,
    scalesWithLocation: false,
    kind: 'oncePerRun',
    duration: 0,
    arrivals: 0,
    minLocation: 2,
  },
];

export const MARKETING_BY_ID: Readonly<Record<MarketingId, MarketingDef>> = Object.fromEntries(
  MARKETING.map((m) => [m.id, m]),
) as Record<MarketingId, MarketingDef>;

export const MAPS_REVIEW_WEIGHT = 1.5;
export const SOCIAL_VIP_BONUS = 0.05;
export const INFLUENCER_SPORT_SHARE = 0.3;
