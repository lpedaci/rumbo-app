import { describe, expect, it } from 'vitest';
import { DEMO_TODAY, stageForOffset } from '@/lib/dates';
import { currentStage, isPastDue, nextCheckin, taskStatus, validateDependencies } from '@/lib/journey';
import { TASK_OFFSET_MAX, TASK_OFFSET_MIN } from '@/lib/validation';
import { buildSeed } from './seed';

/** The seed must match CLAUDE.md section 7 ("Datos semilla") and the business rules. */
const seed = buildSeed();
const person = (id: string) => seed.people.find((p) => p.id === id)!;

describe('seed: people and demo accounts', () => {
  it('has the four demo users with their roles and .demo emails', () => {
    expect(person('p-carla')).toMatchObject({ role: 'admin', email: 'carla@nortia.demo' });
    expect(person('p-martin')).toMatchObject({ role: 'manager', email: 'martin@nortia.demo' });
    expect(person('p-sofia')).toMatchObject({ role: 'hire', email: 'sofia@nortia.demo' });
    expect(person('p-diego')).toMatchObject({ role: 'it_admin', email: 'diego@nortia.demo' });
    expect(seed.people.every((p) => p.email.endsWith('@nortia.demo'))).toBe(true);
  });
});

describe('seed: templates', () => {
  it('has the 3 templates with 12 to 18 tasks each', () => {
    expect(seed.templates.map((t) => t.name)).toEqual([
      'Analista de Datos',
      'Desarrollador/a Frontend',
      'Ejecutivo/a Comercial',
    ]);
    for (const t of seed.templates) {
      expect(t.tasks.length).toBeGreaterThanOrEqual(12);
      expect(t.tasks.length).toBeLessThanOrEqual(18);
    }
  });

  it('has valid dependencies, offsets in range and stages that match the offsets', () => {
    for (const t of seed.templates) {
      expect(validateDependencies(t.tasks), t.name).toEqual([]);
      for (const task of t.tasks) {
        expect(task.offsetDays).toBeGreaterThanOrEqual(TASK_OFFSET_MIN);
        expect(task.offsetDays).toBeLessThanOrEqual(TASK_OFFSET_MAX);
        expect(task.stage, task.id).toBe(stageForOffset(task.offsetDays));
      }
    }
  });
});

describe('seed: hires', () => {
  it('has 10 to 12 hires in every status', () => {
    expect(seed.hires.length).toBeGreaterThanOrEqual(10);
    expect(seed.hires.length).toBeLessThanOrEqual(12);
    const statuses = new Set(seed.hires.map((h) => h.status));
    expect(statuses).toEqual(new Set(['upcoming', 'active', 'completed']));
  });

  it('has at least 2 delayed journeys, 1 blocked task and 1 escalated check-in', () => {
    const active = seed.hires.filter((h) => h.status === 'active');
    expect(active.filter((h) => h.tasks.some((t) => isPastDue(t))).length).toBeGreaterThanOrEqual(2);
    expect(active.some((h) => h.tasks.some((t) => taskStatus(t, h.tasks) === 'blocked'))).toBe(true);
    expect(seed.hires.some((h) => h.checkins.some((c) => c.action?.type === 'escalate'))).toBe(true);
  });

  it('Sofía is in month 1, with partial progress and the 30-day check-in pending on 12/11/2026', () => {
    const sofia = seed.hires.find((h) => h.personId === 'p-sofia')!;
    expect(sofia.startDate).toBe('2026-10-13');
    expect(currentStage(sofia.startDate)).toBe('month1');
    const done = sofia.tasks.filter((t) => t.status === 'done').length;
    expect(done).toBeGreaterThan(0);
    expect(done).toBeLessThan(sofia.tasks.length);
    expect(nextCheckin(sofia)).toMatchObject({ stage: 'day30', dueDate: '2026-11-12', status: 'pending' });
  });

  it('never has tasks completed in the future or done tasks without author', () => {
    for (const hire of seed.hires) {
      for (const task of hire.tasks.filter((t) => t.status === 'done')) {
        expect(task.completedAt!.slice(0, 10) <= DEMO_TODAY).toBe(true);
        expect(task.completedBy).toBeTruthy();
      }
    }
  });

  it('only references existing people and templates; managers see only their team', () => {
    const ids = new Set(seed.people.map((p) => p.id));
    for (const hire of seed.hires) {
      expect(ids.has(hire.personId) && ids.has(hire.managerId) && ids.has(hire.hrId)).toBe(true);
      expect(person(hire.personId).managerId).toBe(hire.managerId);
      expect(seed.templates.some((t) => t.id === hire.templateId)).toBe(true);
    }
  });
});

describe('seed: security', () => {
  it('has 40 to 60 audit events with failed logins, a lockout and an access denied', () => {
    expect(seed.auditEvents.length).toBeGreaterThanOrEqual(40);
    expect(seed.auditEvents.length).toBeLessThanOrEqual(60);
    const actions = seed.auditEvents.map((e) => e.action);
    expect(actions).toContain('auth.login_failed');
    expect(actions).toContain('auth.account_locked');
    expect(actions).toContain('auth.access_denied');
    const sorted = [...seed.auditEvents].sort((a, b) => a.at.localeCompare(b.at));
    expect(seed.auditEvents).toEqual(sorted);
  });

  it('has 5 or 6 access requests, including a pending locked account', () => {
    expect(seed.accessRequests.length).toBeGreaterThanOrEqual(5);
    expect(seed.accessRequests.length).toBeLessThanOrEqual(6);
    expect(seed.accessRequests.some((r) => r.reason === 'locked' && r.status === 'new')).toBe(true);
    expect(new Set(seed.accessRequests.map((r) => r.status))).toEqual(new Set(['new', 'verifying', 'resolved', 'rejected']));
  });

  it('the locked account matches its pending request', () => {
    const locked = seed.authAttempts.find((a) => a.locked)!;
    expect(seed.accessRequests.find((r) => r.status === 'new')!.email).toBe(locked.email);
  });

  it('has the policy values of section F0', () => {
    expect(seed.securityPolicy).toMatchObject({
      mfaRequiredFor: ['admin', 'it_admin'],
      sessionIdleMinutes: 15,
      sessionWarningMinutes: 13,
      passwordMinLength: 12,
      lockoutAttempts: 5,
    });
  });

  it('buildSeed returns an independent copy each time', () => {
    const a = buildSeed();
    a.hires[0]!.tasks[0]!.status = 'pending';
    a.people.pop();
    expect(buildSeed().people.length).toBe(seed.people.length);
  });
});
