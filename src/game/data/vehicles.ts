import type { VehicleId } from '../types';

export interface VehicleDef {
  id: VehicleId;
  priceMult: number;
  timeMult: number;
  /** Location index required. */
  minLocation: number;
  /** Reputation required (unless unlocked by marketing). */
  minRep: number;
  /** Relative arrival weight once unlocked. */
  weight: number;
  /** Bias towards expensive services (0 = cheap, 1 = very expensive). */
  luxury: number;
  /** Silhouette size in car units (width, length). */
  width: number;
  length: number;
}

export const VEHICLES: readonly VehicleDef[] = [
  {
    id: 'compact',
    priceMult: 1.0,
    timeMult: 0.85,
    minLocation: 0,
    minRep: 0,
    weight: 30,
    luxury: 0,
    width: 0.82,
    length: 0.78,
  },
  {
    id: 'sedan',
    priceMult: 1.15,
    timeMult: 1.0,
    minLocation: 0,
    minRep: 0,
    weight: 30,
    luxury: 0.1,
    width: 0.84,
    length: 0.92,
  },
  {
    id: 'suv',
    priceMult: 1.4,
    timeMult: 1.25,
    minLocation: 1,
    minRep: 0,
    weight: 20,
    luxury: 0.25,
    width: 0.92,
    length: 0.92,
  },
  {
    id: 'pickup',
    priceMult: 1.5,
    timeMult: 1.3,
    minLocation: 1,
    minRep: 0,
    weight: 14,
    luxury: 0.2,
    width: 0.92,
    length: 1.0,
  },
  {
    id: 'van',
    priceMult: 1.6,
    timeMult: 1.45,
    minLocation: 1,
    minRep: 0,
    weight: 5,
    luxury: 0.15,
    width: 0.9,
    length: 1.0,
  },
  {
    id: 'sport',
    priceMult: 2.5,
    timeMult: 1.1,
    minLocation: 2,
    minRep: 4.0,
    weight: 9,
    luxury: 0.6,
    width: 0.9,
    length: 0.9,
  },
  {
    id: 'luxury',
    priceMult: 3.5,
    timeMult: 1.3,
    minLocation: 3,
    minRep: 4.3,
    weight: 8,
    luxury: 0.8,
    width: 0.88,
    length: 1.0,
  },
  {
    id: 'classic',
    priceMult: 5.0,
    timeMult: 1.6,
    minLocation: 3,
    minRep: 4.6,
    weight: 5,
    luxury: 1,
    width: 0.86,
    length: 0.96,
  },
];

export const VEHICLE_BY_ID: Readonly<Record<VehicleId, VehicleDef>> = Object.fromEntries(
  VEHICLES.map((v) => [v.id, v]),
) as Record<VehicleId, VehicleDef>;

export interface DirtDef {
  timeMult: number;
  priceMult: number;
  weight: number;
  /** Weight during a dust storm. */
  dustWeight: number;
}

export const DIRT: readonly DirtDef[] = [
  { timeMult: 1.0, priceMult: 1.0, weight: 50, dustWeight: 20 },
  { timeMult: 1.2, priceMult: 1.0, weight: 35, dustWeight: 40 },
  { timeMult: 1.5, priceMult: 1.2, weight: 15, dustWeight: 40 },
];
