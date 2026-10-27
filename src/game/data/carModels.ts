import type { VehicleId } from '../types';

// Invented model names. None of them match a real car model.
export const CAR_MODELS: Readonly<Record<VehicleId, readonly string[]>> = {
  compact: ['Chispa', 'Grillo', 'Pulga', 'Colibrí', 'Pecas', 'Canica'],
  sedan: ['Sereno', 'Brisa', 'Alameda', 'Rumbo', 'Cumbre', 'Faro'],
  suv: ['Jaguarundi', 'Tepeyac', 'Bisonte', 'Nahual', 'Ocelote'],
  pickup: ['Brecha', 'Arriero', 'Mezquite', 'Huizache', 'Terregal'],
  van: ['Peregrina', 'Romería', 'Tianguis', 'Mudancera'],
  sport: ['Relámpago GT', 'Centella R', 'Saeta GT', 'Bólido S'],
  luxury: ['Duquesa', 'Marquesa', 'Virreina', 'Regente'],
  classic: ['Danzón', 'Bolero', 'Mambo', 'Chachachá'],
};
