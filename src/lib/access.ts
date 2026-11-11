import type {
  AccessRequest,
  AccessRequestStatus,
  AccessResolutionAction,
  AuditEvent,
  AuthAttempts,
  Person,
} from '@/types/domain';

/**
 * IT access management (CLAUDE.md F6): pure rules for the request inbox (S1, S2) and the
 * security page (S3). The store applies them and records every step in the audit log.
 */

export type RequestFilter = 'all' | AccessRequestStatus;
export const REQUEST_FILTERS: RequestFilter[] = ['all', 'new', 'verifying', 'resolved', 'rejected'];

/** Ways IT confirms who is asking before restoring access (social engineering on the help desk, 8.3). */
export type IdentityCheck = 'callback' | 'manager';

/** Open requests first (new, then in verification), newest first inside each group. */
const STATUS_ORDER: Record<AccessRequestStatus, number> = { new: 0, verifying: 1, resolved: 2, rejected: 3 };

export function sortRequests(requests: AccessRequest[]): AccessRequest[] {
  return [...requests].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.createdAt.localeCompare(a.createdAt),
  );
}

export function filterRequests(requests: AccessRequest[], filter: RequestFilter): AccessRequest[] {
  return sortRequests(filter === 'all' ? requests : requests.filter((r) => r.status === filter));
}

export function countRequests(requests: AccessRequest[]): Record<RequestFilter, number> {
  const counts = Object.fromEntries(REQUEST_FILTERS.map((f) => [f, 0])) as Record<RequestFilter, number>;
  counts.all = requests.length;
  for (const r of requests) counts[r.status] += 1;
  return counts;
}

export function isOpen(request: AccessRequest): boolean {
  return request.status === 'new' || request.status === 'verifying';
}

/** The person behind a request, matched by id or by work email. */
export function requester(request: AccessRequest, people: Person[]): Person | undefined {
  const email = request.email.toLowerCase();
  return people.find((p) => p.id === request.personId) ?? people.find((p) => p.email.toLowerCase() === email);
}

export function attemptsFor(email: string, attempts: AuthAttempts[]): AuthAttempts | undefined {
  return attempts.find((a) => a.email.toLowerCase() === email.toLowerCase());
}

export function lockedAccounts(attempts: AuthAttempts[]): AuthAttempts[] {
  return attempts.filter((a) => a.locked).sort((a, b) => (b.lockedAt ?? '').localeCompare(a.lockedAt ?? ''));
}

/**
 * Actions IT can take on a verified request. A locked account offers "unlock" first;
 * a forgotten password, "force a password change"; an MFA problem, "reset MFA".
 */
export function suggestedAction(request: AccessRequest): Exclude<AccessResolutionAction, 'reject'> {
  switch (request.reason) {
    case 'forgot_password':
      return 'force_password_reset';
    case 'mfa_issue':
      return 'reset_mfa';
    default:
      return 'unlock';
  }
}

// ---------- Audit log (S3) ----------

export type AuditCategory = 'auth' | 'access' | 'account' | 'content' | 'demo';
export const AUDIT_CATEGORIES: AuditCategory[] = ['auth', 'access', 'account', 'content', 'demo'];

export function auditCategory(action: string): AuditCategory {
  if (action.startsWith('auth.')) return 'auth';
  if (action.startsWith('access_request.')) return 'access';
  if (action.startsWith('account.')) return 'account';
  if (action.startsWith('demo.')) return 'demo';
  return 'content';
}

export interface AuditFilters {
  actorId: string | 'all';
  category: AuditCategory | 'all';
  /** Inclusive ISO dates (YYYY-MM-DD); empty means no limit. */
  from: string;
  to: string;
}

export function filterAudit(events: AuditEvent[], filters: AuditFilters): AuditEvent[] {
  return events
    .filter((e) => filters.actorId === 'all' || e.actorId === filters.actorId)
    .filter((e) => filters.category === 'all' || auditCategory(e.action) === filters.category)
    .filter((e) => !filters.from || e.at.slice(0, 10) >= filters.from)
    .filter((e) => !filters.to || e.at.slice(0, 10) <= filters.to)
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** CSV with a header row; every value quoted so commas and quotes in details are safe. */
export function auditCsv(
  events: AuditEvent[],
  labels: { at: string; actor: string; action: string; resource: string; result: string; detail: string },
  nameOf: (actorId: string) => string,
): string {
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const header = [labels.at, labels.actor, labels.action, labels.resource, labels.result, labels.detail];
  const rows = events.map((e) => [e.at, nameOf(e.actorId), e.action, e.resource ?? '', e.result, e.detail ?? '']);
  return [header, ...rows].map((row) => row.map(quote).join(',')).join('\r\n');
}
