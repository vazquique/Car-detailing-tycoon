// Canvas palette. Same values as src/styles/tokens.css.

export const PALETTE = {
  bg0: '#0B0F17',
  bg1: '#111827',
  surface0: '#151C2C',
  surface1: '#1C2538',
  border: '#2A3550',
  text: '#E8EEF9',
  textDim: '#8A97B2',
  water: '#22D3EE',
  waterDeep: '#0EA5E9',
  soap: '#F472B6',
  money: '#FACC15',
  gain: '#4ADE80',
  loss: '#F87171',
  warn: '#FB923C',
  star: '#FCD34D',
} as const;

export const CAR_COLORS = [
  '#E11D48',
  '#2563EB',
  '#F1F5F9',
  '#0F172A',
  '#94A3B8',
  '#475569',
  '#059669',
  '#EAB308',
  '#EA580C',
  '#7F1D1D',
  '#38BDF8',
] as const;

export const CLASSIC_COLORS = ['#6EE7B7', '#F9A8D4', '#FDE68A', '#93C5FD'] as const;

/** Cap colors by worker level (1..10). */
export const LEVEL_COLORS = [
  '#94A3B8',
  '#4ADE80',
  '#22D3EE',
  '#38BDF8',
  '#818CF8',
  '#C084FC',
  '#F472B6',
  '#FB923C',
  '#FACC15',
  '#F8FAFC',
] as const;

export const SKIN_TONES = ['#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#FFDBAC'] as const;
