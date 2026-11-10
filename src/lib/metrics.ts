import type { Hire, Owner } from '@/types/domain';
import { DEMO_TODAY } from './dates';
import { blockedDays, checkinDueDate, isPastDue, progressOf, rootBlocker, taskStatus } from './journey';

/**
 * HR dashboard metrics (F4). Always computed from data, never written by hand
 * (CLAUDE.md section 7). Every function is pure and takes `today` for testing.
 */

/** Alert threshold: a task blocked for more than this many days raises an alert. */
export const BLOCKED_ALERT_DAYS = 3;

export const OWNERS: Owner[] = ['hire', 'manager', 'buddy', 'hr', 'it', 'facilities'];

export function activeHires(hires: Hire[]): Hire[] {
  return hires.filter((h) => h.status === 'active');
}

export interface Kpis {
  activeHires: number;
  /** % of tasks due up to today that were completed on or before their due date. */
  onTimeRate: number;
  /** Active journeys with at least one overdue task. */
  delayedJourneys: number;
  /** Average progress (0 to 100) of active journeys. */
  averageProgress: number;
}

export function kpis(hires: Hire[], today = DEMO_TODAY): Kpis {
  const active = activeHires(hires);
  const tracked = hires.filter((h) => h.status !== 'upcoming');
  const dueTasks = tracked.flatMap((h) => h.tasks).filter((t) => t.dueDate < today);
  const onTime = dueTasks.filter((t) => t.status === 'done' && t.completedAt && t.completedAt.slice(0, 10) <= t.dueDate);

  return {
    activeHires: active.length,
    onTimeRate: dueTasks.length ? (onTime.length / dueTasks.length) * 100 : 100,
    delayedJourneys: active.filter((h) => h.tasks.some((t) => isPastDue(t, today))).length,
    averageProgress: active.length
      ? active.reduce((sum, h) => sum + progressOf(h.tasks).percent, 0) / active.length
      : 0,
  };
}

export interface HireProgressPoint {
  hireId: string;
  personId: string;
  percent: number;
}

/** Progress per active journey, highest first. */
export function progressByHire(hires: Hire[]): HireProgressPoint[] {
  return activeHires(hires)
    .map((h) => ({ hireId: h.id, personId: h.personId, percent: progressOf(h.tasks).percent }))
    .sort((a, b) => b.percent - a.percent);
}

export interface CohortPoint {
  /** `YYYY-MM` of the start date. */
  cohort: string;
  hires: number;
  averageProgress: number;
}

/** Average progress by start month (active and completed journeys). */
export function progressByCohort(hires: Hire[]): CohortPoint[] {
  const groups = new Map<string, Hire[]>();
  for (const hire of hires.filter((h) => h.status !== 'upcoming')) {
    const key = hire.startDate.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), hire]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cohort, group]) => ({
      cohort,
      hires: group.length,
      averageProgress: group.reduce((sum, h) => sum + progressOf(h.tasks).percent, 0) / group.length,
    }));
}

/**
 * Overdue tasks per responsible owner in active journeys, to spot bottlenecks such as IT.
 * A task that is overdue because it is blocked counts for the owner of the task that
 * blocks it (the root of the chain), not for the person who is waiting (D-30).
 */
export function overdueByOwner(hires: Hire[], today = DEMO_TODAY): Record<Owner, number> {
  const counts = Object.fromEntries(OWNERS.map((o) => [o, 0])) as Record<Owner, number>;
  for (const hire of activeHires(hires)) {
    for (const task of hire.tasks) {
      if (isPastDue(task, today)) counts[rootBlocker(task, hire.tasks).owner] += 1;
    }
  }
  return counts;
}

export type AlertKind = 'overdue_tasks' | 'checkin_escalated' | 'checkin_overdue' | 'task_blocked';

export interface Alert {
  id: string;
  kind: AlertKind;
  hireId: string;
  /** Number of overdue tasks, days blocked, or days a check-in is late. */
  count: number;
  /** Related check-in or task id, when there is one. */
  refId?: string;
  /** Severity for ordering: escalations and blocked work first. */
  priority: number;
}

/** Alerts of the HR dashboard. Each one links to the hire record (A4). */
export function alerts(hires: Hire[], today = DEMO_TODAY): Alert[] {
  const list: Alert[] = [];

  for (const hire of activeHires(hires)) {
    for (const checkin of hire.checkins) {
      if (checkin.action?.type === 'escalate') {
        list.push({ id: `${checkin.id}-escalated`, kind: 'checkin_escalated', hireId: hire.id, count: 1, refId: checkin.id, priority: 0 });
      }
      const due = checkinDueDate(checkin);
      if (checkin.status !== 'completed' && due < today) {
        const late = Math.round((Date.parse(today) - Date.parse(due)) / 86_400_000);
        list.push({ id: `${checkin.id}-overdue`, kind: 'checkin_overdue', hireId: hire.id, count: late, refId: checkin.id, priority: 2 });
      }
    }

    // One alert per journey: the task blocked the longest, with the number of days.
    const blocked = hire.tasks
      .filter((t) => taskStatus(t, hire.tasks, today) === 'blocked')
      .map((t) => ({ task: t, days: blockedDays(t, hire.tasks, today) }))
      .filter(({ days }) => days > BLOCKED_ALERT_DAYS)
      .sort((a, b) => b.days - a.days);
    if (blocked[0]) {
      list.push({
        id: `${hire.id}-blocked`,
        kind: 'task_blocked',
        hireId: hire.id,
        count: blocked[0].days,
        refId: blocked[0].task.id,
        priority: 1,
      });
    }

    const overdue = hire.tasks.filter((t) => isPastDue(t, today)).length;
    if (overdue > 0) {
      list.push({ id: `${hire.id}-overdue`, kind: 'overdue_tasks', hireId: hire.id, count: overdue, priority: 3 });
    }
  }

  return list.sort((a, b) => a.priority - b.priority || b.count - a.count);
}

/**
 * Mood of the self-reviews, aggregated (never per person on the dashboard, CLAUDE.md F0).
 * Returns null when there are fewer than 3 answers, so no individual can be inferred.
 */
export function moodSummary(hires: Hire[]): { average: number; responses: number } | null {
  const moods = hires.flatMap((h) => h.checkins).flatMap((c) => (c.hireSelfReview ? [c.hireSelfReview.mood] : []));
  if (moods.length < 3) return null;
  return { average: moods.reduce((a, b) => a + b, 0) / moods.length, responses: moods.length };
}
