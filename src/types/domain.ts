/**
 * Domain model, phase A (CLAUDE.md section 7). Phase B types are added with their features.
 * Dates in data are ISO `YYYY-MM-DD`; timestamps are ISO date-times.
 * Everything here is simulated: there are no real tokens or passwords.
 */

export type Role = 'admin' | 'manager' | 'hire' | 'it_admin';
export type Stage = 'preboarding' | 'week1' | 'month1' | 'days30to90';
export type TaskType = 'task' | 'course' | 'meeting' | 'reading' | 'document';
export type Owner = 'hire' | 'manager' | 'buddy' | 'hr' | 'it' | 'facilities';
/** `blocked` and `overdue` are derived (lib/journey.ts), never stored. */
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'blocked' | 'overdue';
export type StoredTaskStatus = 'pending' | 'in_progress' | 'done';

export interface Person {
  id: string;
  name: string;
  /** Platform role. People without platform access (buddies, future hires) are `hire`. */
  role: Role;
  jobTitle: string;
  area: string;
  email: string;
  managerId?: string;
  avatarUrl?: string;
  /** Employee number given by the company when the hire is created (D-78), for example NOR-1013. */
  employeeId?: string;
  /** Mobile used by IT to verify identity before restoring access (D-78). Fictitious in the demo. */
  mobile?: string;
}

export interface Session {
  personId: string;
  role: Role;
  method: 'sso_microsoft' | 'sso_google' | 'password';
  mfaVerified: boolean;
  startedAt: string;
  lastActivityAt: string;
  expiresAt: string;
}

export interface AuthAttempts {
  email: string;
  failedCount: number;
  locked: boolean;
  lockedAt?: string;
  lastAttemptAt?: string;
}

/**
 * Account flags set by IT when resolving an access request (F6). Simulated: there
 * is no real password or authenticator behind them.
 */
export interface AccountFlags {
  /** IT forced a password change: the person must create a new password on the next sign-in. */
  mustChangePassword?: boolean;
  /** IT reset two-step verification: the person must link the authenticator again. */
  mfaReset?: boolean;
}

export type AccessRequestReason = 'locked' | 'forgot_password' | 'mfa_issue' | 'other';
export type AccessRequestStatus = 'new' | 'verifying' | 'resolved' | 'rejected';
export type AccessResolutionAction = 'unlock' | 'force_password_reset' | 'reset_mfa' | 'reject';

export interface AccessRequest {
  /** For example `IT-2026-0142`. */
  id: string;
  email: string;
  personId?: string;
  createdAt: string;
  reason: AccessRequestReason;
  comment?: string;
  status: AccessRequestStatus;
  identityVerified: boolean;
  resolution?: { action: AccessResolutionAction; by: string; at: string; note?: string };
}

export interface SecurityPolicy {
  mfaRequiredFor: Role[];
  sessionIdleMinutes: number;
  /** Minute at which the "session about to expire" dialog appears. */
  sessionWarningMinutes: number;
  passwordMinLength: number;
  /** No unlock-by-time field: unlocking is always done by IT (CLAUDE.md 7, D-02). */
  lockoutAttempts: number;
}

export type AuditResult = 'success' | 'failure' | 'denied';

export interface AuditEvent {
  id: string;
  at: string;
  /** Person id, or `anonymous` for attempts without a known account. */
  actorId: string;
  /** For example `auth.login`, `template.update`. See AUDIT_ACTIONS. */
  action: string;
  resource?: string;
  result: AuditResult;
  detail?: string;
}

export interface TemplateTask {
  id: string;
  stage: Stage;
  order: number;
  title: string;
  description: string;
  type: TaskType;
  owner: Owner;
  /** Days relative to the start date (negative = before). Range: TASK_OFFSET_MIN..MAX. */
  offsetDays: number;
  /** Ids of TemplateTask in the same template. */
  dependsOn: string[];
  resourceUrl?: string;
}

export interface Template {
  id: string;
  name: string;
  jobTitle: string;
  area: string;
  updatedAt: string;
  tasks: TemplateTask[];
}

export interface HireTask extends Omit<TemplateTask, 'offsetDays'> {
  templateTaskId: string;
  dueDate: string;
  /** Stored status only; use `taskStatus()` to get the derived one. */
  status: StoredTaskStatus;
  completedAt?: string;
  completedBy?: string;
}

export type CheckinStage = 'day30' | 'day60' | 'day90';
export type MilestoneResult = 'met' | 'partial' | 'not_met';
export type Mood = 1 | 2 | 3 | 4 | 5;

export interface Milestone {
  id: string;
  label: string;
  result?: MilestoneResult;
}

export type CheckinAction = { type: 'reschedule'; newDate: string } | { type: 'escalate'; note: string };

export interface Checkin {
  id: string;
  stage: CheckinStage;
  dueDate: string;
  status: 'pending' | 'hire_done' | 'completed';
  hireSelfReview?: { mood: Mood; comment: string; submittedAt: string };
  milestones: Milestone[];
  managerComment?: string;
  nextSteps?: string;
  action?: CheckinAction;
  completedAt?: string;
}

export type HireStatus = 'upcoming' | 'active' | 'completed';

export interface Hire {
  id: string;
  personId: string;
  startDate: string;
  managerId: string;
  buddyId?: string;
  hrId: string;
  templateId: string;
  status: HireStatus;
  tasks: HireTask[];
  checkins: Checkin[];
}
