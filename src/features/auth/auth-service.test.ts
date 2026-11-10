import { beforeEach, describe, expect, it } from 'vitest';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import {
  checkPassword,
  completePasswordChange,
  createAccessRequest,
  DEMO_BACKUP_CODE,
  DEMO_MFA_CODE,
  DEMO_PASSWORD,
  isLocked,
  passwordStrength,
  resetDemo,
  ServiceUnavailableError,
  signInWithPassword,
  signInWithSso,
  signOut,
  switchRole,
  verifyMfa,
} from './auth-service';

const lastAudit = () => useDataStore.getState().auditEvents.at(-1)!;

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
});

describe('sign in with email and password', () => {
  it('asks for MFA after valid credentials, then opens the session at the role home', () => {
    expect(signInWithPassword('Carla@Nortia.demo ', DEMO_PASSWORD)).toEqual({ status: 'mfa' });
    expect(useSessionStore.getState().pending).toMatchObject({ personId: 'p-carla', step: 'mfa' });
    expect(verifyMfa('000000', { backup: false, remember: false })).toEqual({ status: 'invalid' });
    expect(lastAudit()).toMatchObject({ action: 'auth.mfa_failed', result: 'failure' });
    expect(verifyMfa(DEMO_MFA_CODE, { backup: false, remember: false })).toEqual({ status: 'signed_in', path: '/admin' });
    expect(useSessionStore.getState().session).toMatchObject({ personId: 'p-carla', role: 'admin', mfaVerified: true });
    expect(lastAudit()).toMatchObject({ action: 'auth.login', actorId: 'p-carla' });
  });

  it('returns the same generic result for a wrong password and an unknown email', () => {
    expect(signInWithPassword('carla@nortia.demo', 'x')).toEqual({ status: 'invalid', failedCount: 1 });
    expect(signInWithPassword('nadie@nortia.demo', 'x')).toEqual({ status: 'invalid', failedCount: 1 });
    expect(lastAudit()).toMatchObject({ action: 'auth.login_failed', actorId: 'anonymous', result: 'failure' });
  });

  it('locks any email after 5 failed attempts, with no self-unlock', () => {
    for (let i = 1; i <= 4; i++) expect(signInWithPassword('nadie@nortia.demo', 'x')).toMatchObject({ status: 'invalid' });
    expect(signInWithPassword('nadie@nortia.demo', 'x')).toEqual({ status: 'locked' });
    expect(lastAudit()).toMatchObject({ action: 'auth.account_locked' });
    // Even the right password does not unlock a locked account.
    for (let i = 1; i <= 4; i++) signInWithPassword('martin@nortia.demo', 'x');
    expect(signInWithPassword('martin@nortia.demo', 'x')).toEqual({ status: 'locked' });
    expect(signInWithPassword('martin@nortia.demo', DEMO_PASSWORD)).toEqual({ status: 'locked' });
    expect(isLocked('martin@nortia.demo')).toBe(true);
  });

  it('a successful sign-in resets the failed attempts', () => {
    signInWithPassword('sofia@nortia.demo', 'x');
    signInWithPassword('sofia@nortia.demo', DEMO_PASSWORD);
    expect(useDataStore.getState().authAttempts.find((a) => a.email === 'sofia@nortia.demo')?.failedCount).toBe(0);
  });
});

describe('MFA options', () => {
  it('accepts the backup code and remembers the device for 30 days', () => {
    signInWithSso('p-martin', 'sso_google', false);
    expect(verifyMfa(DEMO_BACKUP_CODE, { backup: true, remember: true })).toMatchObject({ status: 'signed_in' });
    signOut();
    expect(signInWithSso('p-martin', 'sso_google', false)).toEqual({ status: 'signed_in', path: '/manager' });
  });

  it('skips MFA for a manager or hire who turned it off, never for HR or IT', () => {
    useSessionStore.getState().setMfaOptOut('p-sofia', true);
    expect(signInWithSso('p-sofia', 'sso_microsoft', false)).toEqual({ status: 'signed_in', path: '/me' });
    useSessionStore.getState().setMfaOptOut('p-diego', true);
    expect(signInWithSso('p-diego', 'sso_microsoft', false)).toEqual({ status: 'mfa' });
  });

  it('asks to link MFA again after IT resets it, even on a remembered device', () => {
    useSessionStore.getState().rememberDevice('p-sofia', '2026-12-31');
    useDataStore.getState().setAccountFlags('p-sofia', { mfaReset: true });
    expect(signInWithSso('p-sofia', 'sso_microsoft', false)).toEqual({ status: 'mfa' });
    verifyMfa(DEMO_MFA_CODE, { backup: false, remember: false });
    expect(useDataStore.getState().accountFlags['p-sofia']?.mfaReset).toBe(false);
  });
});

describe('forced password change', () => {
  it('requires a new password that meets the policy, then continues to MFA', () => {
    useDataStore.getState().setAccountFlags('p-martin', { mustChangePassword: true });
    expect(signInWithPassword('martin@nortia.demo', DEMO_PASSWORD)).toEqual({ status: 'new_password' });
    expect(completePasswordChange('corta')).toMatchObject({ status: 'invalid' });
    expect(completePasswordChange(DEMO_PASSWORD)).toMatchObject({ status: 'invalid' });
    expect(completePasswordChange('Nueva.Clave.2026')).toEqual({ status: 'mfa' });
    expect(useDataStore.getState().accountFlags['p-martin']?.mustChangePassword).toBe(false);
  });

  it('checks every rule of the policy and rates strength', () => {
    expect(checkPassword('abc')).toEqual({
      minLength: false,
      uppercase: false,
      lowercase: true,
      number: false,
      symbol: false,
      notPrevious: true,
    });
    expect(Object.values(checkPassword('Nueva.Clave.2026')).every(Boolean)).toBe(true);
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('abc')).toBe(1);
    expect(passwordStrength('Nueva.Clave.2026')).toBe(4);
  });
});

describe('session and demo controls', () => {
  it('returns to the requested route after signing in', () => {
    useSessionStore.getState().setReturnTo('/admin/templates');
    signInWithSso('p-carla', 'sso_microsoft', true);
    expect(verifyMfa(DEMO_MFA_CODE, { backup: false, remember: false })).toEqual({
      status: 'signed_in',
      path: '/admin/templates',
    });
  });

  it('switches role, closing the previous session and auditing it', () => {
    switchRole('admin');
    expect(switchRole('it_admin')).toBe('/it/requests');
    expect(useSessionStore.getState().session).toMatchObject({ personId: 'p-diego', role: 'it_admin' });
    const actions = useDataStore.getState().auditEvents.slice(-2).map((e) => e.action);
    expect(actions).toEqual(['demo.switch_role', 'auth.login']);
  });

  it('signs out with a reason and an audit event', () => {
    switchRole('hire');
    signOut('expired');
    expect(useSessionStore.getState().session).toBeNull();
    expect(useSessionStore.getState().lastLogout).toBe('expired');
    expect(lastAudit()).toMatchObject({ action: 'auth.session_expired', actorId: 'p-sofia' });
  });

  it('reset restores the seed and closes the session', () => {
    switchRole('admin');
    signInWithPassword('nadie@nortia.demo', 'x');
    resetDemo();
    expect(useSessionStore.getState().session).toBeNull();
    expect(useDataStore.getState().authAttempts.some((a) => a.email === 'nadie@nortia.demo')).toBe(false);
    expect(lastAudit()).toMatchObject({ action: 'demo.reset' });
  });
});

describe('access requests (G4)', () => {
  it('creates a numbered request, linked only when the email exists', () => {
    const id = createAccessRequest({ email: 'joaquin.benitez@nortia.demo', reason: 'locked' });
    expect(id).toBe('IT-2026-0142');
    const unknown = createAccessRequest({ email: 'nadie@nortia.demo', reason: 'other', comment: 'Hola #error' });
    expect(unknown).toBe('IT-2026-0143');
    const requests = useDataStore.getState().accessRequests;
    expect(requests.find((r) => r.id === id)?.personId).toBe('p-joaquin');
    expect(requests.find((r) => r.id === unknown)).toMatchObject({ personId: undefined, comment: 'Hola', status: 'new' });
  });

  it('can simulate the service being unavailable without creating anything', () => {
    const before = useDataStore.getState().accessRequests.length;
    expect(() => createAccessRequest({ email: 'a@nortia.demo', reason: 'other' }, true)).toThrow(ServiceUnavailableError);
    expect(useDataStore.getState().accessRequests).toHaveLength(before);
  });
});
