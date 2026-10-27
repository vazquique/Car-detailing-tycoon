// Creates a fresh game state (new game or after a franchise reset).
import type {
  Bay,
  DayStats,
  EquipmentId,
  GameState,
  LifetimeStats,
  MarketingId,
  PrestigeNodeId,
  ServiceId,
  UpgradeId,
} from '../types';
import { SAVE_VERSION, INCOME_RING_SECONDS } from '../constants';
import { ECONOMY, CALENDAR } from '../data/economy';
import { EQUIPMENT } from '../data/equipment';
import { UPGRADES } from '../data/upgrades';
import { MARKETING } from '../data/marketing';
import { SERVICES } from '../data/services';
import { PRESTIGE, PRESTIGE_NODES } from '../data/prestige';
import { STARTING_BAYS } from '../data/locations';
import { rollTomorrow } from './weather';
import { refreshCandidates } from './staff';
import { createCustomer } from './customers';

export function emptyStats(): LifetimeStats {
  return {
    carsServed: 0,
    totalEarned: 0,
    tips: 0,
    customersLost: 0,
    angryCustomers: 0,
    taps: 0,
    muddyCars: 0,
    classicsServed: 0,
    contractsDone: 0,
    contractsFailed: 0,
    workersHired: 0,
    handWashes: 0,
    reviews: 0,
    daysPlayed: 0,
    playSeconds: 0,
    bestDayProfit: 0,
    franchises: 0,
  };
}

export function emptyDayStats(rep: number): DayStats {
  return {
    revenue: 0,
    tips: 0,
    commissions: 0,
    supplies: 0,
    rent: 0,
    wages: 0,
    marketing: 0,
    fines: 0,
    other: 0,
    carsServed: 0,
    lost: 0,
    angry: 0,
    starsSum: 0,
    starsCount: 0,
    bestReview: null,
    repStart: rep,
    minRep: rep,
  };
}

export function newBay(id: number, isOwner: boolean): Bay {
  return {
    id,
    level: 1,
    isOwner,
    workerId: null,
    job: null,
    tapsThisSecond: 0,
    tapFlash: 0,
    idleTime: 0,
  };
}

function record<K extends string, V>(keys: readonly K[], value: V): Record<K, V> {
  return Object.fromEntries(keys.map((k) => [k, value])) as Record<K, V>;
}

export interface CarryOver {
  stats: LifetimeStats;
  achievements: string[];
  prestige: GameState['prestige'];
}

export function createInitialState(seed: number, carry?: CarryOver): GameState {
  const prestige: GameState['prestige'] = carry
    ? { ...carry.prestige, nodes: { ...carry.prestige.nodes }, expoUsed: false }
    : {
        points: 0,
        earnedTotal: 0,
        nodes: record<PrestigeNodeId, number>(
          PRESTIGE_NODES.map((n) => n.id),
          0,
        ),
        expoUsed: false,
      };
  const equipment = record<EquipmentId, number>(
    EQUIPMENT.map((e) => e.id),
    0,
  );
  for (const e of EQUIPMENT) if (e.initial) equipment[e.id] = 1;
  for (const id of PRESTIGE.inheritedTools[prestige.nodes.inheritedTools] ?? []) equipment[id] = 1;

  const s: GameState = {
    version: SAVE_VERSION,
    seed,
    rng: seed | 0,
    nextId: 1,
    money: ECONOMY.startingMoney + (PRESTIGE.seedCapital[prestige.nodes.seedCapital] ?? 0),
    reputation: ECONOMY.startingReputation,
    day: 1,
    minute: CALENDAR.openMinute,
    night: 0,
    weather: 'sunny',
    forecast: { weather: 'sunny' },
    tomorrowWeather: 'sunny',
    afterRain: false,
    location: 0,
    bays: [],
    queue: [],
    workers: [],
    candidates: [],
    support: { receptionist: false, manager: false },
    equipment,
    upgrades: record<UpgradeId, number>(
      UPGRADES.map((u) => u.id),
      0,
    ),
    prices: record<ServiceId, number>(
      SERVICES.map((sv) => sv.id),
      1,
    ),
    marketingOwned: record<MarketingId, boolean>(
      MARKETING.map((m) => m.id),
      false,
    ),
    socialActive: false,
    effects: [],
    contractOffers: [],
    contracts: [],
    nextOfferDay: 1,
    reviews: [],
    dayStats: emptyDayStats(ECONOMY.startingReputation),
    lastSummary: null,
    incomeRing: new Array<number>(INCOME_RING_SECONDS).fill(0),
    incomeRingPos: 0,
    incomeSecondAcc: 0,
    incomeSecondTimer: 0,
    hintCooldown: 0,
    vipTimer: 60,
    planned: { waterCut: -1, inspector: -1, viral: -1 },
    secondTimer: 0,
    stats: carry ? { ...carry.stats } : emptyStats(),
    runStats: emptyStats(),
    achievements: carry ? [...carry.achievements] : [],
    milestones: {},
    prestige,
    fx: [],
    savedAt: Date.now(),
  };
  for (let i = 0; i < STARTING_BAYS; i++) s.bays.push(newBay(s.nextId++, i === 0));
  // Day 1 is always sunny and calm so the first minutes play nicely.
  rollTomorrow(s);
  refreshCandidates(s);
  // The first customer is already waiting: a dirty compact that only wants a wash.
  const first = createCustomer(s, { vehicle: 'compact', services: ['exterior'] });
  first.dirt = 1;
  s.queue.push(first);
  return s;
}
