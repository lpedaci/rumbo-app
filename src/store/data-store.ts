import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildSeed, type DemoData } from '@/data/seed';
import { demoNow } from '@/lib/dates';
import { completeTask as completeTaskRule } from '@/lib/journey';
import type { AccessRequest, AccountFlags, AuditEvent, AuthAttempts } from '@/types/domain';

/**
 * Demo data store, persisted in localStorage so changes survive a reload
 * (CLAUDE.md principles). Only demo data is stored: never anything that looks
 * like a password (8.2). Actions are added with the screens that use them.
 */

export const DATA_STORAGE_KEY = 'rumbo-data';
/** Bump when the shape changes: stored data from older versions is replaced by the seed. */
export const DATA_SCHEMA_VERSION = 3;

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
