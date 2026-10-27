// All player-facing text lives here (Mexican Spanish). Numbers come from data via parameters.
import type {
  EquipmentId,
  MarketingId,
  PrestigeNodeId,
  ServiceId,
  SupportRoleId,
  TraitId,
  UpgradeId,
  VehicleId,
  WeatherId,
} from '../types';
import { formatDuration, formatMoney, formatPercent } from '../format';
import {
  EQUIPMENT_BY_ID,
  EQUIPMENT_QUALITY_PER_LEVEL,
  EQUIPMENT_TIME_PER_LEVEL,
} from './equipment';
import { UPGRADE_EFFECTS as U } from './upgrades';
import { MANAGER, RECEPTIONIST, TRAIT_BY_ID } from './staff';
import { EVENTS, WEATHER_BY_ID } from './events';
import { MARKETING_BY_ID, SOCIAL_VIP_BONUS, MAPS_REVIEW_WEIGHT } from './marketing';

/** 0.15 -> "15" */
const pct = (ratio: number): number => Math.round(ratio * 100);
const lessPct = (mult: number): number => Math.round((1 - mult) * 100);
const morePct = (mult: number): number => Math.round((mult - 1) * 100);
const timeBonus = (id: EquipmentId): number => lessPct(EQUIPMENT_BY_ID[id].timeBonus?.mult ?? 1);
const qualityBonus = (id: EquipmentId): number =>
  morePct(EQUIPMENT_BY_ID[id].qualityBonus?.mult ?? 1);
const trait = (id: TraitId) => TRAIT_BY_ID[id];

export const S = {
  appName: 'Car Detailing Tycoon',
  tagline: 'De la cochera al imperio del detallado',

  tabs: {
    workshop: 'Taller',
    services: 'Servicios',
    staff: 'Personal',
    upgrades: 'Mejoras',
    marketing: 'Promo',
    business: 'Negocio',
  },

  tabTitles: {
    workshop: 'Tu taller',
    services: 'Servicios y precios',
    staff: 'Tu equipo de trabajo',
    upgrades: 'Equipo y mejoras',
    marketing: 'Publicidad',
    business: 'Tu negocio',
  },

  services: {
    exterior: { name: 'Lavado exterior', short: 'Exterior' },
    interior: { name: 'Aspirado interior', short: 'Aspirado' },
    wheels: { name: 'Rines y llantas', short: 'Rines' },
    wax: { name: 'Encerado', short: 'Cera' },
    engine: { name: 'Lavado de motor', short: 'Motor' },
    headlights: { name: 'Restauración de faros', short: 'Faros' },
    upholstery: { name: 'Lavado de vestiduras', short: 'Vestiduras' },
    clay: { name: 'Descontaminado (clay)', short: 'Clay' },
    polish: { name: 'Pulido', short: 'Pulido' },
    correction: { name: 'Corrección de pintura', short: 'Corrección' },
    ceramic: { name: 'Recubrimiento cerámico', short: 'Cerámico' },
    ppf: { name: 'PPF (película protectora)', short: 'PPF' },
  } satisfies Record<ServiceId, { name: string; short: string }>,

  packages: {
    basic: 'Básico',
    complete: 'Completo',
    premium: 'Premium',
    showroom: 'Showroom',
  },

  vehicles: {
    compact: 'Compacto',
    sedan: 'Sedán',
    suv: 'SUV',
    pickup: 'Pickup',
    van: 'Van',
    sport: 'Deportivo',
    luxury: 'Lujo',
    classic: 'Clásico',
  } satisfies Record<VehicleId, string>,

  dirt: ['Poco sucio', 'Sucio', 'Lodoso'] as const,

  equipment: {
    bucket: { name: 'Cubeta y franela', desc: 'Lo básico para lavar a mano.' },
    pressureWasher: {
      name: 'Hidrolavadora',
      desc: `−${timeBonus('pressureWasher')}% de tiempo en Lavado exterior.`,
    },
    vacuum: { name: 'Aspiradora', desc: 'Desbloquea Aspirado interior.' },
    wheelKit: { name: 'Kit de rines', desc: 'Desbloquea Rines y llantas.' },
    waxKit: { name: 'Kit de cera', desc: 'Desbloquea Encerado.' },
    foamCannon: {
      name: 'Cañón de espuma',
      desc: `+${qualityBonus('foamCannon')}% de calidad y −${timeBonus('foamCannon')}% de tiempo en Exterior.`,
    },
    engineKit: { name: 'Equipo de motor', desc: 'Desbloquea Lavado de motor.' },
    headlightKit: { name: 'Kit de faros', desc: 'Desbloquea Restauración de faros.' },
    extractor: { name: 'Extractora', desc: 'Desbloquea Lavado de vestiduras.' },
    clayKit: { name: 'Kit de clay', desc: 'Desbloquea Descontaminado.' },
    orbitalPolisher: { name: 'Pulidora orbital', desc: 'Desbloquea Pulido.' },
    rotaryPolisher: { name: 'Pulidora rotativa', desc: 'Necesaria para Corrección de pintura.' },
    inspectionLamps: {
      name: 'Lámparas de inspección',
      desc: `Necesarias para Corrección y +${qualityBonus('inspectionLamps')}% de calidad en Pulido.`,
    },
    curingBooth: { name: 'Cabina de curado', desc: 'Desbloquea Recubrimiento cerámico.' },
    ppfPlotter: { name: 'Plotter de PPF', desc: 'Desbloquea PPF.' },
  } satisfies Record<EquipmentId, { name: string; desc: string }>,

  upgrades: {
    shampoo: {
      name: 'Shampoo premium',
      unit: (lvl: number) => `+${pct(lvl * U.shampooQuality)}% de calidad`,
    },
    microfiber: {
      name: 'Microfibras de calidad',
      unit: (lvl: number) =>
        `+${pct(lvl * U.microfiberQuality)}% calidad y −${pct(lvl * U.microfiberTime)}% tiempo en exterior`,
    },
    softWater: {
      name: 'Agua suavizada',
      unit: (lvl: number) => `+${pct(lvl * U.softWaterQuality)}% de calidad en exterior`,
    },
    waitingRoom: {
      name: 'Sala de espera',
      unit: (lvl: number) => `+${pct(lvl * U.waitingRoomPatience)}% de paciencia`,
    },
    coffeeWifi: {
      name: 'Café y Wi-Fi',
      unit: (lvl: number) =>
        `+${pct(lvl * U.coffeeTips)}% propinas y +${pct(lvl * U.coffeePatience)}% paciencia`,
    },
    neonSign: {
      name: 'Letrero luminoso',
      unit: (lvl: number) => `+${pct(lvl * U.neonArrivals)}% de llegadas`,
    },
    coveredQueue: {
      name: 'Fila techada',
      unit: (lvl: number) =>
        `+${lvl * U.coveredQueueSlots} lugar${lvl * U.coveredQueueSlots === 1 ? '' : 'es'} en la fila`,
    },
    supervision: {
      name: 'Supervisión',
      unit: (lvl: number) => `+${pct(lvl * U.supervisionTap)}% de poder por toque`,
    },
    cardTerminal: {
      name: 'Terminal de pago con tarjeta',
      unit: () => `+${pct(U.terminalVip)}% de clientes VIP y +${pct(U.terminalTips)}% de propinas`,
    },
    awning: {
      name: 'Toldo',
      unit: () =>
        `La lluvia baja las llegadas ${pct(U.awningRainPenalty)}% en vez de ${lessPct(WEATHER_BY_ID.rain.arrivals)}%`,
    },
    cistern: { name: 'Cisterna', unit: () => 'Inmune a los cortes de agua' },
    permits: { name: 'Papeles en regla', unit: () => 'Sin multas del inspector' },
  } satisfies Record<UpgradeId, { name: string; unit: (lvl: number) => string }>,

  marketing: {
    flyers: {
      name: 'Volantes en la colonia',
      desc: (p: number, secs: number) => `+${p}% de llegadas por ${formatDuration(secs)}`,
    },
    banner: { name: 'Lona en la entrada', desc: (p: number) => `+${p}% de llegadas para siempre` },
    mapsProfile: {
      name: 'Perfil en mapas',
      desc: (p: number) =>
        `+${p}% de llegadas y las reseñas pesan ${morePct(MAPS_REVIEW_WEIGHT)}% más`,
    },
    social: {
      name: 'Campaña en redes',
      desc: (p: number) =>
        `+${p}% de llegadas y +${pct(SOCIAL_VIP_BONUS)}% de VIP. Se cobra cada cierre`,
    },
    influencer: {
      name: 'Influencer automotriz',
      desc: (p: number, secs: number) =>
        `+${p}% de llegadas por ${formatDuration(secs)} y llegan deportivos`,
    },
    classicExpo: {
      name: 'Expo de autos clásicos',
      desc: () => 'Desbloquea los clásicos sin importar tu reputación. Una vez por partida',
    },
  } satisfies Record<MarketingId, { name: string; desc: (pct: number, secs: number) => string }>,

  traits: {
    fast: { name: 'Rápido', desc: `+${morePct(trait('fast').speedMult)}% de velocidad` },
    perfectionist: {
      name: 'Perfeccionista',
      desc: `+${morePct(trait('perfectionist').qualityMult)}% calidad, −${lessPct(trait('perfectionist').speedMult)}% velocidad`,
    },
    chatty: { name: 'Platicador', desc: `+${morePct(trait('chatty').tipMult)}% de propinas` },
    earlyBird: {
      name: 'Madrugador',
      desc: `+${morePct(trait('earlyBird').morningSpeed)}% de velocidad de 8:00 a 11:00`,
    },
    apprentice: {
      name: 'Aprendiz',
      desc: `Aprende ${morePct(trait('apprentice').xpMult)}% más rápido`,
    },
    allTerrain: { name: 'Todo terreno', desc: 'Los lodosos no lo frenan' },
  } satisfies Record<TraitId, { name: string; desc: string }>,

  support: {
    receptionist: {
      name: 'Recepcionista',
      desc: `+${morePct(RECEPTIONIST.patienceMult)}% de paciencia y ${pct(RECEPTIONIST.upsellChance)}% de probabilidad de vender un servicio extra.`,
    },
    manager: {
      name: 'Gerente',
      desc: `+${pct(MANAGER.offlineEfficiency)}% de ganancia sin conexión, +${MANAGER.offlineCapHours} h de tope y acelera todas las bahías.`,
    },
  } satisfies Record<SupportRoleId, { name: string; desc: string }>,

  locations: [
    {
      name: 'La cochera de tu casa',
      short: 'Cochera',
      desc: 'Concreto con manchas de aceite, un foco cálido y tus cubetas.',
    },
    {
      name: 'Local en la colonia',
      short: 'Local',
      desc: 'Piso de mosaico, lámparas fluorescentes y letrero pintado a mano.',
    },
    {
      name: 'Nave en avenida',
      short: 'Nave',
      desc: 'Piso epóxico, tiras LED y señalización amarilla.',
    },
    {
      name: 'Estudio de detallado premium',
      short: 'Estudio',
      desc: 'Epóxico negro brillante y techo de luces hexagonales.',
    },
  ] as const,

  weather: {
    sunny: 'Soleado',
    cloudy: 'Nublado',
    rain: 'Lluvia',
    dust: 'Tolvanera',
  } satisfies Record<WeatherId, string>,

  weekdays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const,
  months: [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ] as const,

  hud: {
    perMinute: (v: string) => `${v}/min`,
    day: (day: number, weekday: string, clock: string) => `Día ${day} · ${weekday} · ${clock}`,
    forecastTitle: 'Pronóstico de mañana',
    forecastNote: `Acierta ${pct(EVENTS.forecastAccuracy)}% de las veces.`,
    today: 'Hoy',
    debt: 'Deuda',
    mute: 'Silenciar',
    unmute: 'Activar sonido',
    settings: 'Ajustes',
    closed: 'Cerrado',
  },

  modifiers: {
    rain: 'Lluvia',
    dust: 'Tolvanera',
    afterRain: 'Después de la lluvia',
    weekend: 'Fin de semana',
    payday: 'Quincena',
    buenFin: 'Buen Fin',
    aguinaldo: 'Aguinaldo',
    waterCut: 'Corte de agua',
    viral: 'Reseña viral',
    flyers: 'Volantes',
    influencer: 'Influencer',
    social: 'Campaña en redes',
    arrivals: (pct: number) => `${pct > 0 ? '+' : ''}${pct}% llegadas`,
    fairDown: (pct: number) => `precio justo −${pct}%`,
    restOfDay: 'resto del día',
    allDay: 'todo el día',
    noWater: 'sin exterior, motor ni vestiduras',
    vipChance: (p: number) => `+${p}% VIP`,
  },

  workshop: {
    queue: 'Fila',
    queueEmpty: 'Nadie en la fila… por ahora',
    yourBay: 'Tu bahía',
    bay: (n: number) => `Bahía ${n}`,
    emptyBay: 'Sin trabajador',
    hireHint: 'Contrata en Personal',
    waiting: 'Esperando cliente',
    tapToWash: 'Toca para lavar',
    hurry: '¡Ándale!',
    honk: '¡Piiip!',
    owner: 'Tú',
    buyBay: 'Comprar bahía',
    bays: 'Bahías',
    bayLevel: (lvl: number) => `Nivel ${lvl}`,
    baySpeed: (pct: number) => `+${pct}% de velocidad`,
    maxBays: 'Ya tienes todas las bahías de este local',
    moveForMore: 'Múdate para tener más bahías',
    reject: 'Rechazar',
    rejectNote: (stars: string) => `Haces lugar en la fila (−${stars} estrellas)`,
    reviews: 'Reseñas recientes',
    noReviews: 'Todavía no hay reseñas. ¡A lavar!',
    contracts: 'Contratos de flotilla',
    activeContracts: 'Contratos activos',
    offers: 'Ofertas',
    noOffers: (days: number) => `Llega una oferta nueva cada ${days} días.`,
    contractsLocked: (loc: string) => `Los contratos llegan cuando te mudes al ${loc}.`,
    patience: 'Paciencia',
    customerTicket: 'Ticket del cliente',
    worker: 'Trabajador',
    timeLeft: 'Tiempo restante',
    services: 'Servicios',
    noJob: 'Bahía libre',
    contractTag: 'Contrato',
    vipTag: 'VIP',
    cantServe: 'Nadie de tu equipo puede hacer este pedido todavía',
    detailTitle: 'Detalle de la bahía',
    assignWorker: 'Asignar trabajador',
    level: 'Nivel',
    upgrade: 'Mejorar',
  },

  scrub: {
    title: 'Lavado a mano',
    steps: {
      soap: { name: 'Enjabonar', hint: 'Talla todo el carro con la esponja' },
      rinse: { name: 'Enjuagar', hint: 'Quita toda la espuma con agua' },
      dry: { name: 'Secar', hint: 'Seca las gotas con la franela' },
      wax: { name: 'Encerar', hint: 'Aplica la cera en círculos' },
      polish: { name: 'Pulir', hint: 'Borra las marcas de remolino' },
    },
    autoFinish: 'Que se termine solo',
    stepOf: (n: number, total: number) => `Paso ${n} de ${total}`,
    done: '¡Quedó rechinando!',
    quality: (pct: number) => `Calidad ${pct}%`,
    remaining: 'Los demás servicios se terminan solos',
    noHandSteps: 'Este pedido no se lava a mano: tu bahía lo termina sola',
  },

  services_tab: {
    locked: 'Bloqueado',
    needs: (what: string) => `Necesitas: ${what}`,
    needsLevel: (lvl: number) => `Trabajador nivel ${lvl}+`,
    needsLocation: (loc: string) => `Disponible desde ${loc}`,
    price: 'Tu precio',
    fair: 'Precio justo',
    demand: 'Demanda',
    demandLevels: { high: 'Alta', mid: 'Media', low: 'Baja' },
    perHour: 'Ingreso estimado',
    perHourValue: (v: string) => `${v}/h`,
    basePct: (pct: number) => `${pct}% del precio base`,
    hint: 'Si cobras de más, llegan menos clientes. Si cobras de menos, se llena la fila pero ganas menos.',
    unlocked: 'Disponible',
    fairMark: 'Justo',
  },

  staff: {
    employees: 'Empleados',
    noEmployees: 'Todavía no tienes empleados. Contrata a alguien en la bolsa de trabajo.',
    jobBoard: 'Bolsa de trabajo',
    refresh: (cost: string) => `Nuevos candidatos · ${cost}`,
    refreshFree: 'Se renueva cada día',
    hire: 'Contratar',
    fire: 'Despedir',
    fireConfirm: (name: string) => `¿Seguro que quieres despedir a ${name}?`,
    fireYes: 'Sí, despedir',
    cancel: 'Cancelar',
    train: 'Curso',
    trainFull: 'Nivel máximo',
    speed: 'Velocidad',
    quality: 'Calidad',
    commission: 'Comisión',
    level: (lvl: number) => `Nv ${lvl}`,
    xp: 'Experiencia',
    bayLabel: (n: number) => `Bahía ${n}`,
    bench: 'En espera',
    assign: 'Mover a bahía',
    supportRoles: 'Roles de apoyo',
    wage: (v: string) => `${v} diarios`,
    hired: 'Contratado',
    supportLocked: (loc: string) => `Disponible desde ${loc}`,
    hireCost: 'Contratación',
    noBay: 'No hay bahía libre: compra una o mueve a alguien',
    carsDone: (n: number) => `${n} autos`,
  },

  upgradesTab: {
    equipment: 'Equipo',
    business: 'Mejoras del negocio',
    owned: 'Comprado',
    max: 'Máximo',
    buy: 'Comprar',
    improve: 'Mejorar',
    levelOf: (lvl: number, max: number) => `Nv ${lvl}/${max}`,
    perLevel: `−${lessPct(EQUIPMENT_TIME_PER_LEVEL)}% tiempo y +${pct(EQUIPMENT_QUALITY_PER_LEVEL)}% calidad por nivel`,
    requires: (what: string) => `Requiere ${what}`,
    needsLocation: (loc: string) => `Requiere ${loc}`,
    unlocks: (what: string) => `Desbloquea: ${what}`,
    affordable: 'Te alcanza',
    current: 'Ahora',
    next: 'Siguiente',
  },

  marketingTab: {
    active: 'Activa',
    owned: 'Comprada',
    subscribe: 'Activar',
    unsubscribe: 'Cancelar',
    launch: 'Lanzar',
    perDay: (v: string) => `${v} por día`,
    remaining: (t: string) => `Quedan ${t}`,
    used: 'Ya la usaste en esta partida',
    needsLocation: (loc: string) => `Disponible desde ${loc}`,
    hint: 'La publicidad trae más clientes. Úsala cuando tengas bahías libres.',
  },

  business: {
    locations: 'Locales',
    current: 'Aquí estás',
    move: 'Mudarme',
    moveCost: 'Mudanza',
    rent: (v: string) => `Renta ${v}/día`,
    baysQueue: (bays: number, queue: number) => `${bays} bahías · ${queue} en fila`,
    arrival: (secs: string) => `1 cliente cada ${secs} s`,
    stats: 'Estadísticas',
    achievements: 'Logros',
    achievementsCount: (n: number, total: number) => `${n} de ${total}`,
    achievementBonus: (pct: number) => `+${pct}% de ingresos por logros`,
    franchise: 'Franquicia',
    franchiseLocked: (loc: string) => `Se desbloquea con el ${loc}.`,
    franchiseCta: 'Franquiciar',
    pfNow: (n: number) => `Recibirías ${n} PF`,
    pfHave: (n: number) => `Tienes ${n} PF para gastar`,
    pfBonus: (pct: number) => `+${pct}% de ingresos por PF ganados`,
    tree: 'Árbol de franquicia',
    buyNode: 'Mejorar',
    nodeCost: (n: number) => `${n} PF`,
    lockedLocation: 'Bloqueado',
  },

  statsLabels: {
    carsServed: 'Autos atendidos',
    totalEarned: 'Ganancias totales',
    tips: 'Propinas',
    customersLost: 'Clientes perdidos',
    angryCustomers: 'Clientes enojados',
    taps: 'Toques',
    muddyCars: 'Autos lodosos',
    contractsDone: 'Contratos cumplidos',
    workersHired: 'Contrataciones',
    handWashes: 'Lavados a mano',
    daysPlayed: 'Días trabajados',
    playSeconds: 'Tiempo jugado',
    bestDayProfit: 'Mejor día',
    franchises: 'Franquicias',
    thisRun: 'Esta partida',
    allTime: 'Historia',
  },

  achievements: {
    firstCustomer: { name: 'Primer cliente', desc: 'Atiende a tu primer cliente.' },
    cars10: { name: 'Ya agarraste vuelo', desc: 'Atiende 10 autos.' },
    cars100: { name: 'Cien relucientes', desc: 'Atiende 100 autos.' },
    cars1000: { name: 'Mil carros', desc: 'Atiende 1,000 autos.' },
    cars10000: { name: 'Leyenda del trapo', desc: 'Atiende 10,000 autos.' },
    firstHire: { name: 'Ya no estás solo', desc: 'Contrata a tu primer empleado.' },
    staff10: { name: 'Equipazo', desc: 'Ten 10 empleados al mismo tiempo.' },
    million: { name: 'Primer millón', desc: 'Gana $1,000,000 en total.' },
    billion: { name: 'Mil millones', desc: 'Gana $1,000,000,000 en total.' },
    rep49Day: { name: 'Intachable', desc: 'Mantén 4.9 estrellas o más todo un día.' },
    noLostDay: { name: 'Nadie se fue', desc: 'Un día con 10+ autos sin perder clientes.' },
    muddy100: { name: 'Rey del lodo', desc: 'Lava 100 autos lodosos.' },
    firstClassic: { name: 'Joya de colección', desc: 'Atiende tu primer clásico.' },
    firstContract: { name: 'Trato hecho', desc: 'Cumple tu primer contrato.' },
    contracts10: { name: 'Flotillero', desc: 'Cumple 10 contratos.' },
    allServices: { name: 'Hacemos de todo', desc: 'Desbloquea los 12 servicios.' },
    location2: { name: 'Local propio', desc: 'Múdate al Local en la colonia.' },
    location3: { name: 'Sobre avenida', desc: 'Múdate a la Nave en avenida.' },
    location4: { name: 'Estudio premium', desc: 'Múdate al Estudio de detallado premium.' },
    firstFranchise: { name: 'Franquiciado', desc: 'Franquicia tu negocio por primera vez.' },
    taps1000: { name: 'Dedo veloz', desc: 'Toca las bahías 1,000 veces.' },
    handWash50: { name: 'A la antigüita', desc: 'Lava 50 autos a mano.' },
    fiveStars: { name: 'Cinco estrellas', desc: 'Recibe una reseña de 5 estrellas.' },
    tips10k: { name: 'Buena propina', desc: 'Junta $10,000 en propinas.' },
    bigDay: { name: 'Día redondo', desc: 'Ten un día con $100,000 de utilidad.' },
  } as Record<string, { name: string; desc: string }>,

  prestigeNodes: {
    seedCapital: {
      name: 'Capital semilla',
      desc: (lvl: number, v: number) =>
        lvl === 0 ? 'Empiezas con dinero extra' : `Empiezas con ${formatMoney(v)}`,
    },
    inheritedTools: {
      name: 'Herramienta heredada',
      desc: (lvl: number) =>
        [
          'Empiezas con equipo comprado',
          'Hidrolavadora y Aspiradora',
          '+ Kit de cera y Cañón de espuma',
          '+ Extractora y Kit de clay',
        ][lvl] ?? '',
    },
    school: {
      name: 'Escuela de detallado',
      desc: (lvl: number) => `Candidatos con +${lvl} nivel${lvl === 1 ? '' : 'es'}`,
    },
    brand: { name: 'Marca reconocida', desc: (lvl: number) => `+${lvl * 5}% de llegadas` },
    loyalty: { name: 'Clientela fiel', desc: (lvl: number) => `+${lvl * 5}% de paciencia` },
    premiumPrice: { name: 'Precio premium', desc: (lvl: number) => `+${lvl * 4}% al precio justo` },
    fastHands: { name: 'Manos rápidas', desc: (lvl: number) => `+${lvl * 4}% de velocidad` },
    trustedPartner: {
      name: 'Socio de confianza',
      desc: (lvl: number) => `+${lvl * 2} h de tope y +${lvl * 15}% de ganancia sin conexión`,
    },
    fleetContacts: {
      name: 'Contactos de flotillas',
      desc: (lvl: number) =>
        lvl === 0
          ? 'Contratos desde la cochera'
          : `Contratos desde la cochera y +${lvl * 20}% de pago`,
    },
  } satisfies Record<PrestigeNodeId, { name: string; desc: (lvl: number, v: number) => string }>,

  franchise: {
    title: 'Franquiciar tu negocio',
    intro: 'Vendes la franquicia y empiezas de cero, pero con ventajas para siempre.',
    lose: 'Lo que pierdes',
    loseItems: ['Dinero', 'Local', 'Equipo', 'Personal', 'Mejoras', 'Publicidad'],
    keep: 'Lo que conservas',
    keepItems: [
      'Puntos de Franquicia (PF)',
      'Árbol de franquicia',
      'Logros',
      'Estadísticas históricas',
    ],
    receive: (n: number) => `Recibes ${n} PF`,
    bonus: (pct: number) => `Tus ingresos suben +${pct}% para siempre`,
    confirm1: 'Quiero franquiciar',
    confirm2: '¿Seguro? Esto no se puede deshacer',
    confirmYes: 'Sí, franquiciar',
    notYet: 'Todavía no',
    needMore: 'Necesitas ganar más para recibir al menos 1 PF.',
    welcome: '¡Nueva franquicia!',
  },

  daySummary: {
    title: (day: number) => `Resumen del día ${day}`,
    revenue: 'Ingresos',
    tips: 'Propinas',
    commissions: 'Comisiones',
    supplies: 'Insumos',
    rent: 'Renta',
    wages: 'Sueldos',
    marketing: 'Publicidad',
    fines: 'Multas',
    other: 'Otros gastos',
    profit: 'Utilidad',
    cars: 'Autos atendidos',
    lost: 'Clientes perdidos',
    rating: 'Calificación del día',
    bestReview: 'Mejor reseña',
    autoClose: (s: number) => `Se cierra en ${s} s`,
    close: 'Seguir',
    night: 'Cerrando el taller…',
    goodMorning: '¡Buenos días!',
  },

  offline: {
    title: 'Mientras no estabas',
    away: (t: string) => `Estuviste fuera ${t}`,
    earned: 'Tu equipo ganó',
    efficiency: (pct: number) => `Eficiencia sin conexión: ${pct}%`,
    collect: 'Cobrar',
  },

  contracts: {
    vehicles: (n: number, v: string) => `${n} × ${v}`,
    deadline: (d: number) => `Plazo: ${d} día${d === 1 ? '' : 's'}`,
    pay: 'Pago',
    rep: (v: string) => `+${v} ★ al cumplir`,
    accept: 'Aceptar',
    expires: 'Expira hoy',
    progress: (done: number, total: number) => `${done} de ${total} listos`,
    dueIn: (d: number) => (d <= 0 ? 'Vence hoy' : `Vence en ${d} día${d === 1 ? '' : 's'}`),
    success: (client: string) => `¡Contrato cumplido con ${client}!`,
    fail: (client: string) => `Fallaste el contrato con ${client}`,
    newOffer: 'Llegó una oferta de flotilla',
    cantDo: 'Te falta equipo o personal para este contrato',
  },

  events: {
    waterCutStart: 'Corte de agua: no hay exterior, motor ni vestiduras',
    waterCutEnd: 'Ya regresó el agua',
    pipe: (cost: string) => `Pedir pipa · ${cost}`,
    inspector: (v: string) => `Vino el inspector: multa de ${v}`,
    inspectorOk: 'Vino el inspector y todo estaba en regla',
    viral: '¡Una reseña tuya se hizo viral!',
    vip: '¡Llegó un cliente VIP!',
    vipHappy: 'El VIP quedó encantado',
    vipSad: 'El VIP no quedó contento',
    hint: (service: string) => `Un cliente quería ${service}`,
    angry: 'Un cliente se fue enojado',
    honk: 'Fila llena: un cliente se siguió de largo',
  },

  toasts: {
    bought: (name: string) => `¡Compraste ${name}!`,
    hired: (name: string) => `¡${name} se une al equipo!`,
    levelUp: (name: string, lvl: number) => `${name} subió a nivel ${lvl}`,
    achievement: (name: string) => `Logro: ${name}`,
    unlockService: (name: string) => `¡Nuevo servicio: ${name}!`,
    noMoney: 'No te alcanza todavía',
    debt: 'Tienes deuda: no puedes comprar hasta pagarla',
    saved: 'Partida guardada',
    corruptSave: 'Tu partida guardada estaba dañada. Guardamos una copia y empezamos de nuevo.',
    imported: 'Partida importada',
    importError: 'Ese código no es una partida válida',
    copied: 'Código copiado',
    moved: (name: string) => `¡Bienvenido a ${name}!`,
  },

  celebrations: {
    service: '¡Nuevo servicio!',
    location: '¡Nuevo local!',
    achievement: '¡Logro desbloqueado!',
    franchise: '¡Franquicia lista!',
    tapToContinue: 'Toca para continuar',
  },

  moving: {
    title: 'De mudanza…',
    arrived: (name: string) => `¡Bienvenido a ${name}!`,
  },

  buttons: {
    missing: (v: string) => `Te faltan ${v}`,
    debt: 'Paga tu deuda primero',
    close: 'Cerrar',
    ok: '¡Va!',
    back: 'Regresar',
    max: 'Al máximo',
  },

  settings: {
    title: 'Ajustes',
    sound: 'Sonido',
    vibration: 'Vibración',
    daySummary: 'Resumen al final del día',
    reducedMotion: 'Movimiento reducido',
    install: 'Instalar en mi celular',
    installAndroid: 'Toca "Instalar" en el aviso del navegador.',
    installIosTitle: 'Instalar en iPhone',
    installIos: [
      'Abre el juego en Safari.',
      'Toca el botón Compartir (el cuadrito con flecha hacia arriba).',
      'Elige "Agregar a pantalla de inicio".',
      'Toca "Agregar" y listo: ábrelo desde tu pantalla de inicio.',
    ],
    installOther:
      'En tu navegador, abre el menú y elige "Agregar a pantalla de inicio" o "Instalar app".',
    installed: 'Ya está instalado',
    exportSave: 'Exportar partida',
    exportHint: 'Copia este código y guárdalo en un lugar seguro.',
    copy: 'Copiar',
    importSave: 'Importar partida',
    importHint: 'Pega aquí el código de tu partida.',
    importDo: 'Importar',
    reset: 'Reiniciar partida',
    resetConfirm1: 'Vas a borrar todo tu progreso.',
    resetConfirm2: '¿De verdad? No hay vuelta atrás.',
    resetYes: 'Sí, borrar todo',
    credits: 'Créditos',
    creditsText: [
      'Car Detailing Tycoon',
      'Diseño, código, arte y sonido hechos con código.',
      'Fuentes: Russo One e Inter (licencia SIL Open Font).',
      'Íconos: Lucide (licencia ISC).',
      'Hecho con cariño para los que dejan su carro rechinando.',
    ],
    tutorialReplay: 'Ver tutorial otra vez',
  },

  tutorial: {
    welcome: 'Bienvenido a tu cochera. Empiezas con una cubeta y una franela.',
    firstCustomer: '¡Llegó tu primer cliente! Toca el auto en Tu bahía para lavarlo.',
    scrub: 'Arrastra el dedo sobre el auto para tallarlo.',
    firstPay: (cost: string) => `¡Tu primer cliente! Junta ${cost} para la Hidrolavadora.`,
    buyWasher: '¡Ya te alcanza! Abre Mejoras y compra la Hidrolavadora.',
    hire: 'Contrata a tu primer ayudante para que lave aunque tú no estés.',
    prices: 'Ajusta tus precios: si cobras de más, llegan menos clientes.',
    goal: 'Tu meta: convertir esta cochera en el mejor estudio de detallado de la ciudad.',
    skip: 'Saltar tutorial',
    next: '¡Vamos!',
  },

  rotate: {
    title: 'Gira tu celular',
    text: 'Este juego se juega en vertical.',
  },

  debug: {
    title: 'Debug',
    money: 'Dinero',
    time: 'Tiempo',
    hour: '+1 hora',
    day: '+1 día',
    speed: 'Velocidad',
    events: 'Eventos',
    rain: 'Lluvia',
    waterCut: 'Corte de agua',
    vip: 'VIP',
    viral: 'Viral',
    inspector: 'Inspector',
    offer: 'Contrato',
    unlockAll: 'Desbloquear todo',
    fill: 'Llenar fila',
    reset: 'Reiniciar',
    location: 'Local',
  },

  quality: (pct: number) => `Calidad ${pct}%`,
  income: (v: string) => `+${v}`,
  percent: (r: number) => formatPercent(r),
  marketingPct: (id: MarketingId) => pct(MARKETING_BY_ID[id].arrivals),
} as const;

export function serviceName(id: ServiceId): string {
  return S.services[id].name;
}

export function equipmentName(id: EquipmentId): string {
  return S.equipment[id].name;
}

export function locationName(index: number): string {
  return S.locations[index]?.name ?? '';
}
