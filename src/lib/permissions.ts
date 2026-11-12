import type { Hire, HireTask, Role } from '@/types/domain';

/**
 * Single source of permissions (CLAUDE.md F0): a role × action matrix.
 * Routes, navigation and buttons always ask `can(user, action)`; components never
 * compare role names. The matrix in docs/roles.md and the read-only matrix in S3
 * are generated from PERMISSIONS.
 *
 * Scopes express least privilege in the data:
 * - `all`: everything of that kind
 * - `team`: only the hires the user manages
 * - `own`: only the user's own data
 */
export type Scope = 'all' | 'team' | 'own';

export const ROLES: Role[] = ['admin', 'manager', 'hire', 'it_admin'];

export const PERMISSIONS = {
  // Workspaces (sections of the app). Each role lands on its own.
  'workspace:hr': { admin: 'all' },
  'workspace:team': { manager: 'team' },
  'workspace:journey': { hire: 'own' },
  'workspace:it': { it_admin: 'all' },

  // F4 dashboard
  'dashboard:view': { admin: 'all' },
  // F2 templates
  'template:view': { admin: 'all' },
  'template:edit': { admin: 'all' },
  // F3 hires
  'hire:view': { admin: 'all', manager: 'team', hire: 'own' },
  'hire:create': { admin: 'all' },
  /** Mark tasks as done: HR any task (incl. buddy, IT, Facilities), manager own tasks, hire own tasks. */
  'task:complete': { admin: 'all', manager: 'team', hire: 'own' },
  // F5 check-ins
  'checkin:fill': { manager: 'team' },
  'checkin:self_review': { hire: 'own' },
  'checkin:view_self_review': { admin: 'all', manager: 'team', hire: 'own' },
  'checkin:view_escalations': { admin: 'all' },
  // F6 access and audit (IT only: HR has no access, CLAUDE.md F6)
  'access_request:view': { it_admin: 'all' },
  'access_request:resolve': { it_admin: 'all' },
  'account:unlock': { it_admin: 'all' },
  'audit:view': { it_admin: 'all' },
  'audit:export': { it_admin: 'all' },
  'security:view': { it_admin: 'all' },
  // F9 comments on the tasks of the journeys each role can see (author edits and deletes their own)
  'comment:write': { admin: 'all', manager: 'team', hire: 'own' },
  // F10 privacy: own notice, data and requests; HR handles the requests; revealing masked data
  'privacy:own': { admin: 'own', manager: 'own', hire: 'own', it_admin: 'own' },
  'privacy_request:manage': { admin: 'all' },
  'pii:reveal': { admin: 'all' },
  // F11 sessions: each person their own (in G5); IT sees and closes those of the organization (S3)
  'session:manage': { it_admin: 'all' },
  // F15 people and catalogs (HR); changes to admin roles go through a second person (F14)
  'person:manage': { admin: 'all' },
  'catalog:edit': { admin: 'all' },
  // F12 access lifecycle: HR registers changes and leavers, IT grants and revokes access
  'lifecycle:manage': { admin: 'all' },
  'access_task:complete': { it_admin: 'all' },

  // F14: double approval (the requester can never decide; see lib/approvals)
  'approval:decide': { it_admin: 'all' },
  'policy:propose': { it_admin: 'all' },
  // F7 notifications: each person only sees their own
  'notification:view': { admin: 'own', manager: 'own', hire: 'own', it_admin: 'own' },
  // Own account (G5)
  'account:security_own': { admin: 'own', manager: 'own', hire: 'own', it_admin: 'own' },
  // Demo controls, available to every visitor
  'demo:switch_role': { admin: 'all', manager: 'all', hire: 'all', it_admin: 'all' },
  'demo:reset': { admin: 'all', manager: 'all', hire: 'all', it_admin: 'all' },
} as const satisfies Record<string, Partial<Record<Role, Scope>>>;

export type Action = keyof typeof PERMISSIONS;

export interface Subject {
  personId: string;
  role: Role;
}

/** Scope of an action for a user, or null when not allowed. */
export function scopeOf(user: Subject | null | undefined, action: Action): Scope | null {
  if (!user) return null;
  const byRole = PERMISSIONS[action] as Partial<Record<Role, Scope>>;
  return byRole[user.role] ?? null;
}

export function can(user: Subject | null | undefined, action: Action): boolean {
  return scopeOf(user, action) !== null;
}

/** Least privilege on hires: HR sees all, a manager only their team, a hire only themself. */
export function canViewHire(user: Subject | null | undefined, hire: Pick<Hire, 'personId' | 'managerId'>): boolean {
  switch (scopeOf(user, 'hire:view')) {
    case 'all':
      return true;
    case 'team':
      return hire.managerId === user!.personId;
    case 'own':
      return hire.personId === user!.personId;
    default:
      return false;
  }
}

export function visibleHires<T extends Pick<Hire, 'personId' | 'managerId'>>(user: Subject | null | undefined, hires: T[]): T[] {
  return hires.filter((hire) => canViewHire(user, hire));
}

/** Workspace home routes, in priority order. */
export const WORKSPACE_HOME: { action: Action; path: string }[] = [
  { action: 'workspace:hr', path: '/admin' },
  { action: 'workspace:team', path: '/manager' },
  { action: 'workspace:journey', path: '/me' },
  { action: 'workspace:it', path: '/it/requests' },
];

/** Where a user lands after signing in, from the matrix (not from the role name). */
export function homePath(user: Subject | null | undefined): string {
  return WORKSPACE_HOME.find(({ action }) => can(user, action))?.path ?? '/login';
}

/** Required permission for each internal route prefix. Longest prefix wins. */
export const ROUTE_PERMISSIONS: { prefix: string; action: Action }[] = [
  { prefix: '/admin', action: 'workspace:hr' },
  { prefix: '/manager', action: 'workspace:team' },
  { prefix: '/me', action: 'workspace:journey' },
  { prefix: '/it', action: 'workspace:it' },
  { prefix: '/account/security', action: 'account:security_own' },
  { prefix: '/notifications', action: 'notification:view' },
  { prefix: '/account/privacy', action: 'privacy:own' },
  { prefix: '/admin/privacy-requests', action: 'privacy_request:manage' },
  { prefix: '/admin/people', action: 'person:manage' },
  { prefix: '/admin/lifecycle', action: 'lifecycle:manage' },
  { prefix: '/it/lifecycle', action: 'access_task:complete' },
  { prefix: '/it/approvals', action: 'approval:decide' },
];

export function requiredPermission(pathname: string): Action | null {
  const match = ROUTE_PERMISSIONS.filter(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)).sort(
    (a, b) => b.prefix.length - a.prefix.length,
  )[0];
  return match?.action ?? null;
}

/**
 * Who can mark a journey task as done (CLAUDE.md section 4, D-09): HR any task
 * (including buddy, IT and Facilities tasks), the manager only their own tasks in
 * their team, the hire only their own tasks.
 */
export function canCompleteTask(
  user: Subject | null | undefined,
  hire: Pick<Hire, 'personId' | 'managerId'>,
  task: Pick<HireTask, 'owner'>,
): boolean {
  switch (scopeOf(user, 'task:complete')) {
    case 'all':
      return true;
    case 'team':
      return hire.managerId === user!.personId && task.owner === 'manager';
    case 'own':
      return hire.personId === user!.personId && task.owner === 'hire';
    default:
      return false;
  }
}
