import { describe, expect, it } from 'vitest';
import milestones from '@/data/checkin-milestones.json';
import { buildSeed } from '@/data/seed';
import { addDays } from '@/lib/dates';
import { countByStatus, createHire, filterHires, summarizeHire, workEmailFor } from './hires';

const seed = buildSeed();
const summaries = seed.hires.map((h) => summarizeHire(h, seed.people, seed.templates));

describe('hire summaries and filters (A2)', () => {
  it('counts every hire once by status', () => {
    const counts = countByStatus(summaries);
    expect(counts.upcoming + counts.active + counts.completed).toBe(counts.all);
    expect(counts.all).toBe(seed.hires.length);
  });

  it('filters by status and area, newest start date first', () => {
    const active = filterHires(summaries, { status: 'active', area: 'all' });
    expect(active.every((s) => s.status === 'active')).toBe(true);
    const dates = active.map((s) => s.hire.startDate);
    expect(dates).toEqual([...dates].sort().reverse());
    const area = summaries[0]!.person!.area;
    expect(filterHires(summaries, { status: 'all', area }).every((s) => s.person?.area === area)).toBe(true);
  });

  it("Sofía's journey shows her progress and overdue tasks", () => {
    const sofia = summaries.find((s) => s.hire.personId === 'p-sofia')!;
    expect(sofia.status).toBe('active');
    expect(sofia.stage).toBe('month1');
    expect(sofia.overdue).toBe(1);
    expect(sofia.nextCheckin?.stage).toBe('day30');
  });
});

describe('creating a hire (A3, F3)', () => {
  it('builds the work email from the name and avoids duplicates', () => {
    expect(workEmailFor('Martina Gómez Paz', [])).toBe('martina.paz@nortia.demo');
    expect(workEmailFor('Sofía Ramírez', ['sofia.ramirez@nortia.demo'])).toBe('sofia.ramirez2@nortia.demo');
  });

  it('copies the template tasks with real dates and creates the 30/60/90 check-ins', () => {
    const template = seed.templates[0]!;
    const start = '2026-12-01';
    const { person, hire } = createHire(
      {
        name: 'Martina Gómez',
        jobTitle: template.jobTitle,
        area: template.area,
        startDate: start,
        managerId: 'p-martin',
        templateId: template.id,
        mobile: '+54 9 11 5555 5555',
      },
      { template, hrId: 'p-carla', people: seed.people, hires: seed.hires, milestones },
    );
    expect(person.role).toBe('hire');
    expect(person.employeeId).toMatch(/^NOR-\d{4}$/);
    expect(person.mobile).toBe('+54 9 11 5555 5555');
    expect(hire.personId).toBe(person.id);
    expect(hire.status).toBe('upcoming');
    expect(hire.tasks).toHaveLength(template.tasks.length);
    for (const task of template.tasks) {
      const copy = hire.tasks.find((t) => t.templateTaskId === task.id)!;
      expect(copy.dueDate).toBe(addDays(start, task.offsetDays));
      expect(copy.status).toBe('pending');
    }
    expect(hire.checkins.map((c) => c.dueDate)).toEqual([addDays(start, 30), addDays(start, 60), addDays(start, 90)]);
  });
});
