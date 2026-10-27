import type { ServiceId, VehicleId } from '../types';

export interface ContractTemplate {
  id: string;
  vehicle: VehicleId;
  count: number;
  services: ServiceId[];
  days: number;
}

export const CONTRACT_TEMPLATES: readonly ContractTemplate[] = [
  { id: 'airportTaxis', vehicle: 'sedan', count: 15, services: ['exterior', 'interior'], days: 2 },
  {
    id: 'carRental',
    vehicle: 'compact',
    count: 10,
    services: ['exterior', 'interior', 'wheels'],
    days: 1,
  },
  { id: 'express', vehicle: 'van', count: 12, services: ['exterior', 'engine'], days: 2 },
  { id: 'usedCars', vehicle: 'suv', count: 8, services: ['polish'], days: 3 },
  { id: 'wedding', vehicle: 'luxury', count: 3, services: ['upholstery', 'clay', 'wax'], days: 2 },
  { id: 'classicClub', vehicle: 'classic', count: 4, services: ['correction', 'ceramic'], days: 4 },
];

export const CONTRACTS = {
  /** A new offer every N game days. */
  offerEveryDays: 2,
  maxOffers: 3,
  /** Days an offer stays before expiring. */
  offerLifetimeDays: 1,
  payMult: 1.4,
  repSuccess: 0.1,
  repFail: 0.3,
  minLocation: 1,
  /** Car count multiplier by location index. */
  countScale: [0.5, 0.6, 1.0, 1.4] as readonly number[],
  /** Fraction of the window used to spread arrivals (leaves time to finish). */
  spreadFraction: 0.75,
  /** Pay bonus per level of "Contactos de flotillas". */
  fleetPayBonus: 0.2,
} as const;
