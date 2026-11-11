import type { Hire, Stage, Template, TemplateTask } from '@/types/domain';
import { STAGES } from './dates';
import { type DependencyIssue, validateDependencies } from './journey';
import { TASK_OFFSET_MAX, TASK_OFFSET_MIN } from './validation';

/**
 * Template builder rules (CLAUDE.md F2). Pure functions: the editor keeps a draft
 * in memory and only the store writes it, so every rule is unit-tested here.
 */

/** Day range of each stage (CLAUDE.md section 7, D-05 and D-27). */
export const STAGE_RANGES: Record<Stage, { min: number; max: number }> = {
  preboarding: { min: TASK_OFFSET_MIN, max: -1 },
  week1: { min: 0, max: 6 },
  month1: { min: 7, max: 29 },
  days30to90: { min: 30, max: TASK_OFFSET_MAX },
};

export function offsetFitsStage(offset: number, stage: Stage): boolean {
  const { min, max } = STAGE_RANGES[stage];
  return offset >= min && offset <= max;
}

/** Keeps the offset when it already fits the stage; otherwise moves it to the closest day of the stage. */
export function clampOffsetToStage(offset: number, stage: Stage): number {
  const { min, max } = STAGE_RANGES[stage];
  return Math.min(max, Math.max(min, offset));
}

/** Tasks of one stage in display order. */
export function tasksOfStage<T extends Pick<TemplateTask, 'stage' | 'order'>>(tasks: T[], stage: Stage): T[] {
  return tasks.filter((t) => t.stage === stage).sort((a, b) => a.order - b.order);
}

/** Template order: by stage, then by the order set by HR. Used by the preview and by new journeys. */
export function sortByStageAndOrder<T extends Pick<TemplateTask, 'stage' | 'order'>>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage) || a.order - b.order);
}

/** Rewrites `order` as 1..n inside each stage, following the given sequence. */
function renumber(tasks: TemplateTask[]): TemplateTask[] {
  const counters = new Map<Stage, number>();
  return tasks.map((task) => {
    const next = (counters.get(task.stage) ?? 0) + 1;
    counters.set(task.stage, next);
    return task.order === next ? task : { ...task, order: next };
  });
}

/** Moves a task to a new position inside its stage (drag and drop, or "Subir" / "Bajar"). */
export function reorderInStage(tasks: TemplateTask[], taskId: string, toIndex: number): TemplateTask[] {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return tasks;
  const stageTasks = tasksOfStage(tasks, task.stage).filter((t) => t.id !== taskId);
  const index = Math.max(0, Math.min(stageTasks.length, toIndex));
  stageTasks.splice(index, 0, task);
  const others = tasks.filter((t) => t.stage !== task.stage);
  return renumber(sortByStageAndOrder([...others, ...stageTasks.map((t, i) => ({ ...t, order: i + 1 }))]));
}

/** "Subir" (-1) or "Bajar" (+1) inside the stage. Returns the same array when it cannot move. */
export function moveTask(tasks: TemplateTask[], taskId: string, direction: -1 | 1): TemplateTask[] {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return tasks;
  const stageTasks = tasksOfStage(tasks, task.stage);
  const index = stageTasks.findIndex((t) => t.id === taskId);
  const target = index + direction;
  if (target < 0 || target >= stageTasks.length) return tasks;
  return reorderInStage(tasks, taskId, target);
}

/**
 * "Mover a etapa…": the task goes to the end of the new stage, and its offset moves
 * to the closest day of that stage when it does not fit (D-47).
 */
export function moveToStage(tasks: TemplateTask[], taskId: string, stage: Stage): TemplateTask[] {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.stage === stage) return tasks;
  const last = tasksOfStage(tasks, stage).length;
  const moved = { ...task, stage, order: last + 1, offsetDays: clampOffsetToStage(task.offsetDays, stage) };
  return renumber(sortByStageAndOrder(tasks.map((t) => (t.id === taskId ? moved : t))));
}

/** Adds or replaces a task. A new task goes to the end of its stage. */
export function upsertTask(tasks: TemplateTask[], task: TemplateTask): TemplateTask[] {
  const existing = tasks.find((t) => t.id === task.id);
  if (!existing) {
    return renumber(sortByStageAndOrder([...tasks, { ...task, order: tasksOfStage(tasks, task.stage).length + 1 }]));
  }
  const updated =
    existing.stage === task.stage ? task : { ...task, order: tasksOfStage(tasks, task.stage).length + 1 };
  return renumber(sortByStageAndOrder(tasks.map((t) => (t.id === task.id ? updated : t))));
}

/** Removes a task and every dependency that pointed to it. */
export function removeTask(tasks: TemplateTask[], taskId: string): TemplateTask[] {
  return renumber(
    sortByStageAndOrder(
      tasks
        .filter((t) => t.id !== taskId)
        .map((t) => (t.dependsOn.includes(taskId) ? { ...t, dependsOn: t.dependsOn.filter((d) => d !== taskId) } : t)),
    ),
  );
}

/** Tasks that depend on the given one (shown before deleting it). */
export function dependentsOf(tasks: TemplateTask[], taskId: string): TemplateTask[] {
  return tasks.filter((t) => t.dependsOn.includes(taskId));
}

/** How many journeys were created from a template (A5 "uso"). */
export function templateUsage(templateId: string, hires: Pick<Hire, 'templateId'>[]): number {
  return hires.filter((h) => h.templateId === templateId).length;
}

/** Id with a prefix, unique enough for demo data kept in one browser. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Copy of a template with new ids; dependencies point to the copied tasks. */
export function duplicateTemplate(template: Template, copyName: string, today: string): Template {
  const ids = new Map(template.tasks.map((t) => [t.id, newId('tt')]));
  return {
    ...template,
    id: newId('tpl'),
    name: copyName,
    updatedAt: today,
    tasks: template.tasks.map((t) => ({
      ...t,
      id: ids.get(t.id)!,
      dependsOn: t.dependsOn.map((d) => ids.get(d) ?? d),
    })),
  };
}

export type TemplateIssue =
  | DependencyIssue
  | { kind: 'stage_range'; taskId: string }
  | { kind: 'no_tasks' };

/** Everything that blocks saving a template. Field-level checks live in the forms. */
export function validateTemplate(tasks: TemplateTask[]): TemplateIssue[] {
  const issues: TemplateIssue[] = [];
  if (tasks.length === 0) issues.push({ kind: 'no_tasks' });
  for (const task of tasks) {
    if (!offsetFitsStage(task.offsetDays, task.stage)) issues.push({ kind: 'stage_range', taskId: task.id });
  }
  return [...issues, ...validateDependencies(tasks)];
}

/**
 * Whether a task can be chosen as a dependency, and why not (shown next to each option):
 * `later` when it is due after this task, `cycle` when it already depends on this task.
 */
export function dependencyOptionState(
  tasks: Pick<TemplateTask, 'id' | 'dependsOn'>[],
  taskId: string,
  candidate: Pick<TemplateTask, 'id' | 'offsetDays'>,
  offsetDays: number,
): 'ok' | 'cycle' | 'later' {
  if (candidate.offsetDays > offsetDays) return 'later';
  const byId = new Map(tasks.map((t) => [t.id, t.dependsOn]));
  const seen = new Set<string>();
  const stack = [candidate.id];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (id === taskId) return 'cycle';
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...(byId.get(id) ?? []));
  }
  return 'ok';
}
