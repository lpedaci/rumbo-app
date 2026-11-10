import type { Checkin, CheckinStage, Hire, HireTask, Stage, Template, TemplateTask, TaskStatus } from '@/types/domain';
import { addDays, daysBetween, DEMO_TODAY, STAGES, stageForOffset } from './dates';

/**
 * Business rules of the onboarding journey (CLAUDE.md section 7):
 * - dueDate = startDate + offsetDays
 * - a task is `blocked` if any dependency is not `done`
 * - a task is `overdue` if dueDate < today and it is not `done`
 * Derived states are computed here and never stored.
 */

/** Derived status. Blocked wins over overdue: the person cannot act until the dependency is done. */
export function taskStatus(task: HireTask, allTasks: HireTask[], today = DEMO_TODAY): TaskStatus {
  if (task.status === 'done') return 'done';
  if (blockingTasks(task, allTasks).length > 0) return 'blocked';
  if (task.dueDate < today) return 'overdue';
  return task.status;
}

/** Unfinished dependencies of a task, in order. Used for "Primero completa: …". */
export function blockingTasks(task: HireTask, allTasks: HireTask[]): HireTask[] {
  return task.dependsOn
    .map((depId) => allTasks.find((t) => t.templateTaskId === depId))
    .filter((dep): dep is HireTask => dep !== undefined && dep.status !== 'done');
}

/**
 * The unfinished task at the root of a dependency chain: the one actually holding the work.
 * For a task that is not blocked, it is the task itself.
 */
export function rootBlocker(task: HireTask, allTasks: HireTask[], seen = new Set<string>()): HireTask {
  const blockers = blockingTasks(task, allTasks).filter((b) => !seen.has(b.id));
  if (blockers.length === 0) return task;
  seen.add(task.id);
  // Follow the blocker that should have been done first.
  const first = [...blockers].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]!;
  return rootBlocker(first, allTasks, seen);
}

/** True when the task is overdue even if it is also blocked (for metrics). */
export function isPastDue(task: HireTask, today = DEMO_TODAY): boolean {
  return task.status !== 'done' && task.dueDate < today;
}

/** Days a task has been blocked: since the latest due date among its unfinished dependencies. */
export function blockedDays(task: HireTask, allTasks: HireTask[], today = DEMO_TODAY): number {
  const blockers = blockingTasks(task, allTasks);
  if (blockers.length === 0) return 0;
  const since = blockers.map((b) => b.dueDate).sort().at(-1)!;
  return Math.max(0, daysBetween(since, today));
}

/** Copies the template tasks into a hire journey with real dates. */
export function generateHireTasks(template: Template, startDate: string, hireId: string): HireTask[] {
  return [...template.tasks]
    .sort((a, b) => a.offsetDays - b.offsetDays || a.order - b.order)
    .map(({ offsetDays, ...task }) => ({
      ...task,
      id: `${hireId}-${task.id}`,
      templateTaskId: task.id,
      dueDate: addDays(startDate, offsetDays),
      status: 'pending' as const,
    }));
}

export const CHECKIN_OFFSETS: Record<CheckinStage, number> = { day30: 30, day60: 60, day90: 90 };

/** Check-ins 30/60/90 with the default milestones of each stage. */
export function generateCheckins(
  startDate: string,
  hireId: string,
  milestones: Record<CheckinStage, string[]>,
): Checkin[] {
  return (Object.keys(CHECKIN_OFFSETS) as CheckinStage[]).map((stage) => ({
    id: `${hireId}-${stage}`,
    stage,
    dueDate: addDays(startDate, CHECKIN_OFFSETS[stage]),
    status: 'pending',
    milestones: milestones[stage].map((label, i) => ({ id: `${stage}-m${i + 1}`, label })),
  }));
}

/** Effective due date of a check-in: the rescheduled date if there is one. */
export function checkinDueDate(checkin: Checkin): string {
  return checkin.action?.type === 'reschedule' ? checkin.action.newDate : checkin.dueDate;
}

/** The first check-in that is not completed yet. */
export function nextCheckin(hire: Hire): Checkin | undefined {
  return hire.checkins.find((c) => c.status !== 'completed');
}

/** Hire status from dates and check-ins: upcoming before day 0, completed after the day-90 check-in. */
export function hireStatus(hire: Pick<Hire, 'startDate' | 'checkins'>, today = DEMO_TODAY): Hire['status'] {
  if (hire.startDate > today) return 'upcoming';
  const day90 = hire.checkins.find((c) => c.stage === 'day90');
  if (day90?.status === 'completed') return 'completed';
  return 'active';
}

export interface Progress {
  done: number;
  total: number;
  /** 0 to 100. */
  percent: number;
}

export function progressOf(tasks: HireTask[]): Progress {
  const done = tasks.filter((t) => t.status === 'done').length;
  return { done, total: tasks.length, percent: tasks.length ? (done / tasks.length) * 100 : 0 };
}

export function progressByStage(tasks: HireTask[]): Record<Stage, Progress> {
  return Object.fromEntries(STAGES.map((stage) => [stage, progressOf(tasks.filter((t) => t.stage === stage))])) as Record<
    Stage,
    Progress
  >;
}

/** Current stage of a hire, from the days since the start date. */
export function currentStage(startDate: string, today = DEMO_TODAY): Stage {
  return stageForOffset(daysBetween(startDate, today));
}

/**
 * "Lo próximo": the 3 most urgent actionable tasks of the hire.
 * Overdue first, then by due date; excludes done and blocked tasks.
 */
export function nextTasks(tasks: HireTask[], owner: HireTask['owner'] = 'hire', limit = 3, today = DEMO_TODAY): HireTask[] {
  return tasks
    .filter((t) => t.owner === owner)
    .map((t) => ({ task: t, status: taskStatus(t, tasks, today) }))
    .filter(({ status }) => status !== 'done' && status !== 'blocked')
    .sort((a, b) => {
      const aOver = a.status === 'overdue' ? 0 : 1;
      const bOver = b.status === 'overdue' ? 0 : 1;
      return aOver - bOver || a.task.dueDate.localeCompare(b.task.dueDate);
    })
    .slice(0, limit)
    .map(({ task }) => task);
}

/** Marks a task as done. Returns a new array; dependent tasks unblock automatically (derived). */
export function completeTask(tasks: HireTask[], taskId: string, by: string, at: string): HireTask[] {
  return tasks.map((t) => (t.id === taskId ? { ...t, status: 'done', completedAt: at, completedBy: by } : t));
}

/** Ids of tasks that become actionable once `taskId` is done (for the "unlocked" highlight). */
export function tasksUnlockedBy(tasks: HireTask[], taskId: string): string[] {
  const done = tasks.find((t) => t.id === taskId);
  if (!done) return [];
  const after = completeTask(tasks, taskId, '', '');
  return tasks
    .filter((t) => t.dependsOn.includes(done.templateTaskId))
    .filter((t) => blockingTasks(t, tasks).length > 0 && blockingTasks(after.find((a) => a.id === t.id)!, after).length === 0)
    .map((t) => t.id);
}

// ---------- Template builder validation (F2) ----------

export type DependencyIssue =
  | { kind: 'cycle'; path: string[] }
  | { kind: 'later_dependency'; taskId: string; dependencyId: string }
  | { kind: 'missing'; taskId: string; dependencyId: string };

/**
 * Validates the dependencies of a template:
 * no cycles, no dependency with a later offset than the task that depends on it,
 * no reference to a task outside the template.
 */
export function validateDependencies(tasks: Pick<TemplateTask, 'id' | 'offsetDays' | 'dependsOn'>[]): DependencyIssue[] {
  const issues: DependencyIssue[] = [];
  const byId = new Map(tasks.map((t) => [t.id, t]));

  for (const task of tasks) {
    for (const depId of task.dependsOn) {
      const dep = byId.get(depId);
      if (!dep) issues.push({ kind: 'missing', taskId: task.id, dependencyId: depId });
      else if (dep.offsetDays > task.offsetDays)
        issues.push({ kind: 'later_dependency', taskId: task.id, dependencyId: depId });
    }
  }

  const cycle = findCycle(tasks);
  if (cycle) issues.push({ kind: 'cycle', path: cycle });
  return issues;
}

/** Returns the first cycle found as a path of ids (A → B → A), or null. */
export function findCycle(tasks: Pick<TemplateTask, 'id' | 'dependsOn'>[]): string[] | null {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];

  const visit = (id: string): string[] | null => {
    if (state.get(id) === 'done') return null;
    if (state.get(id) === 'visiting') return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, 'visiting');
    stack.push(id);
    for (const dep of byId.get(id)?.dependsOn ?? []) {
      if (!byId.has(dep)) continue;
      const found = visit(dep);
      if (found) return found;
    }
    stack.pop();
    state.set(id, 'done');
    return null;
  };

  for (const task of tasks) {
    const found = visit(task.id);
    if (found) return found;
  }
  return null;
}

/** True if adding `dependencyId` to `taskId` would create a cycle (to disable it in the picker). */
export function wouldCreateCycle(
  tasks: Pick<TemplateTask, 'id' | 'dependsOn'>[],
  taskId: string,
  dependencyId: string,
): boolean {
  const next = tasks.map((t) => (t.id === taskId ? { ...t, dependsOn: [...t.dependsOn, dependencyId] } : t));
  return findCycle(next) !== null;
}
