// Closing the shop at night and opening the next day.
import type { DaySummary, GameState } from '../types';
import { CALENDAR } from '../data/economy';
import { SUPPORT_ROLES } from '../data/staff';
import { MARKETING_BY_ID } from '../data/marketing';
import { finishAllJobs } from './bays';
import { closeDayContracts, dailyContractOffers } from './contracts';
import { emptyDayStats } from './newGame';
import { rollTomorrow } from './weather';
import { refreshCandidates } from './staff';
import { planDailyEvents, removeEffect } from './events';
import { checkDayAchievements } from './achievements';
import { rentToday } from './economy';

export function closeDay(s: GameState): DaySummary {
  finishAllJobs(s);
  closeDayContracts(s);
  s.queue = [];
  removeEffect(s, 'viral');
  removeEffect(s, 'waterCut');

  const rent = rentToday(s);
  let wages = 0;
  for (const role of SUPPORT_ROLES) if (s.support[role.id]) wages += role.dailyWage;
  const marketing = s.socialActive ? MARKETING_BY_ID.social.cost * (s.location + 1) : 0;
  s.money -= rent + wages + marketing;
  const ds = s.dayStats;
  ds.rent += rent;
  ds.wages += wages;
  ds.marketing += marketing;

  const profit =
    ds.revenue +
    ds.tips -
    ds.commissions -
    ds.supplies -
    ds.rent -
    ds.wages -
    ds.marketing -
    ds.fines -
    ds.other;
  const summary: DaySummary = { ...ds, day: s.day, profit, repEnd: s.reputation };
  s.lastSummary = summary;
  s.stats.daysPlayed++;
  s.runStats.daysPlayed++;
  s.stats.bestDayProfit = Math.max(s.stats.bestDayProfit, profit);
  s.runStats.bestDayProfit = Math.max(s.runStats.bestDayProfit, profit);
  checkDayAchievements(s, summary);

  s.minute = CALENDAR.closeMinute;
  s.night = CALENDAR.nightSeconds;
  s.fx.push({ kind: 'dayEnd' });
  return summary;
}

export function startDay(s: GameState): void {
  const wasRain = s.weather === 'rain';
  s.day++;
  s.minute = CALENDAR.openMinute;
  s.night = 0;
  s.weather = s.tomorrowWeather;
  s.afterRain = wasRain && s.weather !== 'rain';
  rollTomorrow(s);
  refreshCandidates(s);
  planDailyEvents(s);
  s.vipTimer = 60;
  s.dayStats = emptyDayStats(s.reputation);
  dailyContractOffers(s);
  s.fx.push({ kind: 'dayStart' });
}
