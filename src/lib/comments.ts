import type { Comment, Hire, Person } from '@/types/domain';

/**
 * Comment rules (F9). Plain text only: the body is stored as typed and rendered as text, never
 * as HTML. Mentions are names written after "@" that match someone involved in the journey.
 */

/** People involved in a journey, who can be mentioned: the hire, the manager, HR and the buddy. */
export function participantsOf(hire: Hire, people: Person[]): Person[] {
  const ids = [hire.personId, hire.managerId, hire.hrId, hire.buddyId].filter((id): id is string => Boolean(id));
  return [...new Set(ids)].map((id) => people.find((p) => p.id === id)).filter((p): p is Person => Boolean(p));
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** "@Nombre Apellido" or "@Nombre", followed by anything that is not a letter. */
function mentionPattern(person: Person): RegExp {
  const first = person.name.split(' ')[0]!;
  return new RegExp(`@(${escape(person.name)}|${escape(first)})(?![\\p{L}])`, 'iu');
}

/** Ids of the participants mentioned in a text. */
export function detectMentions(body: string, participants: Person[]): string[] {
  return participants.filter((p) => mentionPattern(p).test(body)).map((p) => p.id);
}

/** Splits a body into plain text and mention segments, to show mentions highlighted (still text). */
export function segmentsOf(body: string, mentioned: Person[]): { text: string; mention?: boolean }[] {
  if (!mentioned.length) return [{ text: body }];
  const names = mentioned
    .flatMap((p) => [p.name, p.name.split(' ')[0]!])
    .sort((a, b) => b.length - a.length)
    .map(escape);
  const re = new RegExp(`(@(?:${names.join('|')}))(?![\\p{L}])`, 'giu');
  const out: { text: string; mention?: boolean }[] = [];
  let last = 0;
  for (const m of body.matchAll(re)) {
    if (m.index! > last) out.push({ text: body.slice(last, m.index) });
    out.push({ text: m[0], mention: true });
    last = m.index! + m[0].length;
  }
  if (last < body.length) out.push({ text: body.slice(last) });
  return out;
}

/** Comments of a task, oldest first (a conversation reads top to bottom). */
export function threadOf(comments: Comment[], hireTaskId: string): Comment[] {
  return comments.filter((c) => c.hireTaskId === hireTaskId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Comments still visible (not deleted), for the counters on the task rows. */
export function activeCount(comments: Comment[], hireTaskId: string): number {
  return comments.reduce((n, c) => n + (c.hireTaskId === hireTaskId && !c.deletedAt ? 1 : 0), 0);
}
