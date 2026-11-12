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
  /** F10: sensitive identifiers, fictitious and always shown masked unless revealed with a reason. */
  dni?: string;
  cuil?: string;
  /** Bank account (CBU) for the payroll, 22 digits. */
  bankAccount?: string;
  /** F15: catalog entries. `area` and `jobTitle` keep the display text (the job title can be personal). */
  areaId?: string;
  jobTitleId?: string;
  /** F12: an offboarded person keeps the record but can no longer sign in. Locked is derived (F6). */
  status?: 'active' | 'offboarded';
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

/** `unrecognized_login`: created by "No fui yo" (F11), urgent. */
export type AccessRequestReason = 'locked' | 'forgot_password' | 'mfa_issue' | 'other' | 'unrecognized_login';
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
  /** F11: reported unrecognized sign-in; shown first and marked as urgent in S1. */
  urgent?: boolean;
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
  /** F10: years the journey data is kept after the journey ends, then it is anonymized. */
  retentionJourneyYears: number;
  /** F10: years the self-reviews are kept. */
  retentionSelfReviewYears: number;
  /** F10: version of the privacy notice in force; a new version asks everyone to accept again. */
  privacyNoticeVersion: string;
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

/**
 * A published version of a template (F8): a frozen copy of its details and tasks. Versions are
 * never edited; publishing again adds the next one (D-108).
 */
export interface TemplateVersion {
  version: number;
  publishedAt: string;
  publishedBy: string;
  /** Required version note: what changed and why. */
  note: string;
  name: string;
  jobTitle: string;
  area: string;
  tasks: TemplateTask[];
}

export interface Template {
  id: string;
  name: string;
  jobTitle: string;
  area: string;
  updatedAt: string;
  /**
   * Working copy edited in the builder (A6). It is the draft when it differs from the latest
   * published version, or when the template was never published (D-108).
   */
  tasks: TemplateTask[];
  /** Published versions, oldest first. The last one is the version in force. */
  versions: TemplateVersion[];
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
  /** F8: version of the template the journey was generated from; later versions never change it. */
  templateVersion?: number;
}

// ---------- Phase B: F7 notifications ----------

export type NotificationType =
  | 'task.due_soon'
  | 'task.overdue'
  | 'task.unblocked'
  | 'task.journey_overdue'
  | 'checkin.self_review_pending'
  | 'checkin.self_review_done'
  | 'checkin.manager_due'
  | 'checkin.completed'
  | 'checkin.escalated'
  | 'journey.delayed'
  | 'hire.assigned'
  | 'hire.starting'
  | 'access_request.new'
  | 'account.locked'
  | 'access_request.resolved'
  | 'access_request.rejected'
  | 'comment.new'
  | 'comment.mention'
  | 'privacy_request.new'
  | 'privacy_request.answered'
  | 'login.unusual'
  | 'login.reported'
  | 'approval.pending'
  | 'approval.policy_pending'
  | 'approval.approved'
  | 'approval.rejected'
  | 'access_review.assigned'
  | 'access_review.reminder'
  | 'access_tasks.new'
  | 'offboarding.reminder';

export type NotificationChannel = 'app' | 'email';

/**
 * A notification (F7). Named AppNotification so it never collides with the browser's
 * Notification. Instead of a fixed title and body (CLAUDE.md 7) it keeps its type and the
 * parameters of the message, and the interface translates them (D-105).
 */
export interface AppNotification {
  id: string;
  recipientId: string;
  createdAt: string;
  readAt?: string;
  type: NotificationType;
  /** Values for the message: task title, person name, days of the check-in, request id, dates. */
  params: Record<string, string>;
  /** Route where the action happens, in the recipient's own workspace. */
  link: string;
  channels: NotificationChannel[];
}

// ---------- Phase B: F9 comments ----------

/**
 * A comment on a journey task (F9). Plain text only: React escapes it and it is never turned into
 * HTML. Deleting keeps the record with `deletedAt` so the thread shows "Comentario eliminado".
 */
export interface Comment {
  id: string;
  /** Hire of the task, so a thread is found without scanning every journey. */
  hireId: string;
  hireTaskId: string;
  authorId: string;
  body: string;
  /** Person ids mentioned with @ (people involved in the journey). */
  mentions: string[];
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
}

// ---------- Phase B: F10 privacy ----------

/** Acceptance of the privacy notice, with the version that was accepted (F10). */
export interface ConsentRecord {
  personId: string;
  noticeVersion: string;
  acceptedAt: string;
}

export type PrivacyRequestType = 'access' | 'rectification' | 'deletion';
export type PrivacyRequestStatus = 'new' | 'in_progress' | 'answered' | 'rejected';

/** Request about one's personal data (Ley 25.326), handled by HR within a legal deadline (F10). */
export interface PrivacyRequest {
  /** For example `PRIV-2026-0008`. */
  id: string;
  personId: string;
  type: PrivacyRequestType;
  detail: string;
  createdAt: string;
  /** Legal deadline (ISO date), from PRIVACY_DEADLINES in src/app/legal.ts (Ley 25.326). */
  dueAt: string;
  status: PrivacyRequestStatus;
  response?: string;
  handledBy?: string;
  answeredAt?: string;
}

export type SensitiveField = 'dni' | 'cuil' | 'bankAccount';

// ---------- Phase B: F11 sessions and sign-in alerts ----------

/** A signed-in device (F11). Simulated: there are no real tokens behind it. */
export interface DeviceSession {
  id: string;
  personId: string;
  /** Operating system or device, for example "Windows" or "iPhone". */
  device: string;
  kind: 'desktop' | 'mobile';
  browser: string;
  approxLocation: string;
  startedAt: string;
  lastSeenAt: string;
  /** The session of this browser (the one in use). It is closed with "Cerrar sesión". */
  current: boolean;
  revokedAt?: string;
  revokedBy?: string;
}

/** "¿Fuiste tú?" after a sign-in from a new device or place (F11). */
export interface LoginAlert {
  id: string;
  personId: string;
  sessionId: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'reported';
  /** Access request created when the person answered "No fui yo". */
  requestId?: string;
}

// ---------- Phase B: F15 people and catalogs, F14 approvals ----------

export interface Area {
  id: string;
  name: string;
}

/** A job title of the catalog, with the template and access package suggested for it (F15, used by F12). */
export interface JobTitle {
  id: string;
  name: string;
  areaId: string;
  suggestedTemplateId?: string;
  suggestedAccess: string[];
}

/** F14: security policies that change only with a second person's approval. */
export type PolicyField = 'sessionIdleMinutes' | 'lockoutAttempts' | 'passwordMinLength';
export type ApprovalAction = 'role.change' | 'policy.change';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * A sensitive change that needs a second person (F14): who asked, why, and who decided. Whoever
 * asks can never approve it, nor the person the change is about.
 */
export interface ApprovalRequest {
  /** For example `APR-2026-0003`. */
  id: string;
  action: ApprovalAction;
  /** The person (role change) or the policy field (policy change). */
  targetId: string;
  requestedBy: string;
  reason: string;
  createdAt: string;
  status: ApprovalStatus;
  /** Role change: from and to. */
  fromRole?: Role;
  toRole?: Role;
  /** Policy change: current and proposed value. */
  fromValue?: number;
  toValue?: number;
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
}

// ---------- Phase B: F13 access reviews ----------

/** Who reviews a person: the direct manager, or HR (or IT for HR itself) when there is none. */
export type ReviewerVia = 'manager' | 'hr' | 'it';
export type ReviewDecision = 'keep' | 'revoke';

/** One access (a system of the job, or an admin role in Rumbo) of one person, to keep or revoke. */
export interface AccessReviewItem {
  id: string;
  personId: string;
  reviewerId: string;
  via: ReviewerVia;
  kind: 'access' | 'role';
  /** The system name, or the role (`admin`, `it_admin`) when kind is `role`. */
  access: string;
  decision?: ReviewDecision;
  reason?: string;
  decidedAt?: string;
  /** Revoked system: IT executes it (S6). */
  revokedAt?: string;
  revokedBy?: string;
  /** Revoked admin role: the double approval it waits for (F14). */
  approvalId?: string;
}

export interface AccessReviewCampaign {
  /** For example `AR-2026-0001`. */
  id: string;
  name: string;
  /** `company`, or the id of one area (admin accounts always enter). */
  scope: 'company' | { areaId: string };
  dueDate: string;
  createdBy: string;
  createdAt: string;
  status: 'open' | 'closed';
  closedAt?: string;
  closedBy?: string;
  items: AccessReviewItem[];
}

// ---------- Phase B: F12 access lifecycle ----------

/** One access to grant or revoke in a joiner, mover or leaver (F12). */
export interface AccessTask {
  id: string;
  system: string;
  action: 'grant' | 'revoke';
  status: 'pending' | 'done';
  doneBy?: string;
  doneAt?: string;
}

export type LifecycleType = 'joiner' | 'mover' | 'leaver';
export type LeaverType = 'resignation' | 'dismissal' | 'end_of_contract';

/** A joiner, a change of job or area, or a leaver, with the access tasks it creates for IT (F12). */
export interface LifecycleEvent {
  /** For example `LC-2026-0004`. */
  id: string;
  personId: string;
  type: LifecycleType;
  effectiveDate: string;
  createdBy: string;
  createdAt: string;
  /** Mover and leaver: the job before. Joiner and mover: the job after. */
  fromJobTitleId?: string;
  toJobTitleId?: string;
  leaverType?: LeaverType;
  detail?: string;
  accessTasks: AccessTask[];
}
