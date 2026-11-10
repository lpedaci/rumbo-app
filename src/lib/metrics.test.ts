import { describe, expect, it } from 'vitest';
import { buildSeed } from '@/data/seed';
import type { Hire } from '@/types/domain';
import { completeTask, generateCheckins, generateHireTasks } from './journey';
import { alerts, BLOCKED_ALERT_DAYS, kpis, moodSummary, overdueByOwner, progressByCohort, progressByHire } from './metrics';

const seed = buildSeed();

describe('kpis', () => {
  it('are computed from the seed', () => {
    const result = kpis(seed.hires);
    expect(result.activeHires).toBe(seed.hires.filter((h) => h.status === 'active').length);
    expect(result.onTimeRate).toBeGreaterThan(0);
    expect(result.onTimeRate).toBeLessThan(100);
    expect(result.delayedJourneys).toBeGreaterThanOrEqual(2);
    expect(result.averageProgress).toBeGreaterThan(0);
  });

  it('change when the data changes (acceptance criterion of section 11)', () => {
    const before = kpis(seed.hires);
    const sofia = seed.hires.find((h) => h.id === 'h-sofia')!;
    const overdueTask = sofia.tasks.find((t) => t.templateTaskId === 'd11')!;
    const hires = seed.hires.map((h) =>
      h.id === 'h-sofia' ? { ...h, tasks: completeTask(h.tasks, overdueTask.id, 'p-sofia', '2026-11-10T12:00:00Z') } : h,
    );
    const after = kpis(hires);
    expect(after.averageProgress).toBeGreaterThan(before.averageProgress);
  });

  it('handle an empty list', () => {
    expect(kpis([])).toEqual({ activeHires: 0, onTimeRate: 100, delayedJourneys: 0, averageProgress: 0 });
  });
});

describe('charts', () => {
  it('progress by hire lists active journeys, highest first', () => {
    const points = progressByHire(seed.hires);
    expect(points.length).toBe(kpis(seed.hires).activeHires);
    expect(points.map((p) => p.percent)).toEqual([...points.map((p) => p.percent)].sort((a, b) => b - a));
  });

  it('progress by cohort groups by start month, oldest first', () => {
    const cohorts = progressByCohort(seed.hires);
    expect(cohorts.map((c) => c.cohort)).toEqual([...cohorts.map((c) => c.cohort)].sort());
    expect(cohorts.reduce((n, c) => n + c.hires, 0)).toBe(seed.hires.filter((h) => h.status !== 'upcoming').length);
  });

  it('overdue tasks by owner show IT as a bottleneck in the seed', () => {
    const byOwner = overdueByOwner(seed.hires);
    expect(byOwner.it).toBeGreaterThan(0);
    expect(Object.values(byOwner).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });
});

describe('alerts', () => {
  const list = alerts(seed.hires);

  it('include the escalated check-in first', () => {
    expect(list[0]).toMatchObject({ kind: 'checkin_escalated', hireId: 'h-valentina' });
  });

  it('include overdue check-ins, blocked tasks and journeys with overdue tasks', () => {
    const kinds = new Set(list.map((a) => a.kind));
    expect(kinds).toEqual(new Set(['checkin_escalated', 'checkin_overdue', 'task_blocked', 'overdue_tasks']));
    expect(list.filter((a) => a.kind === 'task_blocked').every((a) => a.count > BLOCKED_ALERT_DAYS)).toBe(true);
  });

  it('only cover active journeys', () => {
    const active = new Set(seed.hires.filter((h) => h.status === 'active').map((h) => h.id));
    expect(list.every((a) => active.has(a.hireId))).toBe(true);
  });

  it('an escalation in a new check-in raises a new alert', () => {
    const template = seed.templates[0]!;
    const hire: Hire = {
      id: 'h-new',
      personId: 'p-x',
      startDate: '2026-10-01',
      managerId: 'p-martin',
      hrId: 'p-carla',
      templateId: template.id,
      status: 'active',
      tasks: generateHireTasks(template, '2026-10-01', 'h-new').map((t) => ({ ...t, status: 'done' as const })),
      checkins: generateCheckins('2026-10-01', 'h-new', { day30: ['a'], day60: ['b'], day90: ['c'] }).map((c) =>
        c.stage === 'day30' ? { ...c, status: 'completed' as const, action: { type: 'escalate' as const, note: 'x' } } : c,
      ),
    };
    expect(alerts([hire]).map((a) => a.kind)).toEqual(['checkin_escalated']);
  });
});

describe('moodSummary', () => {
  it('is aggregated and hidden below 3 answers', () => {
    const summary = moodSummary(seed.hires)!;
    expect(summary.responses).toBeGreaterThanOrEqual(3);
    expect(summary.average).toBeGreaterThanOrEqual(1);
    expect(summary.average).toBeLessThanOrEqual(5);
    expect(moodSummary(seed.hires.filter((h) => h.id === 'h-lucas'))).toBeNull();
  });
});

describe('bottleneck attribution', () => {
  it('counts a blocked overdue task for the owner of the blocking task', () => {
    const byOwner = overdueByOwner(seed.hires);
    expect(byOwner.it).toBeGreaterThan(byOwner.hire);
  });

  it('raises one blocked alert per journey', () => {
    const blocked = alerts(seed.hires).filter((a) => a.kind === 'task_blocked');
    expect(new Set(blocked.map((a) => a.hireId)).size).toBe(blocked.length);
  });
});
