import type { Page } from '@playwright/test';

type Role = 'admin' | 'manager' | 'hire' | 'it_admin';

/**
 * Screens checked by the overflow and accessibility tests.
 * Add every new screen here as it is built (one entry per role screen).
 */
export interface CheckedPage {
  /** File-name friendly id, used for screenshots. */
  id: string;
  /** Hash route. */
  path: string;
  /** Signed-in role for internal screens. */
  role?: Role;
  /** Simulated sign-in in progress (for G3). */
  pendingMfaFor?: Role;
  /** Show the guided welcome of the role (first visit). Seen by default. */
  welcome?: boolean;
}

export const PAGES: CheckedPage[] = [
  { id: 'g0-home', path: '/#/' },
  { id: 'g1-login', path: '/#/login' },
  { id: 'g1-login-preselected', path: '/#/login?demo=martin' },
  { id: 'g2-sso', path: '/#/login/sso?provider=google' },
  { id: 'g2-sso-preselected', path: '/#/login/sso?provider=microsoft&account=p-sofia&demo=1' },
  { id: 'g3-verify', path: '/#/login/verify', pendingMfaFor: 'hire' },
  { id: 'g4-access-help', path: '/#/access-help' },
  { id: 'g5-security', path: '/#/account/security', role: 'manager' },
  { id: 'g7-denied', path: '/#/admin', role: 'hire' },
  { id: 'g7-not-found', path: '/#/no-existe' },
  { id: 'home-admin', path: '/#/admin', role: 'admin' },
  { id: 'a2-hires', path: '/#/admin/hires', role: 'admin' },
  { id: 'a3-hire-new', path: '/#/admin/hires/new', role: 'admin' },
  { id: 'a4-hire', path: '/#/admin/hires/h-sofia', role: 'admin' },
  { id: 'a5-templates', path: '/#/admin/templates', role: 'admin' },
  { id: 'a6-template-editor', path: '/#/admin/templates/tpl-data', role: 'admin' },
  { id: 'a6-template-new', path: '/#/admin/templates/new', role: 'admin' },
  { id: 'a7-template-preview', path: '/#/admin/templates/tpl-data/preview', role: 'admin' },
  { id: 'j1-team', path: '/#/manager', role: 'manager' },
  { id: 'j2-hire', path: '/#/manager/hires/h-sofia', role: 'manager' },
  { id: 'j3-checkin', path: '/#/manager/hires/h-sofia/checkin/day30', role: 'manager' },
  { id: 'n3-self-review', path: '/#/me/checkin/day30', role: 'hire' },
  { id: 'n1-journey', path: '/#/me', role: 'hire' },
  { id: 'n1-welcome', path: '/#/me', role: 'hire', welcome: true },
  { id: 'n2-task-blocked', path: '/#/me/tasks/h-sofia-d17', role: 'hire' },
  { id: 'n2-task-course', path: '/#/me/tasks/h-sofia-d9', role: 'hire' },
  { id: 'n2-task-overdue', path: '/#/me/tasks/h-sofia-d11', role: 'hire' },
  { id: 'home-it', path: '/#/it/requests', role: 'it_admin' },
  { id: 's2-request', path: '/#/it/requests/IT-2026-0141', role: 'it_admin' },
  { id: 's3-security', path: '/#/it/security', role: 'it_admin' },
  { id: 'styleguide', path: '/#/styleguide' },
];

/** CLAUDE.md 2.7: every screen at these widths. */
export const WIDTHS = [320, 375, 768, 1024, 1280, 1440] as const;

const PERSON: Record<Role, string> = {
  admin: 'p-carla',
  manager: 'p-martin',
  hire: 'p-sofia',
  it_admin: 'p-diego',
};

/** Seeds the simulated session in localStorage before the app loads (same shape as the Zustand store). */
export async function prepareSession(page: Page, target: CheckedPage) {
  const now = new Date().toISOString();
  const state = {
    session: target.role
      ? {
          personId: PERSON[target.role],
          role: target.role,
          method: 'sso_microsoft',
          mfaVerified: true,
          startedAt: now,
          lastActivityAt: now,
          expiresAt: now,
        }
      : null,
    pending: target.pendingMfaFor
      ? { personId: PERSON[target.pendingMfaFor], role: target.pendingMfaFor, method: 'sso_microsoft', step: 'mfa', demo: true }
      : null,
    returnTo: null,
    rememberedDevices: {},
    mfaOptOut: [],
    welcomeSeen: target.welcome ? [] : Object.values(PERSON),
  };
  await page.addInitScript((value) => {
    window.localStorage.setItem('rumbo-session', JSON.stringify({ state: value, version: 1 }));
  }, state);
}
