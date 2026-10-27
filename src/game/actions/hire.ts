// Hiring, firing, the job board, bay assignment and support roles.
import type { GameState, SupportRoleId } from '../types';
import { STAFF, SUPPORT_ROLES } from '../data/staff';
import { refreshCandidates } from '../sim/staff';
import { autoAssignWorkers } from '../sim/bays';
import { produce, spend } from './produce';

export function hireWorker(s: GameState, p: { candidateId: number }): GameState {
  return produce(s, (d) => {
    const c = d.candidates.find((x) => x.id === p.candidateId);
    if (!c) return false;
    if (!spend(d, c.hireCost)) return false;
    d.candidates = d.candidates.filter((x) => x.id !== c.id);
    d.workers.push(c);
    d.stats.workersHired++;
    d.runStats.workersHired++;
    autoAssignWorkers(d);
    return true;
  });
}

export function fireWorker(s: GameState, p: { workerId: number }): GameState {
  return produce(s, (d) => {
    if (!d.workers.some((w) => w.id === p.workerId)) return false;
    d.workers = d.workers.filter((w) => w.id !== p.workerId);
    for (const b of d.bays) if (b.workerId === p.workerId) b.workerId = null;
    autoAssignWorkers(d);
    return true;
  });
}

export function refreshCost(s: GameState): number {
  return STAFF.refreshCost * (s.location + 1);
}

export function refreshBoard(s: GameState): GameState {
  return produce(s, (d) => {
    if (!spend(d, refreshCost(d))) return false;
    refreshCandidates(d);
    return true;
  });
}

/** Moves a worker to a bay. If the bay is taken, the two workers swap places. */
export function assignWorker(s: GameState, p: { workerId: number; bayId: number }): GameState {
  return produce(s, (d) => {
    const target = d.bays.find((b) => b.id === p.bayId);
    if (!target || target.isOwner) return false;
    if (!d.workers.some((w) => w.id === p.workerId)) return false;
    if (target.workerId === p.workerId) return false;
    const from = d.bays.find((b) => b.workerId === p.workerId);
    const displaced = target.workerId;
    target.workerId = p.workerId;
    if (from) from.workerId = displaced;
    return true;
  });
}

export function supportCost(id: SupportRoleId): number {
  return SUPPORT_ROLES.find((r) => r.id === id)?.hireCost ?? 0;
}

export function hireSupport(s: GameState, p: { id: SupportRoleId }): GameState {
  return produce(s, (d) => {
    const role = SUPPORT_ROLES.find((r) => r.id === p.id);
    if (!role || d.support[p.id] || d.location < role.minLocation) return false;
    if (!spend(d, role.hireCost)) return false;
    d.support[p.id] = true;
    return true;
  });
}
