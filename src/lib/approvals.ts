import type { ApprovalRequest, PolicyField, SecurityPolicy } from '@/types/domain';
import { DEMO_TODAY } from './dates';

/**
 * Double approval rules (F14): a sensitive change waits for a second person in IT. Whoever asked
 * can never decide it, nor the person the change is about.
 */

export const POLICY_FIELDS: PolicyField[] = ['sessionIdleMinutes', 'lockoutAttempts', 'passwordMinLength'];

/**
 * Accepted range of each policy. The password minimum never goes under the 12 characters of the
 * product's policy (CLAUDE.md F0); the session never goes under 5 minutes, because the warning
 * appears 2 minutes before it ends.
 */
export const POLICY_LIMITS: Record<PolicyField, { min: number; max: number }> = {
  sessionIdleMinutes: { min: 5, max: 60 },
  lockoutAttempts: { min: 3, max: 10 },
  passwordMinLength: { min: 12, max: 64 },
};

/** Minutes before the end of the session at which the "about to expire" warning appears. */
export const SESSION_WARNING_LEAD = 2;

export type DecideBlock = 'own' | 'target' | 'decided';

/** Why `actorId` cannot decide this request, or undefined when they can. */
export function decideBlock(approval: ApprovalRequest, actorId: string): DecideBlock | undefined {
  if (approval.status !== 'pending') return 'decided';
  if (approval.requestedBy === actorId) return 'own';
  if (approval.action === 'role.change' && approval.targetId === actorId) return 'target';
  return undefined;
}

export function nextApprovalId(existing: { id: string }[]): string {
  const numbers = existing.map((a) => Number(a.id.split('-').at(-1)) || 0);
  return `APR-${DEMO_TODAY.slice(0, 4)}-${String(Math.max(0, ...numbers) + 1).padStart(4, '0')}`;
}

/** Pending first (oldest first, it has waited longest), then the decided ones (newest first). */
export function sortApprovals(approvals: ApprovalRequest[]): ApprovalRequest[] {
  return [...approvals].sort((a, b) => {
    const pa = a.status === 'pending';
    const pb = b.status === 'pending';
    if (pa !== pb) return pa ? -1 : 1;
    return pa ? a.createdAt.localeCompare(b.createdAt) : (b.decidedAt ?? b.createdAt).localeCompare(a.decidedAt ?? a.createdAt);
  });
}

export function pendingPolicyChange(approvals: ApprovalRequest[], field: PolicyField): ApprovalRequest | undefined {
  return approvals.find((a) => a.action === 'policy.change' && a.targetId === field && a.status === 'pending');
}

/** Issue key of a proposed policy value, or undefined when it can be sent. */
export function policyValueIssue(field: PolicyField, value: number | undefined, policy: SecurityPolicy): string | undefined {
  if (value === undefined || Number.isNaN(value)) return 'approvals.policy.valueRequired';
  const { min, max } = POLICY_LIMITS[field];
  if (!Number.isInteger(value) || value < min || value > max) return 'approvals.policy.valueRange';
  if (value === policy[field]) return 'approvals.policy.valueSame';
  return undefined;
}

/** The policy after an approved change (the session warning moves with the session length). */
export function applyPolicyChange(policy: SecurityPolicy, field: PolicyField, value: number): SecurityPolicy {
  const next = { ...policy, [field]: value };
  if (field === 'sessionIdleMinutes') next.sessionWarningMinutes = value - SESSION_WARNING_LEAD;
  return next;
}
