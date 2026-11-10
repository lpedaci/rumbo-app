import { beforeEach, describe, expect, it } from 'vitest';
import { buildSeed } from '@/data/seed';
import { taskStatus } from '@/lib/journey';
import { DATA_STORAGE_KEY, isValidDemoData, useDataStore } from './data-store';

describe('data store', () => {
  beforeEach(() => {
    localStorage.clear();
    useDataStore.getState().resetData();
  });

  it('starts with the seed data', () => {
    expect(useDataStore.getState().hires).toEqual(buildSeed().hires);
  });

  it('completes a task, records who did it and writes an audit event', () => {
    const sofia = useDataStore.getState().hires.find((h) => h.id === 'h-sofia')!;
    const task = sofia.tasks.find((t) => t.templateTaskId === 'd15')!;
    const before = useDataStore.getState().auditEvents.length;

    useDataStore.getState().completeTask('h-sofia', task.id, 'p-sofia');

    const updated = useDataStore.getState().hires.find((h) => h.id === 'h-sofia')!;
    const done = updated.tasks.find((t) => t.id === task.id)!;
    expect(done).toMatchObject({ status: 'done', completedBy: 'p-sofia' });
    // The dependent task ("Presentar resultados") is no longer blocked.
    const dependent = updated.tasks.find((t) => t.templateTaskId === 'd16')!;
    expect(taskStatus(dependent, updated.tasks)).not.toBe('blocked');
    expect(useDataStore.getState().auditEvents).toHaveLength(before + 1);
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'task.complete', actorId: 'p-sofia' });
  });

  it('persists changes in localStorage without passwords', () => {
    useDataStore.getState().logAudit({ actorId: 'p-carla', action: 'demo.test', result: 'success' });
    const stored = localStorage.getItem(DATA_STORAGE_KEY)!;
    expect(stored).toContain('demo.test');
    expect(stored.toLowerCase()).not.toContain('demo.2026!');
    expect(stored.toLowerCase()).not.toContain('"password"');
  });

  it('resetData restores the seed', () => {
    useDataStore.getState().logAudit({ actorId: 'p-carla', action: 'demo.test', result: 'success' });
    useDataStore.getState().resetData();
    expect(useDataStore.getState().auditEvents).toEqual(buildSeed().auditEvents);
  });

  it('rejects corrupted stored data', () => {
    expect(isValidDemoData(null)).toBe(false);
    expect(isValidDemoData({ people: 'x' })).toBe(false);
    expect(isValidDemoData(buildSeed())).toBe(true);
  });
});
