import { describe, expect, it } from 'vitest';
import { buildSeed } from '@/data/seed';
import { activeCount, detectMentions, participantsOf, segmentsOf, threadOf } from './comments';
import { onComment } from './notifications';

const seed = buildSeed();
const hire = seed.hires.find((h) => h.id === 'h-sofia')!;
const people = participantsOf(hire, seed.people);

describe('comments (F9)', () => {
  it('lets only the people of the journey be mentioned', () => {
    expect(people.map((p) => p.id)).toEqual(expect.arrayContaining(['p-sofia', 'p-martin', 'p-carla']));
    expect(people.some((p) => p.id === 'p-diego')).toBe(false);
  });

  it('detects mentions by full name or first name, not inside other words', () => {
    expect(detectMentions('Hola @Martín Rossi, ¿lo vemos?', people)).toEqual(['p-martin']);
    expect(detectMentions('@sofía avísame', people)).toEqual(['p-sofia']);
    expect(detectMentions('correo@Martínez.demo', people)).toEqual([]);
  });

  it('keeps the body as plain text and only marks the mentions', () => {
    const martin = people.filter((p) => p.id === 'p-martin');
    const parts = segmentsOf('Hola @Martín Rossi <b>x</b>', martin);
    expect(parts).toEqual([{ text: 'Hola ' }, { text: '@Martín Rossi', mention: true }, { text: ' <b>x</b>' }]);
  });

  it('orders a thread oldest first and counts only the comments not deleted', () => {
    const thread = threadOf(seed.comments, 'h-sofia-d15');
    expect(thread.map((c) => c.id)).toEqual(['cm-003', 'cm-004']);
    const deleted = seed.comments.map((c) => (c.id === 'cm-004' ? { ...c, deletedAt: 'x' } : c));
    expect(activeCount(deleted, 'h-sofia-d15')).toBe(1);
  });

  it('notifies the mentioned people and the rest of the thread, never the author', () => {
    const task = hire.tasks.find((x) => x.id === 'h-sofia-d15')!;
    const list = onComment(hire, task, { authorId: 'p-carla', mentions: ['p-martin'], createdAt: 'x' }, ['p-martin', 'p-sofia'], 'Carla');
    expect(list.map((n) => [n.recipientId, n.type])).toEqual([
      ['p-martin', 'comment.mention'],
      ['p-sofia', 'comment.new'],
    ]);
  });
});
