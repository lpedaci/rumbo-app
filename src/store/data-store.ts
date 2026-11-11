import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildSeed, type DemoData } from '@/data/seed';
import { demoNow } from '@/lib/dates';
import type { IdentityCheck } from '@/lib/access';
import { applyManagerCheckin, applySelfReview, type ManagerCheckinInput } from '@/lib/checkins';
import { completeTask as completeTaskRule, tasksUnlockedBy } from '@/lib/journey';
import {
  onAccessRequest,
  onAccessRequestClosed,
  onCheckinCompleted,
  onHireCreated,
  onSelfReview,
  onTaskCompleted,
} from '@/lib/notifications';
import type {
  AccessRequest,
  AccessResolutionAction,
  AccountFlags,
  AuditEvent,
  AuthAttempts,
  CheckinStage,
  Hire,
  Mood,
  Person,
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
export const DATA_SCHEMA_VERSION = 7;

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

      addHire: (person, hire, actorId) =>
        set((state) => ({
          people: [...state.people, person],
          hires: [...state.hires, hire],
          notifications: [...state.notifications, ...onHireCreated(hire, person, demoNow())],
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
        })),

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
      }),
      // Older schema versions are not migrated in the demo: they are replaced by fresh seed data.
      migrate: () => buildSeed(),
      merge: (persisted, current) => (isValidDemoData(persisted) ? { ...current, ...persisted } : current),
    },
  ),
);
