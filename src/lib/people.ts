import type { ApprovalRequest, AuthAttempts, Person, Role } from '@/types/domain';

/**
 * People rules (F15). The status is derived: offboarded (F12), locked (failed attempts, F6) or
 * active. Giving or taking an admin role (HR or IT) needs a second person (F14).
 */

export type PersonStatus = 'active' | 'locked' | 'offboarded';

export const ADMIN_ROLES: Role[] = ['admin', 'it_admin'];

/** The four demo accounts keep their role, so the visitor can always go through the demo. */
export const DEMO_PERSON_IDS = ['p-carla', 'p-martin', 'p-sofia', 'p-diego'];

export function personStatus(person: Person, attempts: AuthAttempts[]): PersonStatus {
  if (person.status === 'offboarded') return 'offboarded';
  const locked = attempts.some((a) => a.locked && a.email.toLowerCase() === person.email.toLowerCase());
  return locked ? 'locked' : 'active';
}

/** True when the change gives or takes an admin role. */
export function needsApproval(from: Role, to: Role): boolean {
  return from !== to && (ADMIN_ROLES.includes(from) || ADMIN_ROLES.includes(to));
}

/** The pending approval of a role change for a person, if any (only one at a time). */
export function pendingRoleChange(approvals: ApprovalRequest[], personId: string): ApprovalRequest | undefined {
  return approvals.find((a) => a.action === 'role.change' && a.targetId === personId && a.status === 'pending');
}

export interface PeopleFilters {
  query: string;
  areaId: string;
  role: string;
  status: string;
}

/** Search by name or email, and filter by area, role and status. */
export function filterPeople(people: Person[], attempts: AuthAttempts[], f: PeopleFilters): Person[] {
  const q = f.query.trim().toLowerCase();
  return people
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
    .filter((p) => f.areaId === 'all' || p.areaId === f.areaId)
    .filter((p) => f.role === 'all' || p.role === f.role)
    .filter((p) => f.status === 'all' || personStatus(p, attempts) === f.status)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
