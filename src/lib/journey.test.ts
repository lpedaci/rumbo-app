import { describe, expect, it } from 'vitest';
import type { HireTask, Template } from '@/types/domain';
import {
  blockingTasks,
  completeTask,
  completionSeries,
  doneInLastDays,
  findCycle,
  generateHireTasks,
  greetingKey,
  hireStatus,
  nextTasks,
  progressByStage,
  rootBlocker,
  taskStatus,
  tasksUnlockedBy,
  validateDependencies,
  wouldCreateCycle,
} from './journey';

const template: Template = {
  id: 'tpl-test',
  name: 'Test',
  jobTitle: 'Test',
  area: 'Test',
  updatedAt: '2026-01-01',
  tasks: [
    { id: 'a', stage: 'preboarding', order: 1, title: 'Cuenta', description: '', type: 'task', owner: 'it', offsetDays: -5, dependsOn: [] },
    { id: 'b', stage: 'week1', order: 1, title: 'Acceso a Jira', description: '', type: 'task', owner: 'it', offsetDays: 2, dependsOn: ['a'] },
    { id: 'c', stage: 'month1', order: 1, title: 'Primer análisis', description: '', type: 'task', owner: 'hire', offsetDays: 10, dependsOn: ['b'] },
    { id: 'd', stage: 'week1', order: 2, title: 'Leer manual', description: '', type: 'reading', owner: 'hire', offsetDays: 3, dependsOn: [] },
    { id: 'e', stage: 'month1', order: 2, title: 'Curso', description: '', type: 'course', owner: 'hire', offsetDays: 20, dependsOn: [] },
  ],
};

const START = '2026-10-13';
const fresh = () => generateHireTasks(template, START, 'h1');
const byTpl = (tasks: HireTask[], id: string) => tasks.find((t) => t.templateTaskId === id)!;

describe('generateHireTasks', () => {
  it('computes dueDate = startDate + offsetDays and copies the template', () => {
    const tasks = fresh();
    expect(byTpl(tasks, 'a').dueDate).toBe('2026-10-08');
    expect(byTpl(tasks, 'c').dueDate).toBe('2026-10-23');
    expect(tasks.every((t) => t.status === 'pending')).toBe(true);
    expect(byTpl(tasks, 'c').id).toBe('h1-c');
  });
});

describe('taskStatus', () => {
  it('is blocked while a dependency is not done, with the reason', () => {
    const tasks = fresh();
    expect(taskStatus(byTpl(tasks, 'b'), tasks, '2026-10-01')).toBe('blocked');
    expect(blockingTasks(byTpl(tasks, 'b'), tasks).map((t) => t.title)).toEqual(['Cuenta']);
  });

  it('is overdue when the due date passed and it is not done', () => {
    const tasks = fresh();
    expect(taskStatus(byTpl(tasks, 'd'), tasks, '2026-10-20')).toBe('overdue');
    expect(taskStatus(byTpl(tasks, 'd'), tasks, '2026-10-16')).toBe('pending');
    expect(taskStatus(byTpl(tasks, 'd'), tasks, '2026-10-17')).toBe('overdue');
  });

  it('blocked wins over overdue', () => {
    const tasks = fresh();
    expect(taskStatus(byTpl(tasks, 'c'), tasks, '2026-11-10')).toBe('blocked');
  });
});

describe('completing a task', () => {
  it('unblocks the tasks that depend on it', () => {
    let tasks = fresh();
    tasks = completeTask(tasks, 'h1-a', 'p-x', '2026-10-07T10:00:00Z');
    expect(taskStatus(byTpl(tasks, 'b'), tasks, '2026-10-01')).toBe('pending');
    expect(tasksUnlockedBy(tasks, 'h1-b')).toEqual(['h1-c']);
    tasks = completeTask(tasks, 'h1-b', 'p-x', '2026-10-14T10:00:00Z');
    expect(taskStatus(byTpl(tasks, 'c'), tasks, '2026-10-20')).toBe('pending');
    expect(byTpl(tasks, 'b').completedBy).toBe('p-x');
  });
});

describe('nextTasks ("Lo próximo")', () => {
  it('returns up to 3 actionable hire tasks, overdue first', () => {
    const tasks = completeTask(completeTask(fresh(), 'h1-a', 'x', 'x'), 'h1-b', 'x', 'x');
    const next = nextTasks(tasks, 'hire', 3, '2026-10-20');
    expect(next.map((t) => t.templateTaskId)).toEqual(['d', 'c', 'e']);
  });

  it('skips blocked tasks', () => {
    expect(nextTasks(fresh(), 'hire', 3, '2026-10-01').map((t) => t.templateTaskId)).toEqual(['d', 'e']);
  });
});

describe('progress and hire status', () => {
  it('computes progress per stage', () => {
    const tasks = completeTask(fresh(), 'h1-a', 'x', 'x');
    const byStage = progressByStage(tasks);
    expect(byStage.preboarding.percent).toBe(100);
    expect(byStage.week1).toEqual({ done: 0, total: 2, percent: 0 });
  });

  it('derives upcoming, active and completed', () => {
    expect(hireStatus({ startDate: '2026-11-24', checkins: [] }, '2026-11-10')).toBe('upcoming');
    expect(hireStatus({ startDate: '2026-10-13', checkins: [] }, '2026-11-10')).toBe('active');
    expect(
      hireStatus(
        { startDate: '2026-06-01', checkins: [{ id: 'x', stage: 'day90', dueDate: '2026-08-30', status: 'completed', milestones: [] }] },
        '2026-11-10',
      ),
    ).toBe('completed');
  });
});

describe('dependency validation (template builder)', () => {
  it('detects cycles and returns the path', () => {
    const tasks = [
      { id: 'a', offsetDays: 1, dependsOn: ['b'] },
      { id: 'b', offsetDays: 1, dependsOn: ['a'] },
    ];
    expect(findCycle(tasks)).toEqual(['a', 'b', 'a']);
    expect(validateDependencies(tasks)).toContainEqual({ kind: 'cycle', path: ['a', 'b', 'a'] });
  });

  it('rejects a dependency with a later due date than the task', () => {
    const tasks = [
      { id: 'a', offsetDays: 10, dependsOn: [] },
      { id: 'b', offsetDays: 5, dependsOn: ['a'] },
    ];
    expect(validateDependencies(tasks)).toEqual([{ kind: 'later_dependency', taskId: 'b', dependencyId: 'a' }]);
  });

  it('accepts a valid chain and flags missing references', () => {
    expect(validateDependencies(template.tasks)).toEqual([]);
    expect(validateDependencies([{ id: 'a', offsetDays: 1, dependsOn: ['z'] }])).toEqual([
      { kind: 'missing', taskId: 'a', dependencyId: 'z' },
    ]);
  });

  it('tells the picker which dependency would close a cycle', () => {
    expect(wouldCreateCycle(template.tasks, 'a', 'c')).toBe(true);
    expect(wouldCreateCycle(template.tasks, 'e', 'd')).toBe(false);
  });
});

describe('rootBlocker', () => {
  it('follows the chain to the unfinished task holding the work', () => {
    const tasks = fresh();
    expect(rootBlocker(byTpl(tasks, 'c'), tasks).templateTaskId).toBe('a');
    expect(rootBlocker(byTpl(tasks, 'd'), tasks).templateTaskId).toBe('d');
  });
});

describe('home trends', () => {
  const task = (id: string, completedAt?: string) =>
    ({ id, status: completedAt ? 'done' : 'pending', completedAt }) as unknown as HireTask;
  const tasks = [task('a', '2026-11-01T10:00:00Z'), task('b', '2026-11-08T10:00:00Z'), task('c', '2026-11-10T09:00:00Z'), task('d')];

  it('builds a cumulative series of done tasks', () => {
    expect(completionSeries(tasks, 4, '2026-11-10')).toEqual([1, 2, 2, 3]);
  });

  it('counts the tasks done in the last days', () => {
    expect(doneInLastDays(tasks, 7, '2026-11-10')).toBe(2);
  });

  it('greets by the time of day', () => {
    expect(greetingKey(9)).toBe('morning');
    expect(greetingKey(15)).toBe('afternoon');
    expect(greetingKey(22)).toBe('evening');
  });
});
