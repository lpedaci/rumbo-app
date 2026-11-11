import { describe, expect, it } from 'vitest';
import { buildSeed } from '@/data/seed';
import { completeTask, tasksUnlockedBy } from './journey';
import { groupOf, notificationsFor, onCheckinCompleted, onTaskCompleted, unreadCount } from './notifications';

const seed = buildSeed();
const DEMO = ['p-carla', 'p-martin', 'p-sofia', 'p-diego'];

describe('seed notifications', () => {
  it('gives every demo person a useful inbox, with unread ones', () => {
    for (const id of DEMO) {
      const mine = notificationsFor(seed.notifications, id);
      expect(mine.length).toBeGreaterThanOrEqual(5);
      expect(unreadCount(seed.notifications, id)).toBeGreaterThan(0);
    }
  });

  it('never dates a notification after the demo day and links inside the recipient workspace', () => {
    for (const n of seed.notifications) {
      expect(n.createdAt.slice(0, 10) <= '2026-11-10').toBe(true);
      if (n.recipientId === 'p-sofia') expect(n.link.startsWith('/me') || n.link.startsWith('/account')).toBe(true);
      if (n.recipientId === 'p-diego') expect(n.link.startsWith('/it')).toBe(true);
    }
  });

  it('has stable ids, so a reload shows the same seed', () => {
    expect(buildSeed().notifications.map((n) => n.id)).toEqual(seed.notifications.map((n) => n.id));
  });
});

describe('notification events', () => {
  it('announces the tasks a completed task unblocks to whoever has to do them', () => {
    const hire = seed.hires.find((h) => h.id === 'h-sofia')!;
    const blocked = hire.tasks.find((t) => t.status !== 'done' && t.dependsOn.length > 0)!;
    const dep = hire.tasks.find((t) => t.templateTaskId === blocked.dependsOn[0])!;
    const tasks = completeTask(hire.tasks, dep.id, 'p-x', '2026-11-10T10:00:00.000Z');
    const unlocked = tasksUnlockedBy(tasks, dep.id);
    const list = onTaskCompleted({ ...hire, tasks }, unlocked, '2026-11-10T10:00:00.000Z');
    expect(list.every((n) => n.type === 'task.unblocked')).toBe(true);
    expect(list.length).toBe(unlocked.length);
  });

  it('tells HR only when a check-in is escalated', () => {
    const hire = seed.hires.find((h) => h.id === 'h-sofia')!;
    expect(onCheckinCompleted(hire, undefined, 'day30', false, 'x').map((n) => n.recipientId)).toEqual(['p-sofia']);
    expect(onCheckinCompleted(hire, undefined, 'day30', true, 'x').map((n) => n.recipientId)).toEqual([
      'p-sofia',
      'p-carla',
    ]);
  });

  it('groups by today, this week and earlier', () => {
    const base = seed.notifications[0]!;
    expect(groupOf({ ...base, createdAt: '2026-11-10T08:00:00.000Z' })).toBe('today');
    expect(groupOf({ ...base, createdAt: '2026-11-06T08:00:00.000Z' })).toBe('week');
    expect(groupOf({ ...base, createdAt: '2026-10-20T08:00:00.000Z' })).toBe('earlier');
  });
});
