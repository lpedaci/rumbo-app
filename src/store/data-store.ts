import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildSeed, type DemoData } from '@/data/seed';
import { demoNow } from '@/lib/dates';
import type { IdentityCheck } from '@/lib/access';
import { applyManagerCheckin, applySelfReview, type ManagerCheckinInput } from '@/lib/checkins';
import { completeTask as completeTaskRule } from '@/lib/journey';
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
} from '@/types/domain';

/**
 * Demo data store, persisted in localStorage so changes survive a reload
 * (CLAUDE.md principles). Only demo data is stored: never anything that looks
 * like a password (8.2). Actions are added with the screens that use them.
 */

export const DATA_STORAGE_KEY = 'rumbo-data';
/** Bump when the shape or the seed people change: stored data from older versions is replaced by the seed. */
export const DATA_SCHEMA_VERSION = 5;

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
  /** Restores the seed data ("Restablecer demo"). The session is cleared by the session store. */
  resetData: () => void;
}

export type DataState = DemoData & DataActions;

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
          return {
            hires: state.hires.map((hire) =>
              hire.id === hireId ? { ...hire, tasks: completeTaskRule(hire.tasks, taskId, actorId, at) } : hire,
            ),
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

      addAccessRequest: (request) => set((state) => ({ accessRequests: [...state.accessRequests, request] })),

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
          return {
            hires: state.hires.map((h) => (h.id === hireId ? applyManagerCheckin(h, stage, input, demoNow()) : h)),
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
          return {
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
      }) => ({
        people,
        templates,
        hires,
        accessRequests,
        auditEvents,
        authAttempts,
        accountFlags,
        securityPolicy,
      }),
      // Older schema versions are not migrated in the demo: they are replaced by fresh seed data.
      migrate: () => buildSeed(),
      merge: (persisted, current) => (isValidDemoData(persisted) ? { ...current, ...persisted } : current),
    },
  ),
);
