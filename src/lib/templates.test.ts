import { describe, expect, it } from 'vitest';
import type { TemplateTask } from '@/types/domain';
import {
  clampOffsetToStage,
  dependencyOptionState,
  duplicateTemplate,
  moveTask,
  moveToStage,
  offsetFitsStage,
  removeTask,
  reorderInStage,
  tasksOfStage,
  templateUsage,
  upsertTask,
  validateTemplate,
} from './templates';

const task = (id: string, stage: TemplateTask['stage'], order: number, offsetDays: number, dependsOn: string[] = []) =>
  ({ id, stage, order, offsetDays, dependsOn, title: id, description: '', type: 'task', owner: 'hire' }) as TemplateTask;

const base = [
  task('a', 'preboarding', 1, -5),
  task('b', 'preboarding', 2, -3),
  task('c', 'week1', 1, 0, ['a']),
  task('d', 'week1', 2, 2, ['c']),
  task('e', 'week1', 3, 4),
];
const ids = (tasks: TemplateTask[], stage: TemplateTask['stage']) => tasksOfStage(tasks, stage).map((t) => t.id);

describe('stage ranges', () => {
  it('match the stage limits of section 7', () => {
    expect(offsetFitsStage(-1, 'preboarding')).toBe(true);
    expect(offsetFitsStage(0, 'preboarding')).toBe(false);
    expect(offsetFitsStage(6, 'week1')).toBe(true);
    expect(offsetFitsStage(7, 'week1')).toBe(false);
    expect(offsetFitsStage(90, 'days30to90')).toBe(true);
    expect(clampOffsetToStage(2, 'month1')).toBe(7);
    expect(clampOffsetToStage(40, 'month1')).toBe(29);
    expect(clampOffsetToStage(10, 'month1')).toBe(10);
  });
});

describe('ordering (drag and drop and its menu alternative)', () => {
  it('reorders inside a stage and renumbers', () => {
    const next = reorderInStage(base, 'e', 0);
    expect(ids(next, 'week1')).toEqual(['e', 'c', 'd']);
    expect(tasksOfStage(next, 'week1').map((t) => t.order)).toEqual([1, 2, 3]);
    expect(ids(next, 'preboarding')).toEqual(['a', 'b']);
  });

  it('moves up and down, and does nothing at the edges', () => {
    expect(ids(moveTask(base, 'd', -1), 'week1')).toEqual(['d', 'c', 'e']);
    expect(ids(moveTask(base, 'd', 1), 'week1')).toEqual(['c', 'e', 'd']);
    expect(moveTask(base, 'c', -1)).toBe(base);
    expect(moveTask(base, 'e', 1)).toBe(base);
  });

  it('moves to another stage at the end and fits the due day into it', () => {
    const next = moveToStage(base, 'b', 'month1');
    const moved = next.find((t) => t.id === 'b')!;
    expect(moved.stage).toBe('month1');
    expect(moved.offsetDays).toBe(7);
    expect(ids(next, 'preboarding')).toEqual(['a']);
    const toWeek = moveToStage(base, 'a', 'week1');
    expect(ids(toWeek, 'week1')).toEqual(['c', 'd', 'e', 'a']);
  });
});

describe('editing tasks', () => {
  it('adds a new task at the end of its stage', () => {
    const next = upsertTask(base, task('f', 'preboarding', 0, -1));
    expect(ids(next, 'preboarding')).toEqual(['a', 'b', 'f']);
  });

  it('removes a task and the dependencies that pointed to it', () => {
    const next = removeTask(base, 'c');
    expect(next.find((t) => t.id === 'd')!.dependsOn).toEqual([]);
    expect(ids(next, 'week1')).toEqual(['d', 'e']);
  });
});

describe('dependency picker (F2)', () => {
  it('blocks a dependency that would close a cycle', () => {
    // a ← c ← d: "a" cannot depend on "d" (d already depends on a through c).
    expect(dependencyOptionState(base, 'a', { id: 'd', offsetDays: -10 }, -5)).toBe('cycle');
  });

  it('blocks a dependency due after the task', () => {
    expect(dependencyOptionState(base, 'c', { id: 'e', offsetDays: 4 }, 0)).toBe('later');
  });

  it('allows a dependency due the same day or earlier', () => {
    expect(dependencyOptionState(base, 'e', { id: 'c', offsetDays: 0 }, 4)).toBe('ok');
    expect(dependencyOptionState(base, 'new', { id: 'a', offsetDays: -5 }, -5)).toBe('ok');
  });
});

describe('validation before saving', () => {
  it('accepts a coherent template', () => {
    expect(validateTemplate(base)).toEqual([]);
  });

  it('reports an empty template, a due day out of stage, a later dependency and a cycle', () => {
    expect(validateTemplate([])).toEqual([{ kind: 'no_tasks' }]);
    expect(validateTemplate([task('x', 'week1', 1, 10)])).toEqual([{ kind: 'stage_range', taskId: 'x' }]);
    const later = [task('x', 'week1', 1, 1, ['y']), task('y', 'week1', 2, 3)];
    expect(validateTemplate(later)).toContainEqual({ kind: 'later_dependency', taskId: 'x', dependencyId: 'y' });
    const cycle = [task('x', 'week1', 1, 1, ['y']), task('y', 'week1', 2, 1, ['x'])];
    expect(validateTemplate(cycle).some((i) => i.kind === 'cycle')).toBe(true);
  });
});

describe('templates list', () => {
  it('counts the journeys created from a template', () => {
    expect(templateUsage('t1', [{ templateId: 't1' }, { templateId: 't2' }, { templateId: 't1' }])).toBe(2);
  });

  it('duplicates with new ids and dependencies pointing to the copies', () => {
    const copy = duplicateTemplate(
      { id: 't1', name: 'A', jobTitle: 'A', area: 'X', updatedAt: '2026-01-01', tasks: base },
      'A (copia)',
      '2026-11-10',
    );
    expect(copy.id).not.toBe('t1');
    expect(copy.name).toBe('A (copia)');
    const copyIds = new Set(copy.tasks.map((t) => t.id));
    expect(base.some((t) => copyIds.has(t.id))).toBe(false);
    for (const t of copy.tasks) for (const dep of t.dependsOn) expect(copyIds.has(dep)).toBe(true);
  });
});
