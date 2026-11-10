/**
 * Simulated authentication (CLAUDE.md F0). This is interface simulation only: it does
 * not protect anything, because everything runs in the browser (see docs/security.md).
 * Real-world rules it mirrors:
 * - generic credential errors, never revealing whether an email exists
 * - lockout after N failed attempts, for any email (existing or not), with no self-unlock
 * - MFA required for HR and IT, optional for the rest (D-03)
 * - every step recorded in the audit log
 * The demo password is a published constant (CLAUDE.md F0) and is never stored.
 */
import { addDays, DEMO_TODAY, demoNow } from '@/lib/dates';
import { homePath } from '@/lib/permissions';
import { useDataStore } from '@/store/data-store';
import { type AuthMethod, type LogoutReason, useSessionStore } from '@/store/session-store';
import type { AccessRequest, AccessRequestReason, Person, Role, Session } from '@/types/domain';

export const DEMO_PASSWORD = 'Demo.2026!';
export const DEMO_MFA_CODE = '246810';
export const DEMO_BACKUP_CODE = '48217730';
export const REMEMBER_DEVICE_DAYS = 30;

/** The four demo users, one per role (CLAUDE.md section 4). */
export const DEMO_ACCOUNTS: { personId: string; role: Role }[] = [
  { personId: 'p-carla', role: 'admin' },
  { personId: 'p-martin', role: 'manager' },
  { personId: 'p-sofia', role: 'hire' },
  { personId: 'p-diego', role: 'it_admin' },
];

const data = () => useDataStore.getState();
const session = () => useSessionStore.getState();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function findDemoPerson(personId: string): Person | undefined {
  return data().people.find((p) => p.id === personId);
}

function demoAccountByEmail(email: string): Person | undefined {
  const person = data().people.find((p) => p.email === normalizeEmail(email));
  return person && DEMO_ACCOUNTS.some((a) => a.personId === person.id) ? person : undefined;
}

export function isLocked(email: string): boolean {
  return data().authAttempts.some((a) => a.email === normalizeEmail(email) && a.locked);
}

function audit(actorId: string, action: string, result: 'success' | 'failure' | 'denied' = 'success', extra: { resource?: string; detail?: string } = {}) {
  data().logAudit({ actorId, action, result, ...extra });
}

const METHOD_LABEL: Record<AuthMethod, string> = {
  sso_microsoft: 'SSO Microsoft',
  sso_google: 'SSO Google Workspace',
  password: 'Correo y contraseña',
};

export type SignInStep =
  | { status: 'invalid'; failedCount: number }
  | { status: 'locked' }
  | { status: 'new_password' }
  | { status: 'mfa' }
  | { status: 'signed_in'; path: string };

// ---------- First factor ----------

/** Email and password. Errors are generic; attempts are counted per email, existing or not. */
export function signInWithPassword(email: string, password: string): SignInStep {
  const key = normalizeEmail(email);
  if (isLocked(key)) {
    audit('anonymous', 'auth.login_failed', 'failure', { resource: key, detail: 'Cuenta bloqueada' });
    return { status: 'locked' };
  }

  const person = demoAccountByEmail(key);
  if (!person || password !== DEMO_PASSWORD) {
    const policy = data().securityPolicy;
    const previous = data().authAttempts.find((a) => a.email === key);
    const failedCount = (previous?.failedCount ?? 0) + 1;
    const now = demoNow();
    const locked = failedCount >= policy.lockoutAttempts;
    data().setAuthAttempts({ email: key, failedCount, locked, lastAttemptAt: now, lockedAt: locked ? now : undefined });
    audit('anonymous', 'auth.login_failed', 'failure', { resource: key, detail: 'Correo o contraseña incorrectos' });
    if (locked) {
      audit('anonymous', 'auth.account_locked', 'failure', { resource: key, detail: `${failedCount} intentos fallidos` });
      return { status: 'locked' };
    }
    return { status: 'invalid', failedCount };
  }

  data().setAuthAttempts({ email: key, failedCount: 0, locked: false, lastAttemptAt: demoNow() });
  return continueAfterFirstFactor(person, 'password', false);
}

/** Simulated SSO: the identity provider returns the chosen account. */
export function signInWithSso(personId: string, method: Exclude<AuthMethod, 'password'>, demo: boolean): SignInStep {
  const person = findDemoPerson(personId);
  if (!person) return { status: 'invalid', failedCount: 0 };
  if (isLocked(person.email)) {
    audit('anonymous', 'auth.login_failed', 'failure', { resource: person.email, detail: 'Cuenta bloqueada' });
    return { status: 'locked' };
  }
  return continueAfterFirstFactor(person, method, demo);
}

function continueAfterFirstFactor(person: Person, method: AuthMethod, demo: boolean): SignInStep {
  const flags = data().accountFlags[person.id];
  const base = { personId: person.id, role: person.role, method, demo };
  if (flags?.mustChangePassword && method === 'password') {
    session().setPending({ ...base, step: 'new_password' });
    return { status: 'new_password' };
  }
  if (needsMfa(person)) {
    session().setPending({ ...base, step: 'mfa' });
    return { status: 'mfa' };
  }
  return { status: 'signed_in', path: openSession(person, method) };
}

// ---------- Second factor ----------

/** MFA is required for the roles in the policy and optional (on by default) for the rest. */
export function mfaRequired(person: Pick<Person, 'role'>): boolean {
  return data().securityPolicy.mfaRequiredFor.includes(person.role);
}

export function mfaEnabled(person: Pick<Person, 'id' | 'role'>): boolean {
  return mfaRequired(person) || !session().mfaOptOut.includes(person.id);
}

function isDeviceRemembered(personId: string): boolean {
  const until = session().rememberedDevices[personId];
  return until !== undefined && until >= DEMO_TODAY;
}

function needsMfa(person: Person): boolean {
  if (data().accountFlags[person.id]?.mfaReset) return true;
  return mfaEnabled(person) && !isDeviceRemembered(person.id);
}

export type MfaResult = { status: 'invalid' } | { status: 'signed_in'; path: string };

export function verifyMfa(code: string, options: { backup: boolean; remember: boolean }): MfaResult {
  const pending = session().pending;
  const person = pending && findDemoPerson(pending.personId);
  if (!pending || !person || pending.step !== 'mfa') return { status: 'invalid' };

  const expected = options.backup ? DEMO_BACKUP_CODE : DEMO_MFA_CODE;
  if (code.replace(/\D/g, '') !== expected) {
    audit(person.id, 'auth.mfa_failed', 'failure', { detail: options.backup ? 'Código de respaldo' : 'Código de la app' });
    return { status: 'invalid' };
  }

  audit(person.id, 'auth.mfa_verified', 'success', { detail: options.backup ? 'Código de respaldo' : undefined });
  if (data().accountFlags[person.id]?.mfaReset) {
    data().setAccountFlags(person.id, { ...data().accountFlags[person.id], mfaReset: false });
    audit(person.id, 'auth.mfa_relinked');
  }
  if (options.remember) session().rememberDevice(person.id, addDays(DEMO_TODAY, REMEMBER_DEVICE_DAYS));
  return { status: 'signed_in', path: openSession(person, pending.method) };
}

// ---------- Forced password change ----------

export interface PasswordChecks {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  symbol: boolean;
  notPrevious: boolean;
}

/** Live checks of the password policy (CLAUDE.md F0). */
export function checkPassword(password: string, minLength = data().securityPolicy.passwordMinLength): PasswordChecks {
  return {
    minLength: password.length >= minLength,
    uppercase: /[A-ZÁÉÍÓÚÑ]/.test(password),
    lowercase: /[a-záéíóúñ]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/.test(password),
    notPrevious: password.length > 0 && password !== DEMO_PASSWORD,
  };
}

/** 0 (empty) to 4 (strong), from the checks met and the length. */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  const met = Object.values(checkPassword(password)).filter(Boolean).length;
  if (met <= 3) return 1;
  if (met <= 5) return 2;
  return password.length >= 16 ? 4 : 3;
}

export function isPasswordValid(password: string): boolean {
  return Object.values(checkPassword(password)).every(Boolean);
}

/**
 * Accepts the new password and continues to MFA. The new password is validated but
 * never stored (CLAUDE.md 8.2): in the demo, the published demo password keeps working (D-32).
 */
export function completePasswordChange(newPassword: string): SignInStep {
  const pending = session().pending;
  const person = pending && findDemoPerson(pending.personId);
  if (!pending || !person || pending.step !== 'new_password' || !isPasswordValid(newPassword)) {
    return { status: 'invalid', failedCount: 0 };
  }
  data().setAccountFlags(person.id, { ...data().accountFlags[person.id], mustChangePassword: false });
  audit(person.id, 'auth.password_changed');
  return continueAfterFirstFactor(person, pending.method, pending.demo);
}

// ---------- Session ----------

function openSession(person: Person, method: AuthMethod, auditLogin = true): string {
  const now = Date.now();
  const policy = data().securityPolicy;
  const newSession: Session = {
    personId: person.id,
    role: person.role,
    method,
    mfaVerified: true,
    startedAt: new Date(now).toISOString(),
    lastActivityAt: new Date(now).toISOString(),
    expiresAt: new Date(now + policy.sessionIdleMinutes * 60_000).toISOString(),
  };
  session().startSession(newSession);
  if (auditLogin) audit(person.id, 'auth.login', 'success', { detail: METHOD_LABEL[method] });
  const returnTo = session().returnTo;
  session().setReturnTo(null);
  return returnTo ?? homePath(newSession);
}

export function cancelSignIn() {
  session().setPending(null);
}

export function signOut(reason: Exclude<LogoutReason, 'switch' | 'reset'> = 'manual') {
  const current = session().session;
  if (current) audit(current.personId, reason === 'expired' ? 'auth.session_expired' : 'auth.logout');
  session().endSession(reason);
}

/**
 * Demo role selector: closes the current session and opens the demo user's session
 * of the chosen role, without the sign-in steps (CLAUDE.md F0). Recorded in the audit log.
 */
export function switchRole(role: Role): string {
  const account = DEMO_ACCOUNTS.find((a) => a.role === role);
  const person = account && findDemoPerson(account.personId);
  if (!person) return '/login';
  const previous = session().session;
  if (previous) {
    audit(previous.personId, 'demo.switch_role', 'success', { detail: `Cambio a ${person.name}` });
    session().endSession('switch');
  }
  session().setReturnTo(null);
  return openSession(person, 'sso_microsoft');
}

/** "Restablecer demo": seed data back, session closed, demo preferences cleared. */
export function resetDemo() {
  data().resetData();
  session().resetSessionState();
  session().endSession('reset');
  audit('anonymous', 'demo.reset');
}

export function recordAccessDenied(path: string) {
  const current = session().session;
  if (current) audit(current.personId, 'auth.access_denied', 'denied', { resource: path });
}

// ---------- Access help (G4) ----------

export interface AccessRequestInput {
  email: string;
  reason: AccessRequestReason;
  comment?: string;
}

/** Comment that triggers the simulated server error in G4 (CLAUDE.md 2.10). */
export const SIMULATED_ERROR_TRIGGER = '#error';

export class ServiceUnavailableError extends Error {
  constructor() {
    super('service_unavailable');
  }
}

function nextAccessRequestId(requests: AccessRequest[]): string {
  const max = Math.max(0, ...requests.map((r) => Number(r.id.split('-').at(-1)) || 0));
  return `IT-2026-${String(max + 1).padStart(4, '0')}`;
}

/**
 * Creates the request for IT. The confirmation is the same whether the email exists
 * or not; the request only links a person when the email matches one.
 * `simulateFailure` lets G4 show the server error once (retry succeeds).
 */
export function createAccessRequest(input: AccessRequestInput, simulateFailure = false): string {
  if (simulateFailure) throw new ServiceUnavailableError();
  const email = normalizeEmail(input.email);
  const person = data().people.find((p) => p.email === email);
  const comment = input.comment?.replace(SIMULATED_ERROR_TRIGGER, '').trim() || undefined;
  const request: AccessRequest = {
    id: nextAccessRequestId(data().accessRequests),
    email,
    personId: person?.id,
    createdAt: demoNow(),
    reason: input.reason,
    comment,
    status: 'new',
    identityVerified: false,
  };
  data().addAccessRequest(request);
  audit('anonymous', 'access_request.create', 'success', { resource: request.id });
  return request.id;
}
