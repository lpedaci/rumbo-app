import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildSeed, type DemoData } from '@/data/seed';
import { DEMO_TODAY, demoNow } from '@/lib/dates';
import type { IdentityCheck } from '@/lib/access';
import {
  applyPolicyChange,
  decideBlock,
  nextApprovalId,
  pendingPolicyChange,
  policyValueIssue,
} from '@/lib/approvals';
import { applyManagerCheckin, applySelfReview, type ManagerCheckinInput } from '@/lib/checkins';
import { completeTask as completeTaskRule, tasksUnlockedBy } from '@/lib/journey';
import { isEffective, joinerTasks, nextLifecycleId } from '@/lib/lifecycle';
import { needsApproval } from '@/lib/people';
import {
  onAccessRequest,
  onAccessRequestClosed,
  onCheckinCompleted,
  onApprovalDecided,
  onApprovalRequested,
  onComment,
  onLifecycle,
  onLoginReported,
  onPrivacyAnswered,
  onPrivacyRequest,
  onHireCreated,
  onSelfReview,
  onTaskCompleted,
} from '@/lib/notifications';
import type {
  AccessRequest,
  AccessResolutionAction,
  ApprovalRequest,
  Area,
  AccountFlags,
  AuditEvent,
  AuthAttempts,
  CheckinStage,
  Comment,
  Hire,
  JobTitle,
  LifecycleEvent,
  Mood,
  Person,
  PolicyField,
  PrivacyRequest,
  Role,
  SensitiveField,
  Template,
  TemplateVersion,
} from '@/types/domain';

/**
 * Demo data store, persisted in localStorage so changes survive a reload
 * (CLAUDE.md principles). Only demo data is stored: never anything that looks
 * like a password (8.2). Actions are added with the screens that use them.
 */

export const DATA_STORAGE_KEY = 'rumbo-data';
/** Bump when the shape or the seed people change: stored data from older versions is replaced by the seed. */
export const DATA_SCHEMA_VERSION = 13;

interface DataActions {
  /** Appends an audit event (every sensitive action calls this, CLAUDE.md section 7). */
  logAudit: (event: Omit<AuditEvent, 'id' | 'at'> & { at?: string }) => void;
  /** Marks a journey task as done and records who did it. */
  completeTask: (hireId: string, taskId: string, actorId: string) => void;
  /** Replaces the failed-attempt record of an email (created if missing). */
  setAuthAttempts: (record: AuthAttempts) => void;
  /** Sets or clears flags on an account (forced password change, MFA reset). */
  setAccountFlags: (personId: string, flags: AccountFlags) => void;
  /** Adds an access request created from "¿Problemas para iniciar sesión?". */
  addAccessRequest: (request: AccessRequest) => void;
  /** Creates or replaces a template (F2) and records template.create or template.update. */
  saveTemplate: (template: Template, actorId: string) => void;
  /**
   * F8: publishes the working copy as the next version, with its note, and records
   * template.publish. Journeys already created keep their version.
   */
  publishTemplate: (templateId: string, note: string, actorId: string) => void;
  /** F8: copies a published version into the working copy (a new draft) and records template.restore. */
  restoreTemplateVersion: (templateId: string, version: number, actorId: string) => void;
  /** Deletes a template that no journey uses (D-49) and records template.delete. */
  deleteTemplate: (templateId: string, actorId: string) => void;
  /** Adds a new hire and their journey (A3, F3) and records hire.create. */
  addHire: (person: Person, hire: Hire, actorId: string) => void;
  /** N3: the hire sends the self-review of a check-in. */
  submitSelfReview: (
    hireId: string,
    stage: CheckinStage,
    review: { mood: Mood; comment: string },
    actorId: string,
  ) => void;
  /** J3: the manager completes a check-in; an escalation is recorded as checkin.escalate (F5). */
  completeCheckin: (hireId: string, stage: CheckinStage, input: ManagerCheckinInput, actorId: string) => void;
  /** S2: IT opens a new request and starts checking who is asking (status "verifying"). */
  startVerification: (requestId: string, actorId: string) => void;
  /** S2: IT confirms the identity with a call to the registered extension or with the manager. */
  verifyIdentity: (requestId: string, check: IdentityCheck, actorId: string) => void;
  /**
   * S2: IT restores access once the identity is verified: unlocks the account, forces a new
   * password (which also unlocks it, or the person could not sign in) or resets MFA.
   */
  resolveAccessRequest: (
    requestId: string,
    action: Exclude<AccessResolutionAction, 'reject'>,
    note: string,
    actorId: string,
  ) => void;
  /** S2: IT rejects a request with a reason (for example, the identity could not be verified). */
  rejectAccessRequest: (requestId: string, note: string, actorId: string) => void;
  /** S3: IT unlocks a locked account directly. */
  unlockAccount: (email: string, actorId: string) => void;
  /** F9: posts a comment on a task and notifies the mentioned people and the thread. */
  addComment: (input: { hireId: string; hireTaskId: string; authorId: string; body: string; mentions: string[] }) => void;
  /** F9: the author edits their comment (marked as edited). */
  editComment: (commentId: string, body: string, mentions: string[], actorId: string) => void;
  /** F9: the author deletes their comment; the thread keeps a "Comentario eliminado" mark. */
  deleteComment: (commentId: string, actorId: string) => void;
  /** F10: records the acceptance of the privacy notice in force (privacy.consent in the audit). */
  acceptPrivacyNotice: (personId: string, version: string) => void;
  /** F10: the person sends a request about their data; HR is notified. */
  addPrivacyRequest: (request: PrivacyRequest) => void;
  /** F10: HR takes, answers or rejects a request; the answer notifies the person. */
  updatePrivacyRequest: (
    id: string,
    change: { status: PrivacyRequest['status']; response?: string },
    actorId: string,
  ) => void;
  /** F10: records who revealed a masked value, of whom and why (pii.reveal). */
  logPiiReveal: (personId: string, field: SensitiveField, reason: string, actorId: string) => void;
  /** F11: closes one session of the signed-in person (not the current one). */
  revokeSession: (sessionId: string, actorId: string) => void;
  /** F11: closes every session of a person except the current one (own) or all of them (IT). */
  revokeOtherSessions: (personId: string, actorId: string, includeCurrent?: boolean) => void;
  /** F11: "Sí, fui yo": the alert is closed and the session stays. */
  confirmLoginAlert: (alertId: string) => void;
  /**
   * F11: "No fui yo": closes that session, creates an urgent access request for IT and returns
   * its id so the screen can show it.
   */
  reportLoginAlert: (alertId: string) => string | undefined;
  /** F15: HR edits the work data of a person (person.update). */
  updatePerson: (personId: string, change: Partial<Pick<Person, 'name' | 'jobTitle' | 'jobTitleId' | 'managerId'>>, actorId: string) => void;
  /** F15: HR adds a person without an onboarding journey (person.create). */
  addPerson: (person: Person, actorId: string) => void;
  /**
   * F15: changes the platform role. Changes that give or take an admin role (HR or IT) go to a
   * second person (F14) and return the approval id; the rest apply at once.
   */
  changeRole: (personId: string, toRole: Role, reason: string, actorId: string) => string | undefined;
  /** F14: IT proposes a new value for a security policy; it applies only when someone else approves it. */
  requestPolicyChange: (field: PolicyField, toValue: number, reason: string, actorId: string) => string | undefined;
  /**
   * F14: a second person in IT approves or rejects a request. Never the one who asked nor the
   * person it is about; an approved one is applied at once.
   */
  decideApproval: (id: string, decision: 'approved' | 'rejected', note: string, actorId: string) => boolean;
  /** F15: catalogs of areas and job titles. */
  saveArea: (area: Area, actorId: string) => void;
  deleteArea: (areaId: string, actorId: string) => void;
  saveJobTitle: (jobTitle: JobTitle, actorId: string) => void;
  deleteJobTitle: (jobTitleId: string, actorId: string) => void;
  /**
   * F12: HR registers a change of job or a leaver. IT gets the access tasks; a change that is
   * already effective updates the job now, and an effective leaver disables the account and
   * closes its sessions.
   */
  registerLifecycle: (event: LifecycleEvent, actorId: string) => void;
  /** F12: IT marks an access as granted or revoked. */
  completeAccessTask: (eventId: string, taskId: string, actorId: string) => void;
  /** F7: marks one notification as read or unread. */
  setNotificationRead: (id: string, read: boolean) => void;
  /** F7: marks every notification of a person as read. */
  markAllNotificationsRead: (personId: string) => void;
  /** Restores the seed data ("Restablecer demo"). The session is cleared by the session store. */
  resetData: () => void;
}

export type DataState = DemoData & DataActions;

/** F7: notice to the manager when the hire sends a self-review. */
function selfReviewNotice(state: DemoData, hireId: string, stage: CheckinStage) {
  const hire = state.hires.find((h) => h.id === hireId);
  if (!hire) return [];
  return onSelfReview(hire, state.people.find((p) => p.id === hire.personId), stage, demoNow());
}

/** Next access request id, `IT-2026-0142` style (F11 urgent requests). */
function nextAccessRequestId(existing: AccessRequest[]): string {
  const numbers = existing.map((r) => Number(r.id.split('-').at(-1)) || 0);
  return `IT-${DEMO_TODAY.slice(0, 4)}-${String(Math.max(0, ...numbers) + 1).padStart(4, '0')}`;
}

let commentCounter = 0;
function nextCommentId() {
  commentCounter += 1;
  return `cm-${Date.now().toString(36)}-${commentCounter}`;
}

let auditCounter = 0;
function nextAuditId() {
  auditCounter += 1;
  return `ev-${Date.now().toString(36)}-${auditCounter}`;
}

/** Minimal shape check: corrupted or foreign data falls back to the seed (RNF-021). */
export function isValidDemoData(value: unknown): value is DemoData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<DemoData>;
  return (
    Array.isArray(data.people) &&
    Array.isArray(data.templates) &&
    Array.isArray(data.hires) &&
    Array.isArray(data.accessRequests) &&
    Array.isArray(data.auditEvents) &&
    Array.isArray(data.authAttempts) &&
    Array.isArray(data.notifications) &&
    Array.isArray(data.comments) &&
    Array.isArray(data.consents) &&
    Array.isArray(data.privacyRequests) &&
    Array.isArray(data.deviceSessions) &&
    Array.isArray(data.loginAlerts) &&
    Array.isArray(data.areas) &&
    Array.isArray(data.jobTitles) &&
    Array.isArray(data.approvals) &&
    Array.isArray(data.lifecycle) &&
    typeof data.accountFlags === 'object' &&
    data.accountFlags !== null &&
    typeof data.securityPolicy === 'object' &&
    data.securityPolicy !== null
  );
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      ...buildSeed(),

      logAudit: (event) =>
        set((state) => ({
          auditEvents: [...state.auditEvents, { id: nextAuditId(), at: event.at ?? demoNow(), ...event }],
        })),

      completeTask: (hireId, taskId, actorId) =>
        set((state) => {
          const at = demoNow();
          const hire = state.hires.find((h) => h.id === hireId);
          if (!hire) return {};
          const updated = { ...hire, tasks: completeTaskRule(hire.tasks, taskId, actorId, at) };
          // F7: the tasks this one unblocked are announced to whoever has to do them.
          const unlocked = tasksUnlockedBy(updated.tasks, taskId);
          return {
            hires: state.hires.map((h) => (h.id === hireId ? updated : h)),
            notifications: [...state.notifications, ...onTaskCompleted(updated, unlocked, at)],
            auditEvents: [
              ...state.auditEvents,
              { id: nextAuditId(), at, actorId, action: 'task.complete', resource: taskId, result: 'success' },
            ],
          };
        }),

      setAuthAttempts: (record) =>
        set((state) => ({
          authAttempts: [...state.authAttempts.filter((a) => a.email !== record.email), record],
        })),

      setAccountFlags: (personId, flags) =>
        set((state) => ({ accountFlags: { ...state.accountFlags, [personId]: flags } })),

      addAccessRequest: (request) =>
        set((state) => ({
          accessRequests: [...state.accessRequests, request],
          notifications: [...state.notifications, ...onAccessRequest(request, state.people)],
        })),

      saveTemplate: (template, actorId) =>
        set((state) => {
          const exists = state.templates.some((t) => t.id === template.id);
          return {
            templates: exists
              ? state.templates.map((t) => (t.id === template.id ? template : t))
              : [...state.templates, template],
            auditEvents: [
              ...state.auditEvents,
              {
                id: nextAuditId(),
                at: demoNow(),
                actorId,
                action: exists ? 'template.update' : 'template.create',
                resource: template.id,
                result: 'success',
                detail: template.name,
              },
            ],
          };
        }),

      publishTemplate: (templateId, note, actorId) =>
        set((state) => {
          const template = state.templates.find((t) => t.id === templateId);
          if (!template) return {};
          const at = demoNow();
          const version: TemplateVersion = {
            version: (template.versions.at(-1)?.version ?? 0) + 1,
            publishedAt: at,
            publishedBy: actorId,
            note: note.trim(),
            name: template.name,
            jobTitle: template.jobTitle,
            area: template.area,
            tasks: structuredClone(template.tasks),
          };
          return {
            templates: state.templates.map((t) =>
              t.id === templateId ? { ...t, updatedAt: at.slice(0, 10), versions: [...t.versions, version] } : t,
            ),
            auditEvents: [
              ...state.auditEvents,
              {
                id: nextAuditId(),
                at,
                actorId,
                action: 'template.publish',
                resource: templateId,
                result: 'success',
                detail: `${template.name} v${version.version}`,
              },
            ],
          };
        }),

      restoreTemplateVersion: (templateId, versionNumber, actorId) =>
        set((state) => {
          const template = state.templates.find((t) => t.id === templateId);
          const version = template?.versions.find((v) => v.version === versionNumber);
          if (!template || !version) return {};
          const at = demoNow();
          return {
            templates: state.templates.map((t) =>
              t.id === templateId
                ? {
                    ...t,
                    name: version.name,
                    jobTitle: version.jobTitle,
                    area: version.area,
                    tasks: structuredClone(version.tasks),
                    updatedAt: at.slice(0, 10),
                  }
                : t,
            ),
            auditEvents: [
              ...state.auditEvents,
              {
                id: nextAuditId(),
                at,
                actorId,
                action: 'template.restore',
                resource: templateId,
                result: 'success',
                detail: `${template.name} v${versionNumber}`,
              },
            ],
          };
        }),

      deleteTemplate: (templateId, actorId) =>
        set((state) => {
          const template = state.templates.find((t) => t.id === templateId);
          if (!template || state.hires.some((h) => h.templateId === templateId)) return state;
          return {
            templates: state.templates.filter((t) => t.id !== templateId),
            auditEvents: [
              ...state.auditEvents,
              {
                id: nextAuditId(),
                at: demoNow(),
                actorId,
                action: 'template.delete',
                resource: templateId,
                result: 'success',
                detail: template.name,
              },
            ],
          };
        }),

      addHire: (newPerson, hire, actorId) =>
        set((state) => {
          // F12: the job of the catalog that suggests this template gives the access to grant.
          const job = state.jobTitles.find((j) => j.suggestedTemplateId === hire.templateId);
          const person = job ? { ...newPerson, jobTitleId: job.id } : newPerson;
          const joiner: LifecycleEvent = {
            id: nextLifecycleId(state.lifecycle),
            personId: person.id,
            type: 'joiner',
            effectiveDate: hire.startDate,
            createdBy: actorId,
            createdAt: demoNow(),
            toJobTitleId: job?.id,
            accessTasks: joinerTasks(job),
          };
          return {
            people: [...state.people, person],
            hires: [...state.hires, hire],
            lifecycle: [...state.lifecycle, joiner],
            notifications: [
              ...state.notifications,
              ...onHireCreated(hire, person, demoNow()),
              ...onLifecycle(joiner, [...state.people, person]),
            ],
            auditEvents: [
              ...state.auditEvents,
              {
                id: nextAuditId(),
                at: demoNow(),
                actorId,
                action: 'hire.create',
                resource: hire.id,
                result: 'success',
                detail: person.name,
              },
            ],
          };
        }),

      submitSelfReview: (hireId, stage, review, actorId) =>
        set((state) => ({
          hires: state.hires.map((h) => (h.id === hireId ? applySelfReview(h, stage, review, demoNow()) : h)),
          notifications: [...state.notifications, ...selfReviewNotice(state, hireId, stage)],
          auditEvents: [
            ...state.auditEvents,
            {
              id: nextAuditId(),
              at: demoNow(),
              actorId,
              action: 'checkin.self_review',
              resource: `${hireId}-${stage}`,
              result: 'success',
            },
          ],
        })),

      completeCheckin: (hireId, stage, input, actorId) =>
        set((state) => {
          const events: AuditEvent[] = [
            {
              id: nextAuditId(),
              at: demoNow(),
              actorId,
              action: 'checkin.complete',
              resource: `${hireId}-${stage}`,
              result: 'success',
            },
          ];
          if (input.action?.type === 'escalate' && input.results.includes('not_met')) {
            events.push({
              id: nextAuditId(),
              at: demoNow(),
              actorId,
              action: 'checkin.escalate',
              resource: `${hireId}-${stage}`,
              result: 'success',
              detail: input.action.note,
            });
          }
          const hire = state.hires.find((h) => h.id === hireId);
          const person = hire && state.people.find((p) => p.id === hire.personId);
          const escalated = input.action?.type === 'escalate' && input.results.includes('not_met');
          return {
            hires: state.hires.map((h) => (h.id === hireId ? applyManagerCheckin(h, stage, input, demoNow()) : h)),
            notifications: hire
              ? [...state.notifications, ...onCheckinCompleted(hire, person, stage, escalated, demoNow())]
              : state.notifications,
            auditEvents: [...state.auditEvents, ...events],
          };
        }),

      startVerification: (requestId, actorId) =>
        set((state) => ({
          accessRequests: state.accessRequests.map((r) =>
            r.id === requestId && r.status === 'new' ? { ...r, status: 'verifying' as const } : r,
          ),
          auditEvents: [
            ...state.auditEvents,
            {
              id: nextAuditId(),
              at: demoNow(),
              actorId,
              action: 'access_request.start_verification',
              resource: requestId,
              result: 'success',
            },
          ],
        })),

      verifyIdentity: (requestId, check, actorId) =>
        set((state) => ({
          accessRequests: state.accessRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'verifying' as const, identityVerified: true } : r,
          ),
          auditEvents: [
            ...state.auditEvents,
            {
              id: nextAuditId(),
              at: demoNow(),
              actorId,
              action: 'access_request.verify_identity',
              resource: requestId,
              result: 'success',
              detail: check === 'callback' ? 'Llamada al interno registrado' : 'Validación con el jefe directo',
            },
          ],
        })),

      resolveAccessRequest: (requestId, action, note, actorId) =>
        set((state) => {
          const request = state.accessRequests.find((r) => r.id === requestId);
          if (!request || !request.identityVerified) return {};
          const at = demoNow();
          const email = request.email.toLowerCase();
          const person = state.people.find((p) => p.id === request.personId || p.email.toLowerCase() === email);
          const unlocks = action === 'unlock' || action === 'force_password_reset';
          const flags = person ? state.accountFlags[person.id] : undefined;
          return {
            notifications: [...state.notifications, ...onAccessRequestClosed(request, true, at)],
            accessRequests: state.accessRequests.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    status: 'resolved' as const,
                    resolution: { action, by: actorId, at, note: note || undefined },
                  }
                : r,
            ),
            authAttempts: unlocks
              ? state.authAttempts.map((a) =>
                  a.email.toLowerCase() === email
                    ? { email: a.email, failedCount: 0, locked: false, lastAttemptAt: a.lastAttemptAt }
                    : a,
                )
              : state.authAttempts,
            accountFlags:
              person && action !== 'unlock'
                ? {
                    ...state.accountFlags,
                    [person.id]: {
                      ...flags,
                      ...(action === 'force_password_reset' ? { mustChangePassword: true } : { mfaReset: true }),
                    },
                  }
                : state.accountFlags,
            auditEvents: [
              ...state.auditEvents,
              {
                id: nextAuditId(),
                at,
                actorId,
                action: `account.${action}`,
                resource: request.email,
                result: 'success',
              },
              {
                id: nextAuditId(),
                at,
                actorId,
                action: 'access_request.resolve',
                resource: requestId,
                result: 'success',
                detail: note || undefined,
              },
            ],
          };
        }),

      rejectAccessRequest: (requestId, note, actorId) =>
        set((state) => {
          const at = demoNow();
          const request = state.accessRequests.find((r) => r.id === requestId);
          return {
            notifications: request
              ? [...state.notifications, ...onAccessRequestClosed(request, false, at)]
              : state.notifications,
            accessRequests: state.accessRequests.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    status: 'rejected' as const,
                    resolution: { action: 'reject' as const, by: actorId, at, note },
                  }
                : r,
            ),
            auditEvents: [
              ...state.auditEvents,
              {
                id: nextAuditId(),
                at,
                actorId,
                action: 'access_request.reject',
                resource: requestId,
                result: 'success',
                detail: note,
              },
            ],
          };
        }),

      unlockAccount: (email, actorId) =>
        set((state) => ({
          authAttempts: state.authAttempts.map((a) =>
            a.email.toLowerCase() === email.toLowerCase()
              ? { email: a.email, failedCount: 0, locked: false, lastAttemptAt: a.lastAttemptAt }
              : a,
          ),
          auditEvents: [
            ...state.auditEvents,
            { id: nextAuditId(), at: demoNow(), actorId, action: 'account.unlock', resource: email, result: 'success' },
          ],
        })),

      addComment: (input) =>
        set((state) => {
          const hire = state.hires.find((h) => h.id === input.hireId);
          const task = hire?.tasks.find((x) => x.id === input.hireTaskId);
          if (!hire || !task) return {};
          const comment: Comment = { ...input, body: input.body.trim(), id: nextCommentId(), createdAt: demoNow() };
          const earlier = state.comments.filter((c) => c.hireTaskId === task.id).map((c) => c.authorId);
          const author = state.people.find((p) => p.id === input.authorId)?.name ?? '';
          return {
            comments: [...state.comments, comment],
            notifications: [...state.notifications, ...onComment(hire, task, comment, earlier, author)],
          };
        }),

      editComment: (commentId, body, mentions, actorId) =>
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId && c.authorId === actorId && !c.deletedAt
              ? { ...c, body: body.trim(), mentions, editedAt: demoNow() }
              : c,
          ),
        })),

      deleteComment: (commentId, actorId) =>
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId && c.authorId === actorId ? { ...c, body: '', mentions: [], deletedAt: demoNow() } : c,
          ),
        })),

      acceptPrivacyNotice: (personId, version) =>
        set((state) => {
          const at = demoNow();
          return {
            consents: [...state.consents.filter((c) => c.personId !== personId), { personId, noticeVersion: version, acceptedAt: at }],
            auditEvents: [
              ...state.auditEvents,
              { id: nextAuditId(), at, actorId: personId, action: 'privacy.consent', resource: version, result: 'success' },
            ],
          };
        }),

      addPrivacyRequest: (request) =>
        set((state) => {
          const name = state.people.find((p) => p.id === request.personId)?.name ?? '';
          return {
            privacyRequests: [...state.privacyRequests, request],
            notifications: [...state.notifications, ...onPrivacyRequest(request, state.people, name)],
            auditEvents: [
              ...state.auditEvents,
              {
                id: nextAuditId(),
                at: request.createdAt,
                actorId: request.personId,
                action: 'privacy_request.create',
                resource: request.id,
                result: 'success',
                detail: request.type,
              },
            ],
          };
        }),

      updatePrivacyRequest: (id, change, actorId) =>
        set((state) => {
          const request = state.privacyRequests.find((r) => r.id === id);
          if (!request) return {};
          const at = demoNow();
          const closes = change.status === 'answered' || change.status === 'rejected';
          const updated: PrivacyRequest = {
            ...request,
            status: change.status,
            handledBy: actorId,
            response: change.response?.trim() || request.response,
            answeredAt: closes ? at : request.answeredAt,
          };
          return {
            privacyRequests: state.privacyRequests.map((r) => (r.id === id ? updated : r)),
            notifications: closes ? [...state.notifications, ...onPrivacyAnswered(updated, at)] : state.notifications,
            auditEvents: [
              ...state.auditEvents,
              {
                id: nextAuditId(),
                at,
                actorId,
                action: `privacy_request.${change.status}`,
                resource: id,
                result: 'success',
              },
            ],
          };
        }),

      logPiiReveal: (personId, field, reason, actorId) =>
        set((state) => ({
          auditEvents: [
            ...state.auditEvents,
            {
              id: nextAuditId(),
              at: demoNow(),
              actorId,
              action: 'pii.reveal',
              resource: `${personId}:${field}`,
              result: 'success',
              detail: reason.trim(),
            },
          ],
        })),

      revokeSession: (sessionId, actorId) =>
        set((state) => {
          const session = state.deviceSessions.find((s) => s.id === sessionId);
          if (!session || session.current || session.revokedAt) return {};
          const at = demoNow();
          return {
            deviceSessions: state.deviceSessions.map((s) =>
              s.id === sessionId ? { ...s, revokedAt: at, revokedBy: actorId } : s,
            ),
            auditEvents: [
              ...state.auditEvents,
              { id: nextAuditId(), at, actorId, action: 'session.revoke', resource: sessionId, result: 'success', detail: `${session.device} · ${session.browser}` },
            ],
          };
        }),

      revokeOtherSessions: (personId, actorId, includeCurrent = false) =>
        set((state) => {
          const at = demoNow();
          const closing = state.deviceSessions.filter(
            (s) => s.personId === personId && !s.revokedAt && (includeCurrent || !s.current),
          );
          if (!closing.length) return {};
          const ids = new Set(closing.map((s) => s.id));
          return {
            deviceSessions: state.deviceSessions.map((s) => (ids.has(s.id) ? { ...s, revokedAt: at, revokedBy: actorId } : s)),
            auditEvents: [
              ...state.auditEvents,
              {
                id: nextAuditId(),
                at,
                actorId,
                action: actorId === personId ? 'session.revoke_others' : 'session.force_close',
                resource: personId,
                result: 'success',
                detail: String(closing.length),
              },
            ],
          };
        }),

      confirmLoginAlert: (alertId) =>
        set((state) => {
          const alert = state.loginAlerts.find((a) => a.id === alertId);
          if (!alert) return {};
          return {
            loginAlerts: state.loginAlerts.map((a) => (a.id === alertId ? { ...a, status: 'confirmed' as const } : a)),
            auditEvents: [
              ...state.auditEvents,
              { id: nextAuditId(), at: demoNow(), actorId: alert.personId, action: 'login_alert.confirm', resource: alert.sessionId, result: 'success' },
            ],
          };
        }),

      reportLoginAlert: (alertId) => {
        const state = useDataStore.getState();
        const alert = state.loginAlerts.find((a) => a.id === alertId);
        const person = alert && state.people.find((p) => p.id === alert.personId);
        if (!alert || !person) return undefined;
        const session = state.deviceSessions.find((s) => s.id === alert.sessionId);
        const at = demoNow();
        const request: AccessRequest = {
          id: nextAccessRequestId(state.accessRequests),
          email: person.email,
          personId: person.id,
          createdAt: at,
          reason: 'unrecognized_login',
          comment: session ? `${session.device} · ${session.browser} · ${session.approxLocation}` : undefined,
          status: 'new',
          identityVerified: false,
          urgent: true,
        };
        set((s) => ({
          loginAlerts: s.loginAlerts.map((a) => (a.id === alertId ? { ...a, status: 'reported' as const, requestId: request.id } : a)),
          deviceSessions: s.deviceSessions.map((d) =>
            d.id === alert.sessionId ? { ...d, revokedAt: at, revokedBy: alert.personId } : d,
          ),
          accessRequests: [...s.accessRequests, request],
          notifications: [...s.notifications, ...onLoginReported(request, s.people, person.name)],
          auditEvents: [
            ...s.auditEvents,
            { id: nextAuditId(), at, actorId: person.id, action: 'login_alert.report', resource: alert.sessionId, result: 'success', detail: request.id },
          ],
        }));
        return request.id;
      },

      updatePerson: (personId, change, actorId) =>
        set((state) => {
          const title = change.jobTitleId ? state.jobTitles.find((j) => j.id === change.jobTitleId) : undefined;
          const area = title ? state.areas.find((a) => a.id === title.areaId) : undefined;
          return {
            people: state.people.map((p) =>
              p.id === personId
                ? { ...p, ...change, ...(area ? { areaId: area.id, area: area.name } : {}) }
                : p,
            ),
            auditEvents: [
              ...state.auditEvents,
              { id: nextAuditId(), at: demoNow(), actorId, action: 'person.update', resource: personId, result: 'success', detail: Object.keys(change).join(', ') },
            ],
          };
        }),

      addPerson: (person, actorId) =>
        set((state) => ({
          people: [...state.people, person],
          auditEvents: [
            ...state.auditEvents,
            { id: nextAuditId(), at: demoNow(), actorId, action: 'person.create', resource: person.id, result: 'success', detail: person.name },
          ],
        })),

      changeRole: (personId, toRole, reason, actorId) => {
        const state = useDataStore.getState();
        const person = state.people.find((p) => p.id === personId);
        if (!person || person.role === toRole) return undefined;
        const at = demoNow();
        if (needsApproval(person.role, toRole)) {
          const approval: ApprovalRequest = {
            id: nextApprovalId(state.approvals),
            action: 'role.change',
            targetId: personId,
            requestedBy: actorId,
            reason: reason.trim(),
            createdAt: at,
            status: 'pending',
            fromRole: person.role,
            toRole,
          };
          set((s) => ({
            approvals: [...s.approvals, approval],
            notifications: [...s.notifications, ...onApprovalRequested(approval, s.people, person.name)],
            auditEvents: [
              ...s.auditEvents,
              { id: nextAuditId(), at, actorId, action: 'approval.request', resource: personId, result: 'success', detail: `${person.role} → ${toRole} · ${approval.id} · ${reason.trim()}` },
            ],
          }));
          return approval.id;
        }
        set((s) => ({
          people: s.people.map((p) => (p.id === personId ? { ...p, role: toRole } : p)),
          auditEvents: [
            ...s.auditEvents,
            { id: nextAuditId(), at, actorId, action: 'person.role_change', resource: personId, result: 'success', detail: `${person.role} → ${toRole} · ${reason.trim()}` },
          ],
        }));
        return undefined;
      },

      requestPolicyChange: (field, toValue, reason, actorId) => {
        const state = useDataStore.getState();
        if (policyValueIssue(field, toValue, state.securityPolicy) || pendingPolicyChange(state.approvals, field)) {
          return undefined;
        }
        const approval: ApprovalRequest = {
          id: nextApprovalId(state.approvals),
          action: 'policy.change',
          targetId: field,
          requestedBy: actorId,
          reason: reason.trim(),
          createdAt: demoNow(),
          status: 'pending',
          fromValue: state.securityPolicy[field],
          toValue,
        };
        set((s) => ({
          approvals: [...s.approvals, approval],
          notifications: [...s.notifications, ...onApprovalRequested(approval, s.people, '')],
          auditEvents: [
            ...s.auditEvents,
            {
              id: nextAuditId(),
              at: approval.createdAt,
              actorId,
              action: 'approval.request',
              resource: field,
              result: 'success',
              detail: `${approval.fromValue} → ${toValue} · ${approval.id} · ${approval.reason}`,
            },
          ],
        }));
        return approval.id;
      },

      decideApproval: (id, decision, note, actorId) => {
        const state = useDataStore.getState();
        const approval = state.approvals.find((a) => a.id === id);
        if (!approval) return false;
        const block = decideBlock(approval, actorId);
        if (block) {
          // A blocked attempt is recorded too (segregation of duties).
          if (block !== 'decided') {
            set((s) => ({
              auditEvents: [
                ...s.auditEvents,
                { id: nextAuditId(), at: demoNow(), actorId, action: `approval.${decision === 'approved' ? 'approve' : 'reject'}`, resource: id, result: 'denied', detail: block },
              ],
            }));
          }
          return false;
        }
        const at = demoNow();
        const decided: ApprovalRequest = {
          ...approval,
          status: decision,
          decidedBy: actorId,
          decidedAt: at,
          decisionNote: note.trim() || undefined,
        };
        const apply = decision === 'approved';
        const target = state.people.find((p) => p.id === approval.targetId);
        const field = approval.targetId as PolicyField;
        set((s) => ({
          approvals: s.approvals.map((a) => (a.id === id ? decided : a)),
          people:
            apply && approval.action === 'role.change' && approval.toRole
              ? s.people.map((p) => (p.id === approval.targetId ? { ...p, role: approval.toRole! } : p))
              : s.people,
          securityPolicy:
            apply && approval.action === 'policy.change' && approval.toValue !== undefined
              ? applyPolicyChange(s.securityPolicy, field, approval.toValue)
              : s.securityPolicy,
          notifications: [...s.notifications, ...onApprovalDecided(decided, s.people)],
          auditEvents: [
            ...s.auditEvents,
            {
              id: nextAuditId(),
              at,
              actorId,
              action: apply ? 'approval.approve' : 'approval.reject',
              resource: id,
              result: 'success',
              detail: decided.decisionNote,
            },
            ...(apply
              ? [
                  approval.action === 'role.change'
                    ? {
                        id: nextAuditId(),
                        at,
                        actorId,
                        action: 'person.role_change',
                        resource: approval.targetId,
                        result: 'success' as const,
                        detail: `${approval.fromRole} → ${approval.toRole} · ${approval.id} · ${target?.name ?? ''}`,
                      }
                    : {
                        id: nextAuditId(),
                        at,
                        actorId,
                        action: 'policy.update',
                        resource: field,
                        result: 'success' as const,
                        detail: `${approval.fromValue} → ${approval.toValue} · ${approval.id}`,
                      },
                ]
              : []),
          ],
        }));
        return true;
      },

      saveArea: (area, actorId) =>
        set((state) => {
          const exists = state.areas.some((a) => a.id === area.id);
          return {
            areas: exists ? state.areas.map((a) => (a.id === area.id ? area : a)) : [...state.areas, area],
            // Renaming an area renames it on every person of the area.
            people: state.people.map((p) => (p.areaId === area.id ? { ...p, area: area.name } : p)),
            auditEvents: [
              ...state.auditEvents,
              { id: nextAuditId(), at: demoNow(), actorId, action: exists ? 'catalog.area_update' : 'catalog.area_create', resource: area.id, result: 'success', detail: area.name },
            ],
          };
        }),

      deleteArea: (areaId, actorId) =>
        set((state) => {
          if (state.people.some((p) => p.areaId === areaId) || state.jobTitles.some((j) => j.areaId === areaId)) return {};
          return {
            areas: state.areas.filter((a) => a.id !== areaId),
            auditEvents: [
              ...state.auditEvents,
              { id: nextAuditId(), at: demoNow(), actorId, action: 'catalog.area_delete', resource: areaId, result: 'success' },
            ],
          };
        }),

      saveJobTitle: (jobTitle, actorId) =>
        set((state) => {
          const exists = state.jobTitles.some((j) => j.id === jobTitle.id);
          const area = state.areas.find((a) => a.id === jobTitle.areaId);
          return {
            jobTitles: exists ? state.jobTitles.map((j) => (j.id === jobTitle.id ? jobTitle : j)) : [...state.jobTitles, jobTitle],
            // Moving a job title to another area moves its people too.
            people: area
              ? state.people.map((p) => (p.jobTitleId === jobTitle.id ? { ...p, areaId: area.id, area: area.name } : p))
              : state.people,
            auditEvents: [
              ...state.auditEvents,
              { id: nextAuditId(), at: demoNow(), actorId, action: exists ? 'catalog.job_update' : 'catalog.job_create', resource: jobTitle.id, result: 'success', detail: jobTitle.name },
            ],
          };
        }),

      deleteJobTitle: (jobTitleId, actorId) =>
        set((state) => {
          if (state.people.some((p) => p.jobTitleId === jobTitleId)) return {};
          return {
            jobTitles: state.jobTitles.filter((j) => j.id !== jobTitleId),
            auditEvents: [
              ...state.auditEvents,
              { id: nextAuditId(), at: demoNow(), actorId, action: 'catalog.job_delete', resource: jobTitleId, result: 'success' },
            ],
          };
        }),

      registerLifecycle: (event, actorId) =>
        set((state) => {
          const at = demoNow();
          const effective = isEffective(event);
          const job = state.jobTitles.find((j) => j.id === event.toJobTitleId);
          const area = job && state.areas.find((a) => a.id === job.areaId);
          return {
            lifecycle: [...state.lifecycle, event],
            people: state.people.map((p) => {
              if (p.id !== event.personId || !effective) return p;
              if (event.type === 'leaver') return { ...p, status: 'offboarded' as const };
              if (event.type === 'mover' && job)
                return { ...p, jobTitleId: job.id, ...(area ? { areaId: area.id, area: area.name } : {}) };
              return p;
            }),
            deviceSessions:
              event.type === 'leaver' && effective
                ? state.deviceSessions.map((s) =>
                    s.personId === event.personId && !s.revokedAt ? { ...s, revokedAt: at, revokedBy: actorId } : s,
                  )
                : state.deviceSessions,
            notifications: [...state.notifications, ...onLifecycle(event, state.people)],
            auditEvents: [
              ...state.auditEvents,
              {
                id: nextAuditId(),
                at,
                actorId,
                action: `lifecycle.${event.type}`,
                resource: event.personId,
                result: 'success',
                detail: `${event.id} · ${event.effectiveDate}`,
              },
            ],
          };
        }),

      completeAccessTask: (eventId, taskId, actorId) =>
        set((state) => {
          const event = state.lifecycle.find((e) => e.id === eventId);
          const task = event?.accessTasks.find((x) => x.id === taskId);
          if (!event || !task || task.status === 'done') return {};
          const at = demoNow();
          return {
            lifecycle: state.lifecycle.map((e) =>
              e.id === eventId
                ? {
                    ...e,
                    accessTasks: e.accessTasks.map((x) =>
                      x.id === taskId ? { ...x, status: 'done' as const, doneBy: actorId, doneAt: at } : x,
                    ),
                  }
                : e,
            ),
            auditEvents: [
              ...state.auditEvents,
              {
                id: nextAuditId(),
                at,
                actorId,
                action: task.action === 'grant' ? 'access.grant' : 'access.revoke',
                resource: event.personId,
                result: 'success',
                detail: `${task.system} · ${event.id}`,
              },
            ],
          };
        }),

      setNotificationRead: (id, read) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, readAt: read ? (n.readAt ?? demoNow()) : undefined } : n,
          ),
        })),

      markAllNotificationsRead: (personId) =>
        set((state) => {
          const at = demoNow();
          return {
            notifications: state.notifications.map((n) =>
              n.recipientId === personId && !n.readAt ? { ...n, readAt: at } : n,
            ),
          };
        }),

      resetData: () => set(buildSeed()),
    }),
    {
      name: DATA_STORAGE_KEY,
      version: DATA_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Persist data only, never functions.
      partialize: ({
        people,
        templates,
        hires,
        accessRequests,
        auditEvents,
        authAttempts,
        accountFlags,
        securityPolicy,
        notifications,
        comments,
        consents,
        privacyRequests,
        deviceSessions,
        loginAlerts,
        areas,
        jobTitles,
        approvals,
        lifecycle,
      }) => ({
        people,
        templates,
        hires,
        accessRequests,
        auditEvents,
        authAttempts,
        accountFlags,
        securityPolicy,
        notifications,
        comments,
        consents,
        privacyRequests,
        deviceSessions,
        loginAlerts,
        areas,
        jobTitles,
        approvals,
        lifecycle,
      }),
      // Older schema versions are not migrated in the demo: they are replaced by fresh seed data.
      migrate: () => buildSeed(),
      merge: (persisted, current) => (isValidDemoData(persisted) ? { ...current, ...persisted } : current),
    },
  ),
);
