// Core types for the game engine. Pure TypeScript, no React or DOM.

export type ServiceId =
  | 'exterior'
  | 'interior'
  | 'wheels'
  | 'wax'
  | 'engine'
  | 'headlights'
  | 'upholstery'
  | 'clay'
  | 'polish'
  | 'correction'
  | 'ceramic'
  | 'ppf';

export type VehicleId =
  'compact' | 'sedan' | 'suv' | 'pickup' | 'van' | 'sport' | 'luxury' | 'classic';

export type EquipmentId =
  | 'bucket'
  | 'pressureWasher'
  | 'vacuum'
  | 'wheelKit'
  | 'waxKit'
  | 'foamCannon'
  | 'engineKit'
  | 'headlightKit'
  | 'extractor'
  | 'clayKit'
  | 'orbitalPolisher'
  | 'rotaryPolisher'
  | 'inspectionLamps'
  | 'curingBooth'
  | 'ppfPlotter';

export type UpgradeId =
  | 'shampoo'
  | 'microfiber'
  | 'softWater'
  | 'waitingRoom'
  | 'coffeeWifi'
  | 'neonSign'
  | 'coveredQueue'
  | 'supervision'
  | 'cardTerminal'
  | 'awning'
  | 'cistern'
  | 'permits';

export type MarketingId =
  'flyers' | 'banner' | 'mapsProfile' | 'social' | 'influencer' | 'classicExpo';

export type TraitId =
  'fast' | 'perfectionist' | 'chatty' | 'earlyBird' | 'apprentice' | 'allTerrain';

export type WeatherId = 'sunny' | 'cloudy' | 'rain' | 'dust';

export type DirtLevel = 0 | 1 | 2;

export type PrestigeNodeId =
  | 'seedCapital'
  | 'inheritedTools'
  | 'school'
  | 'brand'
  | 'loyalty'
  | 'premiumPrice'
  | 'fastHands'
  | 'trustedPartner'
  | 'fleetContacts';

export type SupportRoleId = 'receptionist' | 'manager';

export type HandStep = 'soap' | 'rinse' | 'dry' | 'wax' | 'polish';

export interface Customer {
  id: number;
  name: string;
  vehicle: VehicleId;
  model: string;
  color: string;
  dirt: DirtLevel;
  services: ServiceId[];
  patience: number;
  waited: number;
  vip: boolean;
  contractId: number | null;
  seed: number;
  /** Extra service sold by the receptionist. */
  upsold: boolean;
  /** Influencer customers, used for stats only. */
  fromInfluencer: boolean;
}

export interface Job {
  customer: Customer;
  serviceIndex: number;
  /** Work seconds done on the current service. */
  progress: number;
  /** Work seconds needed by the current service. */
  duration: number;
  /** Quality accumulated per finished service, weighted by price. */
  qualitySum: number;
  qualityWeight: number;
  /** Seconds the customer waited in line before entering the bay. */
  waitUsed: number;
  /** Hand-wash state for the owner bay. */
  handActive: boolean;
  handDone: boolean;
  handQuality: number;
  /** Progress gained in the last tick, used for render interpolation. */
  lastDelta: number;
  /** Real seconds since the job started (for animations). */
  age: number;
}

export interface Bay {
  id: number;
  level: number;
  isOwner: boolean;
  workerId: number | null;
  job: Job | null;
  /** Taps counted in the current real second (rate limit). */
  tapsThisSecond: number;
  /** Visual tap boost timer for render. */
  tapFlash: number;
  /** Seconds since the bay became idle (for the fade of the finished car). */
  idleTime: number;
}

export interface Worker {
  id: number;
  name: string;
  level: number;
  xp: number;
  speed: number;
  quality: number;
  trait: TraitId;
  commission: number;
  hireCost: number;
  /** Cosmetic: skin tone index. */
  look: number;
  carsDone: number;
  /** Exponential average of XP per real second (for offline XP). */
  xpRate: number;
  xpThisSecond: number;
}

export interface Review {
  id: number;
  name: string;
  model: string;
  vehicle: VehicleId;
  stars: number;
  text: string;
  day: number;
}

export interface ContractOffer {
  id: number;
  templateId: string;
  client: string;
  vehicle: VehicleId;
  count: number;
  services: ServiceId[];
  days: number;
  payment: number;
  repBonus: number;
  /** Day the offer expires (absolute day). */
  expiresDay: number;
}

export interface ActiveContract extends ContractOffer {
  acceptedDay: number;
  deadlineDay: number;
  /** Real seconds of open time in the window, used to spread arrivals. */
  spawned: number;
  done: number;
  /** Seconds until next spawn. */
  spawnTimer: number;
}

export interface TimedEffect {
  id: 'flyers' | 'influencer' | 'viral' | 'waterCut';
  /** Remaining real seconds. */
  remaining: number;
  total: number;
}

export interface DayStats {
  revenue: number;
  tips: number;
  commissions: number;
  supplies: number;
  rent: number;
  wages: number;
  marketing: number;
  fines: number;
  other: number;
  carsServed: number;
  lost: number;
  angry: number;
  starsSum: number;
  starsCount: number;
  bestReview: Review | null;
  repStart: number;
  minRep: number;
}

export interface DaySummary extends DayStats {
  day: number;
  profit: number;
  repEnd: number;
}

export interface LifetimeStats {
  carsServed: number;
  totalEarned: number;
  tips: number;
  customersLost: number;
  angryCustomers: number;
  taps: number;
  muddyCars: number;
  classicsServed: number;
  contractsDone: number;
  contractsFailed: number;
  workersHired: number;
  handWashes: number;
  reviews: number;
  daysPlayed: number;
  playSeconds: number;
  bestDayProfit: number;
  franchises: number;
}

export interface Forecast {
  weather: WeatherId;
}

export interface Milestones {
  /** Real play seconds (this run) when each milestone was reached. */
  [key: string]: number;
}

export type FxEvent =
  | {
      kind: 'paid';
      bayId: number;
      amount: number;
      tip: number;
      stars: number;
      quality: number;
      customer: Customer;
    }
  | { kind: 'angry'; customer: Customer }
  | { kind: 'honk' }
  | { kind: 'arrive'; customerId: number }
  | { kind: 'review'; review: Review }
  | { kind: 'levelUp'; workerId: number }
  | { kind: 'achievement'; id: string }
  | { kind: 'unlockService'; id: ServiceId }
  | { kind: 'hint'; service: ServiceId }
  | { kind: 'dayEnd' }
  | { kind: 'dayStart' }
  | { kind: 'vip'; customerId: number }
  | { kind: 'event'; id: string }
  | { kind: 'contractDone'; id: number; success: boolean; client: string }
  | { kind: 'contractOffer' }
  | { kind: 'fine'; amount: number }
  | { kind: 'serviceStep'; bayId: number; service: ServiceId };

export interface GameState {
  version: number;
  seed: number;
  rng: number;
  nextId: number;

  money: number;
  reputation: number;

  /** Absolute day number, starting at 1. */
  day: number;
  /** Game minutes since midnight. */
  minute: number;
  /** Night transition remaining real seconds (0 when open). */
  night: number;
  weather: WeatherId;
  forecast: Forecast;
  /** Hidden true weather for tomorrow. */
  tomorrowWeather: WeatherId;
  afterRain: boolean;

  location: number;
  bays: Bay[];
  queue: Customer[];
  workers: Worker[];
  candidates: Worker[];
  support: Record<SupportRoleId, boolean>;

  equipment: Record<EquipmentId, number>;
  upgrades: Record<UpgradeId, number>;
  prices: Record<ServiceId, number>;

  marketingOwned: Record<MarketingId, boolean>;
  socialActive: boolean;
  effects: TimedEffect[];

  contractOffers: ContractOffer[];
  contracts: ActiveContract[];
  nextOfferDay: number;

  reviews: Review[];
  dayStats: DayStats;
  lastSummary: DaySummary | null;

  /** Net income per real second, ring buffer of the last 180 seconds. */
  incomeRing: number[];
  incomeRingPos: number;
  incomeSecondAcc: number;
  incomeSecondTimer: number;

  hintCooldown: number;
  /** Game minutes until the next VIP roll. */
  vipTimer: number;
  /** Planned daily events: game minute when they happen, or -1. */
  planned: { waterCut: number; inspector: number; viral: number };
  /** Seconds accumulator for once-per-second checks. */
  secondTimer: number;

  stats: LifetimeStats;
  runStats: LifetimeStats;
  achievements: string[];
  milestones: Milestones;

  prestige: {
    points: number;
    earnedTotal: number;
    nodes: Record<PrestigeNodeId, number>;
    expoUsed: boolean;
  };

  /** Transient: events for render and audio. Not saved. */
  fx: FxEvent[];
  /** Real timestamp (ms) when the state was last saved. */
  savedAt: number;
}
