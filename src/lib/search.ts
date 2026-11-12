import type { DemoData } from '@/data/seed';
import type { Role } from '@/types/domain';
import { can, canViewHire, type Subject } from './permissions';

/**
 * Global search (F16): people, templates, tasks and requests, always filtered by what the role
 * can see (least privilege, the same scopes as the screens). Results carry where they lead.
 */

export type SearchGroup = 'people' | 'templates' | 'tasks' | 'requests';
export const SEARCH_GROUPS: SearchGroup[] = ['people', 'templates', 'tasks', 'requests'];

export interface SearchResult {
  group: SearchGroup;
  id: string;
  title: string;
  /** Second line: job and area, template job, task's journey, request number and type. */
  detail: string;
  link: string;
  /** For people: their role, to show the avatar in its color. */
  role?: Role;
  /** Kind of request, translated by the screen. */
  kind?: 'access' | 'privacy' | 'approval';
}

/** Lower case and without accents, so "sofia" finds "Sofía". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export const MIN_QUERY = 2;

type Data = Pick<
  DemoData,
  'people' | 'templates' | 'hires' | 'accessRequests' | 'privacyRequests' | 'approvals'
>;

/** Every result the user can see that matches the query, grouped in `SEARCH_GROUPS` order. */
export function search(data: Data, user: Subject | null | undefined, query: string): SearchResult[] {
  const q = normalize(query);
  if (!user || q.length < MIN_QUERY) return [];
  const words = q.split(/\s+/);
  const matches = (...fields: (string | undefined)[]) => {
    const text = normalize(fields.filter(Boolean).join(' '));
    return words.every((w) => text.includes(w));
  };
  const nameOf = (id?: string) => data.people.find((p) => p.id === id)?.name ?? '';
  const results: SearchResult[] = [];

  // People: HR sees everyone (A10); a manager, the people of their team (J2).
  if (can(user, 'person:manage')) {
    for (const p of data.people) {
      if (matches(p.name, p.email, p.jobTitle, p.area)) {
        results.push({ group: 'people', id: p.id, title: p.name, detail: `${p.jobTitle} · ${p.area}`, link: `/admin/people/${p.id}`, role: p.role });
      }
    }
  } else if (can(user, 'workspace:team')) {
    for (const hire of data.hires.filter((h) => canViewHire(user, h))) {
      const p = data.people.find((x) => x.id === hire.personId);
      if (p && matches(p.name, p.email, p.jobTitle)) {
        results.push({ group: 'people', id: p.id, title: p.name, detail: `${p.jobTitle} · ${p.area}`, link: `/manager/hires/${hire.id}`, role: p.role });
      }
    }
  }

  // Templates (A6)
  if (can(user, 'template:view')) {
    for (const tpl of data.templates) {
      if (matches(tpl.name, tpl.jobTitle, tpl.area)) {
        results.push({ group: 'templates', id: tpl.id, title: tpl.name, detail: `${tpl.jobTitle} · ${tpl.area}`, link: `/admin/templates/${tpl.id}` });
      }
    }
  }

  // Tasks of the journeys the user can see: their own (N2), their team's (J2) or all (A4).
  const taskLink = (hireId: string, taskId: string) =>
    can(user, 'workspace:journey') ? `/me/tasks/${taskId}` : can(user, 'workspace:team') ? `/manager/hires/${hireId}` : `/admin/hires/${hireId}`;
  for (const hire of data.hires.filter((h) => canViewHire(user, h))) {
    const owner = nameOf(hire.personId);
    for (const task of hire.tasks) {
      if (matches(task.title)) {
        results.push({ group: 'tasks', id: task.id, title: task.title, detail: owner, link: taskLink(hire.id, task.id) });
      }
    }
  }

  // Requests: access (S2), personal data (A12, or one's own in G10) and approvals (S7).
  if (can(user, 'access_request:view')) {
    for (const r of data.accessRequests) {
      if (matches(r.id, r.email, nameOf(r.personId))) {
        results.push({ group: 'requests', id: r.id, title: nameOf(r.personId) || r.email, detail: r.id, link: `/it/requests/${r.id}`, kind: 'access' });
      }
    }
  }
  const privacy = can(user, 'privacy_request:manage')
    ? data.privacyRequests
    : data.privacyRequests.filter((r) => r.personId === user.personId);
  for (const r of privacy) {
    if (matches(r.id, nameOf(r.personId), r.detail)) {
      results.push({
        group: 'requests',
        id: r.id,
        title: nameOf(r.personId),
        detail: r.id,
        link: can(user, 'privacy_request:manage') ? `/admin/privacy-requests?request=${r.id}` : '/account/privacy',
        kind: 'privacy',
      });
    }
  }
  if (can(user, 'approval:decide')) {
    for (const a of data.approvals) {
      if (matches(a.id, nameOf(a.targetId), nameOf(a.requestedBy))) {
        results.push({
          group: 'requests',
          id: a.id,
          title: nameOf(a.targetId) || a.id,
          detail: a.id,
          link: `/it/approvals?request=${a.id}`,
          kind: 'approval',
        });
      }
    }
  }

  return SEARCH_GROUPS.flatMap((g) => results.filter((r) => r.group === g));
}
