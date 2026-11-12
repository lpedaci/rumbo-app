import type {
  AccessReviewCampaign,
  AccessReviewItem,
  ApprovalRequest,
  JobTitle,
  Person,
  ReviewerVia,
} from '@/types/domain';
import { daysBetween, DEMO_TODAY } from './dates';
import { DEMO_PERSON_IDS } from './people';

/**
 * Access review rules (F13). Each person in scope is reviewed by their direct manager; nobody
 * reviews their own access. Without a manager, HR reviews them (and IT reviews HR itself). Admin
 * accounts always enter, whatever the scope, because they carry the highest risk.
 */

const ADMIN_ROLES = new Set(['admin', 'it_admin']);
export const isAdminAccount = (p: Pick<Person, 'role'>) => ADMIN_ROLES.has(p.role);

export function reviewerFor(person: Person, people: Person[]): { reviewerId: string; via: ReviewerVia } | undefined {
  const active = (p: Person) => p.status !== 'offboarded' && p.id !== person.id;
  const manager = people.find((p) => p.id === person.managerId && active(p));
  if (manager) return { reviewerId: manager.id, via: 'manager' };
  const hr = people.find((p) => p.role === 'admin' && active(p));
  if (hr) return { reviewerId: hr.id, via: 'hr' };
  const it = people.find((p) => p.role === 'it_admin' && active(p));
  if (it) return { reviewerId: it.id, via: 'it' };
  return undefined;
}

export function inScope(person: Person, scope: AccessReviewCampaign['scope']): boolean {
  if (person.status === 'offboarded') return false;
  if (scope === 'company' || isAdminAccount(person)) return true;
  return person.areaId === scope.areaId;
}

/** One row per system of the job, plus one for the admin role of an admin account. */
export function buildReviewItems(
  campaignId: string,
  people: Person[],
  jobTitles: JobTitle[],
  scope: AccessReviewCampaign['scope'],
): AccessReviewItem[] {
  const items: AccessReviewItem[] = [];
  for (const person of people.filter((p) => inScope(p, scope))) {
    const reviewer = reviewerFor(person, people);
    if (!reviewer) continue;
    const job = jobTitles.find((j) => j.id === person.jobTitleId);
    const base = { personId: person.id, ...reviewer };
    if (isAdminAccount(person)) {
      items.push({ ...base, id: `${campaignId}-${person.id}-role`, kind: 'role', access: person.role });
    }
    for (const system of job?.suggestedAccess ?? []) {
      items.push({ ...base, id: `${campaignId}-${person.id}-${slug(system)}`, kind: 'access', access: system });
    }
  }
  return items;
}

function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export type ItemState = 'pending' | 'kept' | 'revoke_pending' | 'revoke_in_approval' | 'revoked' | 'revoke_rejected';

/** The state of a row, derived from its decision, its execution and its approval (F14). */
export function itemState(item: AccessReviewItem, approvals: ApprovalRequest[]): ItemState {
  if (!item.decision) return 'pending';
  if (item.decision === 'keep') return 'kept';
  if (item.kind === 'role') {
    const approval = approvals.find((a) => a.id === item.approvalId);
    if (approval?.status === 'approved') return 'revoked';
    if (approval?.status === 'rejected') return 'revoke_rejected';
    return 'revoke_in_approval';
  }
  return item.revokedAt ? 'revoked' : 'revoke_pending';
}

/** Why a row cannot be revoked: the four demo accounts keep their role (D-116). */
export function revokeBlock(item: AccessReviewItem): 'demo_role' | undefined {
  return item.kind === 'role' && DEMO_PERSON_IDS.includes(item.personId) ? 'demo_role' : undefined;
}

export function campaignProgress(items: AccessReviewItem[]): { done: number; total: number; percent: number } {
  const done = items.filter((i) => i.decision).length;
  return { done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0 };
}

export interface ReviewerProgress {
  reviewerId: string;
  via: ReviewerVia;
  people: string[];
  done: number;
  total: number;
}

/** Progress per reviewer and how each one was assigned (manager or HR fallback). */
export function progressByReviewer(items: AccessReviewItem[]): ReviewerProgress[] {
  const map = new Map<string, ReviewerProgress>();
  for (const item of items) {
    const key = `${item.reviewerId}:${item.via}`;
    const row = map.get(key) ?? { reviewerId: item.reviewerId, via: item.via, people: [], done: 0, total: 0 };
    if (!row.people.includes(item.personId)) row.people.push(item.personId);
    row.total += 1;
    if (item.decision) row.done += 1;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => a.done / a.total - b.done / b.total || b.total - a.total);
}

export type CloseBlock = 'undecided' | 'revocations' | 'closed';

/** A campaign closes when every row is decided and every revocation was executed or decided. */
export function closeBlock(campaign: AccessReviewCampaign, approvals: ApprovalRequest[]): CloseBlock | undefined {
  if (campaign.status === 'closed') return 'closed';
  if (campaign.items.some((i) => !i.decision)) return 'undecided';
  const open = campaign.items.map((i) => itemState(i, approvals));
  if (open.some((s) => s === 'revoke_pending' || s === 'revoke_in_approval')) return 'revocations';
  return undefined;
}

export function nextCampaignId(existing: { id: string }[]): string {
  const numbers = existing.map((c) => Number(c.id.split('-').at(-1)) || 0);
  return `AR-${DEMO_TODAY.slice(0, 4)}-${String(Math.max(0, ...numbers) + 1).padStart(4, '0')}`;
}

export function daysToDue(campaign: Pick<AccessReviewCampaign, 'dueDate'>, today = DEMO_TODAY): number {
  return daysBetween(today, campaign.dueDate);
}

/** CSV summary of a campaign (one row per access); every value quoted. */
export function campaignCsv(
  campaign: AccessReviewCampaign,
  approvals: ApprovalRequest[],
  labels: { person: string; access: string; reviewer: string; decision: string; reason: string; date: string },
  text: { nameOf: (id: string) => string; access: (item: AccessReviewItem) => string; state: (state: ItemState) => string },
): string {
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const header = [labels.person, labels.access, labels.reviewer, labels.decision, labels.reason, labels.date];
  const rows = campaign.items.map((i) => [
    text.nameOf(i.personId),
    text.access(i),
    text.nameOf(i.reviewerId),
    text.state(itemState(i, approvals)),
    i.reason ?? '',
    i.decidedAt?.slice(0, 10) ?? '',
  ]);
  return [header, ...rows].map((row) => row.map(quote).join(',')).join('\r\n');
}
