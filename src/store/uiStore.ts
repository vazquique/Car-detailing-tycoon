// UI state: open sheet, modals, toasts, celebrations and player settings.
import { create } from 'zustand';
import type { DaySummary } from '../game/types';
import type { OfflineResult } from '../game/sim/offline';
import { SETTINGS_KEY } from '../game/constants';

export type TabId = 'workshop' | 'services' | 'staff' | 'upgrades' | 'marketing' | 'business';

export interface Settings {
  sound: boolean;
  vibration: boolean;
  daySummary: boolean;
  reducedMotion: boolean;
  tutorialDone: boolean;
  /** Tutorial: the player already looked at the prices. */
  tutorialPrices: boolean;
}

export interface Toast {
  id: number;
  text: string;
  tone: 'good' | 'bad' | 'info' | 'money';
  icon?: string;
}

export type Celebration =
  | { kind: 'service'; id: string }
  | { kind: 'location'; index: number }
  | { kind: 'achievement'; id: string }
  | { kind: 'franchise'; pf: number };

export type Modal =
  | { kind: 'settings' }
  | { kind: 'daySummary'; summary: DaySummary }
  | { kind: 'offline'; result: OfflineResult }
  | { kind: 'franchise' }
  | { kind: 'bayDetail'; bayId: number }
  | { kind: 'customer'; customerId: number }
  | { kind: 'forecast' }
  | { kind: 'install' };

const DEFAULT_SETTINGS: Settings = {
  sound: true,
  vibration: true,
  daySummary: true,
  reducedMotion: false,
  tutorialDone: false,
  tutorialPrices: false,
};

function prefersReducedMotion(): boolean {
  try {
    return (
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}

function loadSettings(): Settings {
  const base = { ...DEFAULT_SETTINGS, reducedMotion: prefersReducedMotion() };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return base;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return base;
    const p = parsed as Partial<Record<keyof Settings, unknown>>;
    const out = { ...base };
    for (const k of Object.keys(base) as (keyof Settings)[]) {
      const v = p[k];
      if (typeof v === 'boolean') out[k] = v;
    }
    return out;
  } catch {
    return base;
  }
}

function persistSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // Storage blocked: settings stay for this session only.
  }
}

interface UiStore {
  tab: TabId | null;
  modal: Modal | null;
  toasts: Toast[];
  celebrations: Celebration[];
  scrubBayId: number | null;
  moving: number | null;
  settings: Settings;
  /** Tabs with something new to check. */
  seen: Record<string, number>;
  setTab: (tab: TabId | null) => void;
  openModal: (m: Modal) => void;
  closeModal: () => void;
  toast: (text: string, tone?: Toast['tone'], icon?: string) => void;
  dismissToast: (id: number) => void;
  celebrate: (c: Celebration) => void;
  popCelebration: () => void;
  setScrub: (bayId: number | null) => void;
  setMoving: (loc: number | null) => void;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  markSeen: (key: string, value: number) => void;
}

let toastId = 1;

export const useUi = create<UiStore>((set, get) => ({
  tab: null,
  modal: null,
  toasts: [],
  celebrations: [],
  scrubBayId: null,
  moving: null,
  settings: loadSettings(),
  seen: {},
  setTab: (tab) => set({ tab }),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
  toast: (text, tone = 'info', icon) => {
    const t: Toast = { id: toastId++, text, tone, ...(icon ? { icon } : {}) };
    const toasts = [...get().toasts, t].slice(-3);
    set({ toasts });
    setTimeout(() => get().dismissToast(t.id), 2600);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  celebrate: (c) => set({ celebrations: [...get().celebrations, c].slice(0, 6) }),
  popCelebration: () => set({ celebrations: get().celebrations.slice(1) }),
  setScrub: (scrubBayId) => set({ scrubBayId }),
  setMoving: (moving) => set({ moving }),
  setSetting: (k, v) => {
    const settings = { ...get().settings, [k]: v };
    persistSettings(settings);
    set({ settings });
  },
  markSeen: (key, value) => set({ seen: { ...get().seen, [key]: value } }),
}));
