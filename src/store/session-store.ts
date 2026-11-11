import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Role, Session } from '@/types/domain';

/**
 * Simulated session (CLAUDE.md F0). Everything here is demo state: there are no
 * tokens and no passwords. In production the session would live in HttpOnly
 * cookies issued by the server (docs/security.md).
 */

export type AuthMethod = Session['method'];
export type LogoutReason = 'manual' | 'expired' | 'switch' | 'reset';

/** A sign-in in progress, between the first step and the verified session. */
export interface PendingAuth {
  personId: string;
  role: Role;
  method: AuthMethod;
  step: 'new_password' | 'mfa';
  /** Demo one-click access: the verification code is prefilled. */
  demo: boolean;
}

interface SessionState {
  session: Session | null;
  pending: PendingAuth | null;
  /** Route requested before signing in, to return to it afterwards. */
  returnTo: string | null;
  /** Message for the login screen after signing out. Not persisted. */
  lastLogout: LogoutReason | null;
  /** Devices remembered for 30 days, per person: ISO date until which MFA is skipped. */
  rememberedDevices: Record<string, string>;
  /** People who turned off optional MFA (manager and hire only, D-03). */
  mfaOptOut: string[];
  /** Session warning dialog is open (idle timer). Not persisted. */
  warningOpen: boolean;
  /** People who already saw (or skipped) the guided welcome of their role (F16, 2.2.1). */
  welcomeSeen: string[];
  /** The guided welcome is open. Not persisted. */
  welcomeOpen: boolean;

  setPending: (pending: PendingAuth | null) => void;
  setReturnTo: (path: string | null) => void;
  startSession: (session: Session) => void;
  touch: (at?: number) => void;
  endSession: (reason: LogoutReason) => void;
  clearLastLogout: () => void;
  setWarningOpen: (open: boolean) => void;
  rememberDevice: (personId: string, until: string) => void;
  forgetDevice: (personId: string) => void;
  setMfaOptOut: (personId: string, optOut: boolean) => void;
  resetSessionState: () => void;
  setWelcomeOpen: (open: boolean) => void;
  markWelcomeSeen: (personId: string) => void;
}

export const SESSION_STORAGE_KEY = 'rumbo-session';

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      pending: null,
      returnTo: null,
      lastLogout: null,
      rememberedDevices: {},
      mfaOptOut: [],
      warningOpen: false,
      welcomeSeen: [],
      welcomeOpen: false,

      setPending: (pending) => set({ pending }),
      setReturnTo: (returnTo) => set({ returnTo }),
      startSession: (session) => set({ session, pending: null, lastLogout: null, warningOpen: false }),
      touch: (at = Date.now()) =>
        set((state) =>
          state.session ? { session: { ...state.session, lastActivityAt: new Date(at).toISOString() } } : state,
        ),
      endSession: (reason) => set({ session: null, pending: null, warningOpen: false, lastLogout: reason }),
      clearLastLogout: () => set({ lastLogout: null }),
      setWarningOpen: (warningOpen) => set({ warningOpen }),
      rememberDevice: (personId, until) =>
        set((state) => ({ rememberedDevices: { ...state.rememberedDevices, [personId]: until } })),
      forgetDevice: (personId) =>
        set((state) => {
          const next = { ...state.rememberedDevices };
          delete next[personId];
          return { rememberedDevices: next };
        }),
      setMfaOptOut: (personId, optOut) =>
        set((state) => ({
          mfaOptOut: optOut ? [...new Set([...state.mfaOptOut, personId])] : state.mfaOptOut.filter((id) => id !== personId),
        })),
      resetSessionState: () =>
        set({
          session: null,
          pending: null,
          returnTo: null,
          rememberedDevices: {},
          mfaOptOut: [],
          warningOpen: false,
          welcomeSeen: [],
          welcomeOpen: false,
        }),
      setWelcomeOpen: (welcomeOpen) => set({ welcomeOpen }),
      markWelcomeSeen: (personId) =>
        set((state) => ({ welcomeSeen: [...new Set([...state.welcomeSeen, personId])], welcomeOpen: false })),
    }),
    {
      name: SESSION_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ session, pending, returnTo, rememberedDevices, mfaOptOut, welcomeSeen }) => ({
        session,
        pending,
        returnTo,
        rememberedDevices,
        mfaOptOut,
        welcomeSeen,
      }),
    },
  ),
);

/** Current signed-in subject for permission checks. */
export function useCurrentUser() {
  return useSessionStore((state) => state.session);
}
